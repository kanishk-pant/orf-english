import uvicorn
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.core.database import get_db, create_tables
from app.models.models import Student, Assessment
from app.services.orf_assessment import ORFAssessment
from app.api.schemas import (
    StudentCreate, StudentResponse, AssessmentRequest, CustomAssessmentRequest,
    AssessmentResponse, StudentAnalytics, LeaderboardResponse
)

load_dotenv()

app = FastAPI(
    title="ORF Assessment API",
    description="AI-powered Oral Reading Fluency Assessment System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Include API routes from the routes module
from app.api.routes import api_router
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ORF Assessment API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 