# ORF Assessment Application

An AI-powered web application for conducting Oral Reading Fluency (ORF) assessments in classrooms using Wave2Vec2 speech recognition.

## 🚀 Features

- **Automated Reading Assessment**: Uses AI speech recognition to evaluate student reading performance
- **Real-time Metrics**: Provides immediate feedback on WCPM, accuracy, and detailed error analysis
- **Progress Tracking**: Historical data visualization and student progress monitoring
- **Custom Assessments**: Support for both default and custom reading passages
- **Class Analytics**: Leaderboard and class-wide performance insights

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Web Audio API** for recording

### Backend
- **FastAPI** (Python) for API server
- **Wave2Vec2** for speech recognition
- **PostgreSQL** for data storage
- **Docker** for containerization

## 📦 Installation

### Prerequisites
- Docker and Docker Compose
- Modern web browser with microphone access

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ORF_v0
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup (Alternative)

If you prefer to run without Docker:

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Set up PostgreSQL database
   createdb orf_assessment
   
   # Run migrations
   python -m alembic upgrade head
   
   # Start the server
   python main.py
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 🎯 Usage

### Getting Started

1. **Open the Application**: Navigate to http://localhost:3000 in your browser
2. **Enter Student Name**: Type the student's full name in the input field
3. **Choose Assessment Type**:
   - **Default Paragraph**: Use pre-selected grade-appropriate text
   - **Custom Upload**: Upload your own text file or paste custom text

### Conducting an Assessment

1. **Start Recording**: Click "Start Recording" and allow microphone access
2. **Read Aloud**: Student reads the displayed passage clearly
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Submit Assessment**: Click "Submit Assessment" to process results

### Understanding Results

The system provides comprehensive metrics:

- **WCPM (Words Correct Per Minute)**: Primary fluency indicator
- **Accuracy Percentage**: Overall reading accuracy
- **Detailed Breakdown**: Hits, substitutions, insertions, deletions
- **Reading Level**: Performance category (Beginning, Emerging, Developing, Proficient, Advanced)
- **Transcript Comparison**: Side-by-side view of original text vs. generated transcript

### Features

- **Real-time Recording**: Live audio recording with timer
- **AI Speech Recognition**: Advanced Wave2Vec2 model for accurate transcription
- **Instant Analysis**: Results available in seconds
- **Progress Tracking**: Historical data and analytics (coming in Phase 2)
- **Class Leaderboard**: Compare student performance (coming in Phase 3)

## 📊 Metrics Calculated

- **WCPM**: Words Correct Per Minute
- **Accuracy**: Overall reading accuracy percentage
- **Hits**: Correctly pronounced words
- **Substitutions**: Incorrectly pronounced words
- **Insertions**: Extra words added
- **Deletions**: Missed words

## 🔧 Development

### Project Structure
```
ORF_v0/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   └── services/       # Business logic
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml      # Docker setup
└── README.md
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request 