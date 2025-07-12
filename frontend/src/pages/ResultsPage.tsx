import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Plus, FileText, BarChart3 } from 'lucide-react';
import { Assessment } from '../services/api';

interface LocationState {
  assessment: Assessment;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  if (!state?.assessment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No assessment results found.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Back to Home
        </button>
      </div>
    );
  }

  const { assessment } = state;
  const { metrics, detailed_errors } = assessment;

  const getReadingLevel = (wcpm: number) => {
    if (wcpm >= 150) return { level: 'Advanced', color: 'text-success-600' };
    if (wcpm >= 120) return { level: 'Proficient', color: 'text-success-600' };
    if (wcpm >= 90) return { level: 'Developing', color: 'text-warning-600' };
    if (wcpm >= 60) return { level: 'Emerging', color: 'text-warning-600' };
    return { level: 'Beginning', color: 'text-error-600' };
  };

  const readingLevel = getReadingLevel(metrics.wcpm);

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
          Assessment Results - {assessment.student_name}
        </h1>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="metric-card">
          <div className="metric-value text-primary-600">{Math.round(metrics.wcpm)}</div>
          <div className="metric-label">WCPM</div>
          <div className="text-xs text-gray-500 mt-1">Words Correct Per Minute</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-success-600">{Math.round(metrics.accuracy_percentage)}%</div>
          <div className="metric-label">Accuracy</div>
          <div className="text-xs text-gray-500 mt-1">Overall Reading Accuracy</div>
        </div>
        <div className="metric-card">
          <div className={`metric-value ${readingLevel.color}`}>{readingLevel.level}</div>
          <div className="metric-label">Reading Level</div>
          <div className="text-xs text-gray-500 mt-1">Performance Category</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-4 bg-success-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-success-600 mr-3" />
            <div>
              <div className="font-semibold text-success-900">{metrics.hits}</div>
              <div className="text-sm text-success-700">Correct Words</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-error-50 rounded-lg">
            <XCircle className="h-6 w-6 text-error-600 mr-3" />
            <div>
              <div className="font-semibold text-error-900">{metrics.deletions}</div>
              <div className="text-sm text-error-700">Missed Words</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-warning-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-warning-600 mr-3" />
            <div>
              <div className="font-semibold text-warning-900">{metrics.substitutions}</div>
              <div className="text-sm text-warning-700">Pronunciation Errors</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-primary-50 rounded-lg">
            <Plus className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <div className="font-semibold text-primary-900">{metrics.insertions}</div>
              <div className="text-sm text-primary-700">Extra Words</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Original Text
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
            <p className="text-gray-800 leading-relaxed">{assessment.target_text}</p>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Generated Transcript
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
            <p className="text-gray-800 leading-relaxed">{assessment.transcript}</p>
          </div>
        </div>
      </div>

      {/* Detailed Errors */}
      {(detailed_errors.substitutions.length > 0 || 
        detailed_errors.insertions.length > 0 || 
        detailed_errors.deletions.length > 0) && (
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Error Analysis</h3>
          
          {detailed_errors.substitutions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-warning-700 mb-2">Pronunciation Errors:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detailed_errors.substitutions.map(([expected, actual], index) => (
                  <div key={index} className="text-sm bg-warning-50 p-2 rounded">
                    <span className="font-medium">"{expected}"</span> → <span className="text-warning-600">"{actual}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailed_errors.deletions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-error-700 mb-2">Missed Words:</h4>
              <div className="flex flex-wrap gap-2">
                {detailed_errors.deletions.map((word, index) => (
                  <span key={index} className="text-sm bg-error-50 text-error-700 px-2 py-1 rounded">
                    "{word}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {detailed_errors.insertions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-primary-700 mb-2">Extra Words:</h4>
              <div className="flex flex-wrap gap-2">
                {detailed_errors.insertions.map((word, index) => (
                  <span key={index} className="text-sm bg-primary-50 text-primary-700 px-2 py-1 rounded">
                    "{word}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment Metadata */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Assessment Type</div>
            <div className="font-medium">{assessment.assessment_type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-medium">{Math.round(assessment.duration_seconds)} seconds</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Date</div>
            <div className="font-medium">{new Date(assessment.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          New Assessment
        </button>
        <button
          onClick={() => navigate('/history')}
          className="btn-secondary"
        >
          View History
        </button>
      </div>
    </div>
  );
};

export default ResultsPage; 