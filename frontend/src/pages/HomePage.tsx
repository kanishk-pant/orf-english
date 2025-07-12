import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, Play, Users, BarChart3 } from 'lucide-react';
import apiService from '../services/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartAssessment = async (assessmentType: 'default' | 'custom') => {
    if (!studentName.trim()) {
      setError('Please enter a student name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create or get student
      const student = await apiService.createStudent(studentName.trim());
      
      // Navigate to assessment page with student info
      navigate('/assessment', {
        state: {
          student,
          assessmentType
        }
      });
    } catch (err) {
      setError('Failed to create student. Please try again.');
      console.error('Error creating student:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAssessment = () => {
    if (!studentName.trim()) {
      setError('Please enter a student name');
      return;
    }
    
    // For custom assessment, we'll navigate to a file upload page
    navigate('/assessment', {
      state: {
        studentName: studentName.trim(),
        assessmentType: 'custom'
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <BookOpen className="h-16 w-16 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ORF Assessment Tool
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          AI-powered reading fluency assessment for classrooms. Get instant feedback on student reading performance using advanced speech recognition.
        </p>
      </div>

      {/* Main Form */}
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Start New Assessment
        </h2>

        {/* Student Name Input */}
        <div className="mb-6">
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
            Student Name
          </label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student's full name"
            className="input-field"
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        )}

        {/* Assessment Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Assessment Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Default Assessment */}
            <button
              onClick={() => handleStartAssessment('default')}
              disabled={isLoading}
              className="card hover:shadow-md transition-shadow duration-200 text-left p-4 border-2 border-transparent hover:border-primary-200"
            >
              <div className="flex items-center mb-3">
                <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Default Paragraph</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use our pre-selected grade-appropriate reading passage for quick assessment.
              </p>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                <Play className="h-4 w-4 mr-1" />
                Start Now
              </div>
            </button>

            {/* Custom Assessment */}
            <button
              onClick={handleCustomAssessment}
              disabled={isLoading}
              className="card hover:shadow-md transition-shadow duration-200 text-left p-4 border-2 border-transparent hover:border-primary-200"
            >
              <div className="flex items-center mb-3">
                <Upload className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Custom Upload</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Upload your own text file for personalized reading assessment.
              </p>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </div>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Setting up assessment...</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center mb-3">
            <Users className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="font-semibold text-gray-900">View History</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Review past assessments and track student progress over time.
          </p>
          <button
            onClick={() => navigate('/history')}
            className="btn-secondary"
          >
            View Student History
          </button>
        </div>

        <div className="card">
          <div className="flex items-center mb-3">
            <BarChart3 className="h-6 w-6 text-primary-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Class Leaderboard</h3>
          </div>
          <p className="text-gray-600 mb-4">
            See how students compare and identify top performers in your class.
          </p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="btn-secondary"
          >
            View Leaderboard
          </button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Speech Recognition</h3>
            <p className="text-gray-600 text-sm">
              Advanced Wave2Vec2 model for accurate transcript generation and analysis.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-success-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Metrics</h3>
            <p className="text-gray-600 text-sm">
              Get WCPM, accuracy, and detailed error analysis in seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-warning-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Users className="h-6 w-6 text-warning-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
            <p className="text-gray-600 text-sm">
              Monitor student improvement over time with detailed analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 