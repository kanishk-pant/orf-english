import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
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

      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Class Performance Leaderboard
        </h2>
        <p className="text-gray-600 mb-6">
          See how students compare and identify top performers in your class.
        </p>
        <p className="text-sm text-gray-500">
          This feature will be implemented in the next phase.
        </p>
      </div>
    </div>
  );
};

export default LeaderboardPage; 