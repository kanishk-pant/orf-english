# ORF Assessment Application - Product Requirements Document

## 1. Product Overview

### 1.1 Purpose
The ORF (Oral Reading Fluency) Assessment Application is a web-based tool that enables teachers to conduct automated reading assessments in classrooms. The application uses AI-powered speech recognition to evaluate student reading performance, providing immediate feedback on reading fluency metrics and tracking progress over time.

### 1.2 Problem Statement
- Manual reading assessments are time-consuming and subjective
- Teachers need efficient tools to track student reading progress
- Lack of standardized, objective reading evaluation methods
- Difficulty in identifying specific areas where students need improvement

### 1.3 Solution Overview
A responsive web application that:
- Automates reading assessment using AI speech recognition
- Provides immediate, objective reading fluency metrics
- Stores and tracks student progress over time
- Offers both default and custom reading assessments

---

## 2. Target Users

### 2.1 Primary Users
- **Elementary/Middle School Teachers** (Grades 2-8)
- **Reading Specialists**
- **Special Education Teachers**

### 2.2 User Context
- Classroom environment with 20-30 students
- Individual assessment sessions (1-on-1 teacher-student)
- Periodic assessments (weekly/monthly/quarterly)
- Demo presentations to administrators and stakeholders

---

## 3. Key Features & User Flow

### 3.1 Core User Journey
```
1. Teacher enters student name
2. Teacher selects assessment type (default/custom)
3. Student reads displayed paragraph while being recorded
4. AI processes audio and provides results
5. Teacher reviews detailed metrics
6. Optional: View historical data and progress tracking
```

### 3.2 Feature Breakdown

#### 3.2.1 Student Information Entry
- Simple text input for student name
- No login/authentication required
- Immediate access to assessment options

#### 3.2.2 Assessment Selection
- **Option A**: Default paragraph assessment (pre-loaded grade-appropriate text)
- **Option B**: Custom assessment (teacher uploads .txt file)

#### 3.2.3 Reading Assessment Interface
- Clear display of target paragraph
- Prominent Start/Stop recording button
- Real-time recording indicator
- Audio playback option for verification

#### 3.2.4 AI Processing
- Server-side audio processing using Wave2Vec2
- Automatic transcript generation
- Word-level alignment analysis
- Error categorization (hits, substitutions, insertions, deletions)

#### 3.2.5 Results Display
- **Primary Metrics**:
  - WCPM (Words Correct Per Minute)
  - Total correct words (hits)
  - Missed words (deletions)
  - Incorrectly pronounced words (substitutions)
  - Extra words (insertions)
- **Secondary Information**:
  - Overall accuracy percentage
  - Detailed word-by-word breakdown

#### 3.2.6 Data Persistence
- Automatic storage in PostgreSQL database
- Linked to student name (as unique identifier)
- Stores: audio file, transcript, target text, metrics, timestamp

#### 3.2.7 Historical Data & Analytics
- Student-specific average WCPM across all assessments
- Trend graph showing WCPM improvement over time
- Class leaderboard ranked by average WCPM
- Progress tracking visualization

---

## 4. Technical Architecture

### 4.1 Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Audio Recording**: Web Audio API / MediaRecorder
- **Charts**: Chart.js or Recharts
- **HTTP Client**: Axios

#### Backend
- **Framework**: FastAPI (Python)
- **AI/ML**: Wave2Vec2 (Transformers library)
- **Audio Processing**: librosa, torch
- **File Handling**: python-multipart

#### Database
- **Primary DB**: PostgreSQL
- **File Storage**: Local filesystem for audio files

#### Deployment
- **Environment**: Local laptop deployment
- **Containerization**: Docker for easy setup
- **Web Server**: Uvicorn (ASGI)

### 4.2 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web    │    │   FastAPI       │    │   PostgreSQL    │
│   Application  │◄──►│   Backend       │◄──►│   Database      │
│                │    │                 │    │                 │
│ • UI Components│    │ • Wave2Vec2     │    │ • Student Data  │
│ • Audio Record │    │ • Alignment     │    │ • Assessment    │
│ • Charts       │    │ • File Upload   │    │ • Audio Files   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 4.3 Database Schema

```sql
-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    target_text TEXT NOT NULL,
    transcript TEXT NOT NULL,
    audio_file_path VARCHAR(255),
    wcpm FLOAT,
    hits INTEGER,
    substitutions INTEGER,
    insertions INTEGER,
    deletions INTEGER,
    accuracy_percentage FLOAT,
    assessment_type VARCHAR(50), -- 'default' or 'custom'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. API Specification

### 5.1 Core Endpoints

```typescript
// Student Management
POST /api/students                    // Create/get student by name
GET  /api/students/{id}/assessments   // Get student assessment history

// Assessment
POST /api/assess/default              // Process with default paragraph
POST /api/assess/custom               // Process with uploaded paragraph
GET  /api/paragraphs/default          // Get default paragraph

// Analytics
GET  /api/students/{id}/analytics     // Get student analytics
GET  /api/leaderboard                 // Get class leaderboard
```

### 5.2 Request/Response Examples

```typescript
// Assessment request
POST /api/assess/default
{
  "student_name": "John Doe",
  "audio_data": "base64_encoded_audio",
  "duration_seconds": 45.2
}

