import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus, Medal, Users } from 'lucide-react';
import apiService, { LeaderboardEntry } from '../services/api';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaderboard();
      setLeaderboard(response.entries);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
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

  return (
    <div className="max-w-4xl mx-auto">
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
          Class Leaderboard
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {leaderboard.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {leaderboard.length > 0 ? Math.round(leaderboard[0].average_wcpm) : 0}
            </div>
            <div className="text-sm text-gray-600">Top WCPM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.average_wcpm, 0) / leaderboard.length) : 0}
            </div>
            <div className="text-sm text-gray-600">Class Average</div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Rankings
          </h2>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            {leaderboard.length} Students
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-600 mb-4">{error}</p>
            <button onClick={loadLeaderboard} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No students found.</p>
            <p className="text-sm text-gray-500">Complete some assessments to see rankings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => {
              const readingLevel = getReadingLevel(entry.average_wcpm);
              return (
                <div
                  key={entry.student_name}
                  className={`border rounded-lg p-4 transition-colors ${
                    index < 3 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{entry.student_name}</h3>
                        <p className="text-sm text-gray-600">
                          {entry.total_assessments} assessment{entry.total_assessments !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-xl">
                          {Math.round(entry.average_wcpm)}
                        </div>
                        <div className="text-sm text-gray-600">WCPM</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${readingLevel.bgColor} ${readingLevel.color}`}>
                          {readingLevel.level}
                        </div>
                        {getTrendIcon(entry.trend)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Reading Level Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-error-500 rounded-full"></div>
            <span>Beginning (0-59 WCPM)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            <span>Emerging (60-89 WCPM)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
            <span>Developing (90-119 WCPM)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span>Proficient (120-149 WCPM)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span>Advanced (150+ WCPM)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 