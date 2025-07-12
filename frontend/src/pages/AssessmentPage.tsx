import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Play, Square, Upload, ArrowLeft } from 'lucide-react';
import apiService from '../services/api';

interface LocationState {
  student?: {
    id: number;
    name: string;
  };
  studentName?: string;
  assessmentType: 'default' | 'custom';
}

const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [targetText, setTargetText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [customText, setCustomText] = useState('');
  const [showCustomUpload, setShowCustomUpload] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const studentName = state?.student?.name || state?.studentName || '';

  useEffect(() => {
    if (state?.assessmentType === 'default') {
      loadDefaultParagraph();
    } else if (state?.assessmentType === 'custom') {
      setShowCustomUpload(true);
    }
  }, [state?.assessmentType]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const loadDefaultParagraph = async () => {
    try {
      const response = await apiService.getDefaultParagraph();
      setTargetText(response.text);
    } catch (err) {
      setError('Failed to load default paragraph');
      console.error('Error loading paragraph:', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomTextUpload = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomText(event.target.value);
    setTargetText(event.target.value);
  };

  const handleSubmitAssessment = async () => {
    if (!audioBlob) {
      setError('Please record audio before submitting');
      return;
    }

    if (!targetText.trim()) {
      setError('Please provide target text for assessment');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      
      let assessment;
      if (state?.assessmentType === 'default') {
        assessment = await apiService.assessDefaultReading(
          studentName,
          recordingTime,
          audioFile
        );
      } else {
        assessment = await apiService.assessCustomReading(
          studentName,
          targetText,
          recordingTime,
          audioFile
        );
      }

      // Navigate to results page
      navigate('/results', { state: { assessment } });
    } catch (err) {
      setError('Failed to process assessment. Please try again.');
      console.error('Error processing assessment:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError('');
  };

  if (!studentName) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No student information found.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Back to Home
        </button>
      </div>
    );
  }

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
          Reading Assessment - {studentName}
        </h1>
      </div>

      {/* Custom Text Upload */}
      {showCustomUpload && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Custom Text</h3>
          <textarea
            value={customText}
            onChange={handleCustomTextUpload}
            placeholder="Paste or type your custom reading passage here..."
            className="input-field h-32 resize-none"
            disabled={isRecording || isProcessing}
          />
          <p className="text-sm text-gray-600 mt-2">
            Minimum 10 words required for assessment.
          </p>
        </div>
      )}

      {/* Reading Passage */}
      {targetText && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Passage</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-800 leading-relaxed">{targetText}</p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Instructions: Please read the above passage aloud clearly and at a comfortable pace.
          </p>
        </div>
      )}

      {/* Recording Interface */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recording</h3>
        
        {/* Recording Status */}
        <div className="flex items-center justify-center mb-6">
          <div className={`w-4 h-4 rounded-full mr-3 ${isRecording ? 'bg-error-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-lg font-medium">
            {isRecording ? 'Recording...' : 'Ready to Record'}
          </span>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="text-3xl font-mono font-bold text-gray-900">
            {formatTime(recordingTime)}
          </div>
          <p className="text-sm text-gray-600">Recording Duration</p>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              disabled={!targetText.trim() || isProcessing}
              className="btn-primary flex items-center"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="btn-warning flex items-center"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={handleRetry}
                className="btn-secondary flex items-center"
              >
                <Mic className="h-5 w-5 mr-2" />
                Record Again
              </button>
              <button
                onClick={handleSubmitAssessment}
                disabled={isProcessing}
                className="btn-success flex items-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                {isProcessing ? 'Processing...' : 'Submit Assessment'}
              </button>
            </>
          )}
        </div>

        {/* Audio Preview */}
        {audioBlob && (
          <div className="text-center">
            <audio controls className="mx-auto">
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-error-700 text-sm">{error}</p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Processing your assessment...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
          </div>
        )}
      </div>

      {/* Assessment Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="metric-value text-primary-600">{studentName}</div>
          <div className="metric-label">Student</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-warning-600">
            {state?.assessmentType === 'default' ? 'Default' : 'Custom'}
          </div>
          <div className="metric-label">Assessment Type</div>
        </div>
        <div className="metric-card">
          <div className="metric-value text-success-600">
            {targetText.split(' ').length}
          </div>
          <div className="metric-label">Words in Passage</div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage; 