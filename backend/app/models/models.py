from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    assessments = relationship("Assessment", back_populates="student")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    target_text = Column(Text, nullable=False)
    transcript = Column(Text, nullable=False)
    audio_file_path = Column(String(255))
    wcpm = Column(Float)
    hits = Column(Integer)
    substitutions = Column(Integer)
    insertions = Column(Integer)
    deletions = Column(Integer)
    accuracy_percentage = Column(Float)
    assessment_type = Column(String(50))  # 'default' or 'custom'
    duration_seconds = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    student = relationship("Student", back_populates="assessments") 