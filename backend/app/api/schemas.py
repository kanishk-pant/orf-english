from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Request Schemas
class StudentCreate(BaseModel):
    name: str

class AssessmentRequest(BaseModel):
    student_name: str
    duration_seconds: float

class CustomAssessmentRequest(BaseModel):
    student_name: str
    target_text: str
    duration_seconds: float

# Response Schemas
class StudentResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssessmentMetrics(BaseModel):
    wcpm: float
    hits: int
    substitutions: int
    insertions: int
    deletions: int
    accuracy_percentage: float
    wer: float

class DetailedErrors(BaseModel):
    substitutions: List[tuple]
    insertions: List[str]
    deletions: List[str]

class AssessmentResponse(BaseModel):
    assessment_id: int
    student_name: str
    transcript: str
    target_text: str
    metrics: AssessmentMetrics
    detailed_errors: DetailedErrors
    assessment_type: str
    duration_seconds: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentAnalytics(BaseModel):
    student_id: int
    student_name: str
    average_wcpm: float
    total_assessments: int
    improvement_trend: str  # "up", "down", "stable"
    recent_assessments: List[AssessmentResponse]

class LeaderboardEntry(BaseModel):
    rank: int
    student_name: str
    average_wcpm: float
    total_assessments: int
    trend: str

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total_students: int

# Error Response
class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None 