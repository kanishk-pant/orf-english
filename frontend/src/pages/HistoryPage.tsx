import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, User, Calendar, TrendingUp, TrendingDown, Minus, BarChart3, Eye } from 'lucide-react';
import apiService, { Student, Assessment } from '../services/api';

interface StudentWithAnalytics extends Student {
  average_wcpm?: number;
  total_assessments?: number;
  improvement_trend?: string;
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithAnalytics[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAnalytics | null>(null);
  const [studentAssessments, setStudentAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const allStudents = await apiService.getAllStudents();
      
      // Get analytics for each student
      const studentsWithAnalytics = await Promise.all(
        allStudents.map(async (student) => {
          try {
            const analytics = await apiService.getStudentAnalytics(student.id);
            return {
              ...student,
              average_wcpm: analytics.average_wcpm,
              total_assessments: analytics.total_assessments,
              improvement_trend: analytics.improvement_trend
            };
          } catch (err) {
            // If no assessments exist, return student without analytics
            return {
              ...student,
              average_wcpm: 0,
              total_assessments: 0,
              improvement_trend: 'stable'
            };
          }
        })
      );
      
      setStudents(studentsWithAnalytics);
      setFilteredStudents(studentsWithAnalytics);
    } catch (err) {
      setError('Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentAssessments = async (studentId: number) => {
    try {
      const assessments = await apiService.getStudentAssessments(studentId);
      setStudentAssessments(assessments);
    } catch (err) {
      console.error('Error loading student assessments:', err);
    }
  };

  const handleStudentSelect = async (student: StudentWithAnalytics) => {
    setSelectedStudent(student);
    await loadStudentAssessments(student.id);
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setStudentAssessments([]);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getReadingLevel = (wcpm: number) => {
    if (wcpm >= 150) return { level: 'Advanced', color: 'text-success-600', bgColor: 'bg-success-50' };
    if (wcpm >= 120) return { level: 'Proficient', color: 'text-success-600', bgColor: 'bg-success-50' };
    if (wcpm >= 90) return { level: 'Developing', color: 'text-warning-600', bgColor: 'bg-warning-50' };
    if (wcpm >= 60) return { level: 'Emerging', color: 'text-warning-600', bgColor: 'bg-warning-50' };
    return { level: 'Beginning', color: 'text-error-600', bgColor: 'bg-error-50' };
  };

  if (selectedStudent) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToList}
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Students
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {selectedStudent.name} - Assessment History
          </h1>
        </div>

        {/* Student Summary */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(selectedStudent.average_wcpm || 0)}
              </div>
              <div className="text-sm text-gray-600">Average WCPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {selectedStudent.total_assessments || 0}
              </div>
              <div className="text-sm text-gray-600">Total Assessments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {getTrendIcon(selectedStudent.improvement_trend || 'stable')}
                <span className="ml-1 text-sm font-medium capitalize">
                  {selectedStudent.improvement_trend || 'stable'}
                </span>
              </div>
              <div className="text-sm text-gray-600">Trend</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Joined</div>
              <div className="text-sm font-medium">
                {new Date(selectedStudent.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Assessments List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Assessment History</h3>
          
          {studentAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No assessments found for this student.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentAssessments.map((assessment) => {
                const readingLevel = getReadingLevel(assessment.metrics.wcpm);
                return (
                  <div key={assessment.assessment_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${readingLevel.bgColor} ${readingLevel.color}`}>
                          {readingLevel.level}
                        </div>
                        <span className="text-sm text-gray-600 capitalize">
                          {assessment.assessment_type} Assessment
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600">WCPM</div>
                        <div className="font-semibold text-lg">{Math.round(assessment.metrics.wcpm)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                        <div className="font-semibold text-lg">{Math.round(assessment.metrics.accuracy_percentage)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="font-semibold text-lg">{Math.round(assessment.duration_seconds)}s</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Errors</div>
                        <div className="font-semibold text-lg">
                          {assessment.metrics.substitutions + assessment.metrics.insertions + assessment.metrics.deletions}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigate('/results', { state: { assessment } })}
                        className="flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Home
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Student History
        </h1>
      </div>

      {/* Search */}
      <div className="card mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Students ({filteredStudents.length})
          </h2>
          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="h-4 w-4 mr-1" />
            Average WCPM
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-600 mb-4">{error}</p>
            <button onClick={loadStudents} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm ? 'No students found matching your search.' : 'No students found.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary-600 hover:text-primary-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => {
              const readingLevel = getReadingLevel(student.average_wcpm || 0);
              return (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">
                          {student.total_assessments || 0} assessments
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {Math.round(student.average_wcpm || 0)}
                        </div>
                        <div className="text-sm text-gray-600">WCPM</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${readingLevel.bgColor} ${readingLevel.color}`}>
                          {readingLevel.level}
                        </div>
                        {getTrendIcon(student.improvement_trend || 'stable')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage; 