import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Student {
  id: number;
  name: string;
  created_at: string;
}

export interface AssessmentMetrics {
  wcpm: number;
  hits: number;
  substitutions: number;
  insertions: number;
  deletions: number;
  accuracy_percentage: number;
  wer: number;
}

export interface DetailedErrors {
  substitutions: [string, string][];
  insertions: string[];
  deletions: string[];
}

export interface Assessment {
  assessment_id: number;
  student_name: string;
  transcript: string;
  target_text: string;
  metrics: AssessmentMetrics;
  detailed_errors: DetailedErrors;
  assessment_type: string;
  duration_seconds: number;
  created_at: string;
}

export interface StudentAnalytics {
  student_id: number;
  student_name: string;
  average_wcpm: number;
  total_assessments: number;
  improvement_trend: string;
  recent_assessments: Assessment[];
}

export interface LeaderboardEntry {
  rank: number;
  student_name: string;
  average_wcpm: number;
  total_assessments: number;
  trend: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total_students: number;
}

// API Functions
export const apiService = {
  // Student Management
  createStudent: async (name: string): Promise<Student> => {
    const response = await api.post('/students', { name });
    return response.data;
  },

  getStudent: async (id: number): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Assessment
  getDefaultParagraph: async (): Promise<{ text: string }> => {
    const response = await api.get('/paragraphs/default');
    return response.data;
  },

  assessDefaultReading: async (
    studentName: string,
    durationSeconds: number,
    audioFile: File
  ): Promise<Assessment> => {
    const formData = new FormData();
    formData.append('student_name', studentName);
    formData.append('duration_seconds', durationSeconds.toString());
    formData.append('audio_file', audioFile);

    const response = await api.post('/assess/default', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  assessCustomReading: async (
    studentName: string,
    targetText: string,
    durationSeconds: number,
    audioFile: File
  ): Promise<Assessment> => {
    const formData = new FormData();
    formData.append('student_name', studentName);
    formData.append('target_text', targetText);
    formData.append('duration_seconds', durationSeconds.toString());
    formData.append('audio_file', audioFile);

    const response = await api.post('/assess/custom', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Analytics
  getStudentAssessments: async (studentId: number): Promise<Assessment[]> => {
    const response = await api.get(`/students/${studentId}/assessments`);
    return response.data;
  },

  getStudentAnalytics: async (studentId: number): Promise<StudentAnalytics> => {
    const response = await api.get(`/students/${studentId}/analytics`);
    return response.data;
  },

  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
};

export default apiService; 