// Assessment response
{
  "assessment_id": 123,
  "metrics": {
    "wcpm": 85.4,
    "hits": 42,
    "substitutions": 3,
    "insertions": 1,
    "deletions": 2,
    "accuracy": 87.5
  },
  "transcript": "generated transcript...",
  "target_text": "original paragraph..."
}
```

---

## 6. UI Mockups & Screen Designs

### 6.1 Home Screen (Student Entry)
```
┌─────────────────────────────────────────────────────────────────┐
│                    ORF Assessment Tool                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         📚 Welcome to Reading Assessment                        │
│                                                                 │
│         Enter Student Name:                                     │
│         ┌─────────────────────────────────┐                     │
│         │ [Student Name Input Field]      │                     │
│         └─────────────────────────────────┘                     │
│                                                                 │
│         Choose Assessment Type:                                 │
│                                                                 │
│         ┌─────────────────┐  ┌─────────────────┐                │
│         │  📖 Default     │  │  📁 Custom      │                │
│         │  Paragraph      │  │  Upload         │                │
│         │                 │  │                 │                │
│         │  [Start Now]    │  │  [Upload File]  │                │
│         └─────────────────┘  └─────────────────┘                │
│                                                                 │
│                                   [View History] (small link)   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Assessment Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back          Reading Assessment - John Doe                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Instructions: Please read the following paragraph aloud.       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  The quick brown fox jumps over the lazy dog. This         │ │
│ │  sentence contains every letter of the alphabet and        │ │
│ │  is commonly used for typing practice. Reading              │ │
│ │  fluency is an important skill that helps students         │ │
│ │  comprehend text more effectively.                          │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│              Recording Status: Ready                            │
│                                                                 │
│                    ┌─────────────────┐                         │
│                    │   🎤 Start      │                         │
│                    │   Recording     │                         │
│                    └─────────────────┘                         │
│                                                                 │
│              Timer: 00:00            Volume: ████░░             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Processing Screen
```
┌─────────────────────────────────────────────────────────────────┐
│                    Processing Assessment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          ⏳                                     │
│                                                                 │
│              Analyzing speech patterns...                       │
│                                                                 │
│              ████████████████░░░░ 75%                          │
│                                                                 │
│              • Converting audio format                          │
│              • Generating transcript                            │
│              • Analyzing word alignment                         │
│              • Calculating metrics                              │
│                                                                 │
│              Please wait, this may take a few moments...        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Results Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back               Assessment Results - John Doe              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 Performance Summary                                         │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │      WCPM       │ │   Accuracy      │ │ Reading Level   │   │
│  │       85        │ │      87%        │ │    Grade 4      │   │
│  │ Words/Minute    │ │                 │ │   Proficient    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  📊 Detailed Breakdown                                          │
│                                                                 │
│  ✅ Correct Words (Hits): 42                                    │
│  ❌ Missed Words (Deletions): 2                                 │
│  🔄 Incorrect Pronunciation (Substitutions): 3                  │
│  ➕ Extra Words (Insertions): 1                                 │
│                                                                 │
│  📝 Transcript Preview:                                         │
│  "The quick brown fox jumps over the lazy dog this..."         │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  [New Test]     │ │ [View Details]  │ │ [Save & Print]  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│                                    [View Student History] →    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Historical Data Screen
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back              Student Progress - John Doe                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📈 Progress Overview                                           │
│                                                                 │
│  Average WCPM: 82.5    Total Assessments: 5    Improvement: ↗️  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           WCPM Progress Over Time                           │ │
│  │  100│                                        ●              │ │
│  │   90│                              ●      ●                  │ │
│  │   80│                    ●      ●                           │ │
│  │   70│          ●                                            │ │
│  │   60│    ●                                                  │ │
│  │     └─────────────────────────────────────────────────────  │ │
│  │      Jan   Feb   Mar   Apr   May   Jun                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🏆 Class Leaderboard                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Rank │ Student Name    │ Avg WCPM │ Assessments │ Trend    │ │
│  │   1   │ Sarah Johnson   │   92.3   │      8      │    ↗️    │ │
│  │   2   │ Mike Chen       │   89.1   │      6      │    ↗️    │ │
│  │   3   │ John Doe        │   82.5   │      5      │    ↗️    │ │
│  │   4   │ Emma Wilson     │   78.9   │      7      │    →     │ │
│  │   5   │ Alex Rodriguez  │   75.2   │      4      │    ↘️    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│              [Export Data] [Print Report] [New Assessment]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Development Phases

### Phase 1: Core Assessment (MVP)
- Student name input
- Default paragraph assessment
- Audio recording and processing
- Basic results display
- Simple data storage

### Phase 2: Enhanced Features
- Custom paragraph upload
- Detailed word-level analysis
- Improved UI/UX
- Error handling and validation

### Phase 3: Analytics & Tracking
- Historical data visualization
- Progress tracking graphs
- Class leaderboard
- Export functionality

---

## 8. Success Metrics

### 8.1 Technical Metrics
- Audio processing time < 30 seconds
- Assessment completion rate > 95%
- Word Error Rate accuracy within 10% of manual assessment
- System uptime > 99% during demo sessions

### 8.2 User Experience Metrics
- Time to complete assessment < 3 minutes
- User satisfaction score > 4.5/5
- Successful demo completion rate > 90%

---

## 9. Risk Assessment & Mitigation

### 9.1 Technical Risks
- **Audio quality issues**: Implement noise reduction and validation
- **AI model accuracy**: Use confidence scores and manual review options
- **Browser compatibility**: Test across major browsers and devices

### 9.2 User Experience Risks
- **Teacher adoption**: Focus on simple, intuitive interface
- **Student comfort**: Make recording process non-intimidating
- **Demo reliability**: Extensive testing and backup plans

---

## 10. Future Enhancements
- Multi-language support
- Real-time feedback during reading
- Integration with learning management systems
- Advanced analytics and recommendations
- Offline capability for limited internet environments