import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BookOpen, Users, BarChart3, Home } from 'lucide-react';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import LeaderboardPage from './pages/LeaderboardPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                ORF Assessment Tool
              </h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                <Home className="h-5 w-5 mr-1" />
                Home
              </a>
              <a href="/history" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                <Users className="h-5 w-5 mr-1" />
                History
              </a>
              <a href="/leaderboard" className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
                <BarChart3 className="h-5 w-5 mr-1" />
                Leaderboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600 text-sm">
            © 2024 ORF Assessment Tool. AI-powered reading fluency assessment.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App; 