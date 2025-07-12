from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.models import Student, Assessment
from app.api.schemas import (
    StudentCreate, StudentResponse, AssessmentRequest, CustomAssessmentRequest,
    AssessmentResponse, StudentAnalytics, LeaderboardResponse, ErrorResponse
)
from app.services.orf_assessment import ORFAssessment
from app.core.config import settings

api_router = APIRouter()
orf_service = ORFAssessment()

# Default passage for assessments
DEFAULT_PASSAGE = """With AI in the picture, developers are already struggling for jobs. Graduates fresh out of college are finding it harder to land a tech job and are actively upskilling themselves for the right roles. But this is just one side of the coin. In India's $250 billion tech industry built with AI, experience is no longer a strength either."""

@api_router.post("/students", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student or get existing student by name"""
    # Check if student already exists
    existing_student = db.query(Student).filter(Student.name == student.name).first()
    if existing_student:
        return existing_student
    
    # Create new student
    db_student = Student(name=student.name)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@api_router.get("/students/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@api_router.get("/paragraphs/default")
def get_default_paragraph():
    """Get the default reading passage"""
    return {"text": DEFAULT_PASSAGE}

@api_router.post("/assess/default", response_model=AssessmentResponse)
async def assess_default_reading(
    student_name: str = Form(...),
    duration_seconds: float = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Process default paragraph assessment"""
    return await process_assessment(
        student_name=student_name,
        target_text=DEFAULT_PASSAGE,
        duration_seconds=duration_seconds,
        audio_file=audio_file,
        assessment_type="default",
        db=db
    )

@api_router.post("/assess/custom", response_model=AssessmentResponse)
async def assess_custom_reading(
    student_name: str = Form(...),
    target_text: str = Form(...),
    duration_seconds: float = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Process custom paragraph assessment"""
    return await process_assessment(
        student_name=student_name,
        target_text=target_text,
        duration_seconds=duration_seconds,
        audio_file=audio_file,
        assessment_type="custom",
        db=db
    )

async def process_assessment(
    student_name: str,
    target_text: str,
    duration_seconds: float,
    audio_file: UploadFile,
    assessment_type: str,
    db: Session
) -> AssessmentResponse:
    """Common assessment processing logic"""
    # Get or create student
    student = db.query(Student).filter(Student.name == student_name).first()
    if not student:
        student = Student(name=student_name)
        db.add(student)
        db.commit()
        db.refresh(student)
    
    # Save audio file
    audio_filename = f"{uuid.uuid4()}.wav"
    audio_path = os.path.join(settings.UPLOAD_DIR, settings.AUDIO_DIR, audio_filename)
    
    with open(audio_path, "wb") as buffer:
        content = await audio_file.read()
        buffer.write(content)
    
    # Validate inputs
    errors = orf_service.validate_inputs(audio_path, target_text)
    if errors:
        raise HTTPException(status_code=400, detail={"error": "Validation failed", "details": errors})
    
    # Process assessment
    try:
        results = orf_service.assess_reading(audio_path, target_text, duration_seconds)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment processing failed: {str(e)}")
    
    # Save to database
    assessment = Assessment(
        student_id=student.id,
        target_text=target_text,
        transcript=results.transcript,
        audio_file_path=audio_path,
        wcpm=results.wcpm,
        hits=results.hits,
        substitutions=results.substitutions,
        insertions=results.insertions,
        deletions=results.deletions,
        accuracy_percentage=results.accuracy * 100,
        assessment_type=assessment_type,
        duration_seconds=duration_seconds
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Prepare response
    metrics = {
        "wcpm": results.wcpm,
        "hits": results.hits,
        "substitutions": results.substitutions,
        "insertions": results.insertions,
        "deletions": results.deletions,
        "accuracy_percentage": results.accuracy * 100,
        "wer": results.wer
    }
    
    detailed_errors = {
        "substitutions": results.detailed_errors["substitutions"],
        "insertions": results.detailed_errors["insertions"],
        "deletions": results.detailed_errors["deletions"]
    }
    
    return AssessmentResponse(
        assessment_id=assessment.id,
        student_name=student.name,
        transcript=results.transcript,
        target_text=target_text,
        metrics=metrics,
        detailed_errors=detailed_errors,
        assessment_type=assessment_type,
        duration_seconds=duration_seconds,
        created_at=assessment.created_at
    )

@api_router.get("/students/{student_id}/assessments", response_model=List[AssessmentResponse])
def get_student_assessments(student_id: int, db: Session = Depends(get_db)):
    """Get all assessments for a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    assessments = db.query(Assessment).filter(Assessment.student_id == student_id).order_by(Assessment.created_at.desc()).all()
    
    response_assessments = []
    for assessment in assessments:
        metrics = {
            "wcpm": assessment.wcpm,
            "hits": assessment.hits,
            "substitutions": assessment.substitutions,
            "insertions": assessment.insertions,
            "deletions": assessment.deletions,
            "accuracy_percentage": assessment.accuracy_percentage,
            "wer": 1 - (assessment.accuracy_percentage / 100)
        }
        
        response_assessments.append(AssessmentResponse(
            assessment_id=assessment.id,
            student_name=student.name,
            transcript=assessment.transcript,
            target_text=assessment.target_text,
            metrics=metrics,
            detailed_errors={"substitutions": [], "insertions": [], "deletions": []},  # Simplified for list view
            assessment_type=assessment.assessment_type,
            duration_seconds=assessment.duration_seconds,
            created_at=assessment.created_at
        ))
    
    return response_assessments

@api_router.get("/students/{student_id}/analytics", response_model=StudentAnalytics)
def get_student_analytics(student_id: int, db: Session = Depends(get_db)):
    """Get analytics for a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    assessments = db.query(Assessment).filter(Assessment.student_id == student_id).order_by(Assessment.created_at.desc()).all()
    
    if not assessments:
        raise HTTPException(status_code=404, detail="No assessments found for student")
    
    # Calculate average WCPM
    total_wcpm = sum(a.wcpm for a in assessments if a.wcpm)
    average_wcpm = total_wcpm / len(assessments) if assessments else 0
    
    # Determine trend (simplified)
    if len(assessments) >= 2:
        recent_wcpm = assessments[0].wcpm or 0
        older_wcpm = assessments[1].wcpm or 0
        if recent_wcpm > older_wcpm:
            trend = "up"
        elif recent_wcpm < older_wcpm:
            trend = "down"
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    return StudentAnalytics(
        student_id=student.id,
        student_name=student.name,
        average_wcpm=average_wcpm,
        total_assessments=len(assessments),
        improvement_trend=trend,
        recent_assessments=[]  # Simplified for now
    )

@api_router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(db: Session = Depends(get_db)):
    """Get class leaderboard"""
    # Get all students with their average WCPM
    students = db.query(Student).all()
    
    leaderboard_entries = []
    for student in students:
        assessments = db.query(Assessment).filter(Assessment.student_id == student.id).all()
        
        if assessments:
            total_wcpm = sum(a.wcpm for a in assessments if a.wcpm)
            average_wcpm = total_wcpm / len(assessments)
            
            leaderboard_entries.append({
                "rank": 0,  # Will be set after sorting
                "student_name": student.name,
                "average_wcpm": average_wcpm,
                "total_assessments": len(assessments),
                "trend": "stable"  # Simplified
            })
    
    # Sort by average WCPM and assign ranks
    leaderboard_entries.sort(key=lambda x: x["average_wcpm"], reverse=True)
    for i, entry in enumerate(leaderboard_entries):
        entry["rank"] = i + 1
    
    return LeaderboardResponse(
        entries=leaderboard_entries,
        total_students=len(leaderboard_entries)
    ) 