import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Plus, FileText, BarChart3, Download, Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Assessment } from '../services/api';

interface LocationState {
  assessment: Assessment;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

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
    if (wcpm >= 150) return { level: 'Advanced', color: 'text-success-600', bgColor: 'bg-success-50', borderColor: 'border-success-200' };
    if (wcpm >= 120) return { level: 'Proficient', color: 'text-success-600', bgColor: 'bg-success-50', borderColor: 'border-success-200' };
    if (wcpm >= 90) return { level: 'Developing', color: 'text-warning-600', bgColor: 'bg-warning-50', borderColor: 'border-warning-200' };
    if (wcpm >= 60) return { level: 'Emerging', color: 'text-warning-600', bgColor: 'bg-warning-50', borderColor: 'border-warning-200' };
    return { level: 'Beginning', color: 'text-error-600', bgColor: 'bg-error-50', borderColor: 'border-error-200' };
  };

  const getTrendIcon = (wcpm: number) => {
    if (wcpm >= 120) return <TrendingUp className="h-4 w-4 text-success-600" />;
    if (wcpm >= 90) return <Minus className="h-4 w-4 text-warning-600" />;
    return <TrendingDown className="h-4 w-4 text-error-600" />;
  };

  const readingLevel = getReadingLevel(metrics.wcpm);
  const totalWords = metrics.hits + metrics.deletions + metrics.substitutions;
  const accuracyRate = totalWords > 0 ? (metrics.hits / totalWords) * 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reading Assessment Results - ${assessment.student_name}`,
          text: `${assessment.student_name} achieved ${Math.round(metrics.wcpm)} WCPM with ${Math.round(metrics.accuracy_percentage)}% accuracy.`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${assessment.student_name} achieved ${Math.round(metrics.wcpm)} WCPM with ${Math.round(metrics.accuracy_percentage)}% accuracy.`;
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

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
        <div className="flex space-x-2">
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4 mr-1" />
            Print
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="metric-value text-primary-600">{Math.round(metrics.wcpm)}</div>
          <div className="metric-label">WCPM</div>
          <div className="text-xs text-gray-500 mt-1">Words Correct Per Minute</div>
          <div className="mt-2">{getTrendIcon(metrics.wcpm)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-success-600">{Math.round(metrics.accuracy_percentage)}%</div>
          <div className="metric-label">Accuracy</div>
          <div className="text-xs text-gray-500 mt-1">Overall Reading Accuracy</div>
        </div>
        <div className={`metric-card ${readingLevel.bgColor} ${readingLevel.borderColor}`}>
          <div className={`metric-value ${readingLevel.color}`}>{readingLevel.level}</div>
          <div className="metric-label">Reading Level</div>
          <div className="text-xs text-gray-500 mt-1">Performance Category</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-blue-600">{Math.round(assessment.duration_seconds)}s</div>
          <div className="metric-label">Duration</div>
          <div className="text-xs text-gray-500 mt-1">Reading Time</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Performance Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Correct Words</span>
            <span className="text-sm text-gray-600">{metrics.hits} / {totalWords}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-success-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${accuracyRate}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(accuracyRate)}% of words read correctly
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center p-4 bg-success-50 rounded-lg border border-success-200">
            <CheckCircle className="h-6 w-6 text-success-600 mr-3" />
            <div>
              <div className="font-semibold text-success-900">{metrics.hits}</div>
              <div className="text-sm text-success-700">Correct Words</div>
              <div className="text-xs text-success-600">{Math.round((metrics.hits / totalWords) * 100)}%</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-error-50 rounded-lg border border-error-200">
            <XCircle className="h-6 w-6 text-error-600 mr-3" />
            <div>
              <div className="font-semibold text-error-900">{metrics.deletions}</div>
              <div className="text-sm text-error-700">Missed Words</div>
              <div className="text-xs text-error-600">{Math.round((metrics.deletions / totalWords) * 100)}%</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-warning-50 rounded-lg border border-warning-200">
            <AlertCircle className="h-6 w-6 text-warning-600 mr-3" />
            <div>
              <div className="font-semibold text-warning-900">{metrics.substitutions}</div>
              <div className="text-sm text-warning-700">Pronunciation Errors</div>
              <div className="text-xs text-warning-600">{Math.round((metrics.substitutions / totalWords) * 100)}%</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-primary-50 rounded-lg border border-primary-200">
            <Plus className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <div className="font-semibold text-primary-900">{metrics.insertions}</div>
              <div className="text-sm text-primary-700">Extra Words</div>
              <div className="text-xs text-primary-600">+{metrics.insertions}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Word-Level Analysis Toggle */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Word-Level Analysis</h3>
          <button
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showDetailedAnalysis ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        {showDetailedAnalysis && (
          <div className="space-y-4">
            {/* Word-by-Word Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Original Text</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <p className="text-gray-800 leading-relaxed">{assessment.target_text}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Generated Transcript</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <p className="text-gray-800 leading-relaxed">{assessment.transcript}</p>
                </div>
              </div>
            </div>

            {/* Detailed Error Analysis */}
            {(detailed_errors.substitutions.length > 0 || 
              detailed_errors.insertions.length > 0 || 
              detailed_errors.deletions.length > 0) && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Error Analysis</h4>
                
                {detailed_errors.substitutions.length > 0 && (
                  <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                    <h5 className="font-medium text-warning-800 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Pronunciation Errors ({detailed_errors.substitutions.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {detailed_errors.substitutions.map(([expected, actual], index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border">
                          <span className="font-medium text-gray-900">"{expected}"</span> 
                          <span className="mx-2 text-gray-400">→</span> 
                          <span className="text-warning-600">"{actual}"</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailed_errors.deletions.length > 0 && (
                  <div className="p-4 bg-error-50 rounded-lg border border-error-200">
                    <h5 className="font-medium text-error-800 mb-2 flex items-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Missed Words ({detailed_errors.deletions.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {detailed_errors.deletions.map((word, index) => (
                        <span key={index} className="text-sm bg-white text-error-700 px-3 py-1 rounded-full border">
                          "{word}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detailed_errors.insertions.length > 0 && (
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <h5 className="font-medium text-primary-800 mb-2 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Extra Words ({detailed_errors.insertions.length})
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {detailed_errors.insertions.map((word, index) => (
                        <span key={index} className="text-sm bg-white text-primary-700 px-3 py-1 rounded-full border">
                          "{word}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assessment Metadata */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Assessment Type</div>
            <div className="font-medium capitalize">{assessment.assessment_type}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Duration</div>
            <div className="font-medium">{Math.round(assessment.duration_seconds)} seconds</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Date</div>
            <div className="font-medium">{new Date(assessment.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Time</div>
            <div className="font-medium">{new Date(assessment.created_at).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          New Assessment
        </button>
        <button
          onClick={() => navigate('/history')}
          className="btn-primary"
        >
          View History
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .btn-secondary, .btn-primary, button {
            display: none !important;
          }
          .card {
            break-inside: avoid;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsPage; 