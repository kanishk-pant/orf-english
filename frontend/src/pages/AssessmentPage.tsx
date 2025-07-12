import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Play, Square, Upload, ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setError('');
      const response = await apiService.getDefaultParagraph();
      setTargetText(response.text);
    } catch (err) {
      setError('Failed to load default paragraph. Please try again.');
      console.error('Error loading paragraph:', err);
    }
  };

  const validateCustomText = (text: string): string[] => {
    const errors: string[] = [];
    
    if (!text.trim()) {
      errors.push('Text cannot be empty');
    }
    
    if (text.length < 50) {
      errors.push('Text should be at least 50 characters long');
    }
    
    if (text.length > 2000) {
      errors.push('Text should be less than 2000 characters');
    }
    
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 10) {
      errors.push('Text should contain at least 10 words');
    }
    
    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError('Please upload a .txt file');
      return;
    }

    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      setError('File size should be less than 100KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const errors = validateCustomText(text);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError('Please fix the validation errors');
        return;
      }

      setCustomText(text);
      setTargetText(text);
      setUploadedFileName(file.name);
      setValidationErrors([]);
      setError('');
    };
    
    reader.readAsText(file);
  };

  const handleCustomTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setCustomText(text);
    setTargetText(text);
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      setError('');
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions and try again.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAssessment = async () => {
    // Validation
    if (!audioBlob) {
      setError('Please record audio before submitting');
      return;
    }

    if (!targetText.trim()) {
      setError('Please provide target text for assessment');
      return;
    }

    if (recordingTime < 5) {
      setError('Recording should be at least 5 seconds long');
      return;
    }

    const errors = validateCustomText(targetText);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
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
      setError('Failed to process assessment. Please check your audio quality and try again.');
      console.error('Error processing assessment:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
    setError('');
    setIsAudioPlaying(false);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Upload Custom Text
          </h3>
          
          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Text File (.txt)
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </button>
              {uploadedFileName && (
                <span className="text-sm text-gray-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-success-600" />
                  {uploadedFileName}
                </span>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Type/Paste Text
            </label>
            <textarea
              value={customText}
              onChange={handleCustomTextChange}
              placeholder="Paste or type your custom reading passage here..."
              className="input-field h-32 resize-none"
            />
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-error-600 mr-2" />
                <span className="text-sm font-medium text-error-800">Validation Errors:</span>
              </div>
              <ul className="text-sm text-error-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Text Statistics */}
          {customText && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Text Statistics:</span> {customText.trim().split(/\s+/).length} words, {customText.length} characters
              </div>
            </div>
          )}
        </div>
      )}

      {/* Target Text Display */}
      {targetText && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Passage</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-800 leading-relaxed text-lg">{targetText}</p>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Recording</h3>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-error-600 mr-2" />
              <span className="text-sm text-error-700">{error}</span>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <div className="text-2xl font-mono text-gray-900 mb-2">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-600">
              {isRecording ? 'Recording...' : 'Ready to record'}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!targetText.trim()}
                className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center px-6 py-3 bg-error-600 text-white rounded-full hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 transition-colors"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </button>
            )}
          </div>

          {/* Audio Playback */}
          {audioBlob && (
            <div className="flex items-center space-x-4">
              <button
                onClick={isAudioPlaying ? pauseAudio : playAudio}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {isAudioPlaying ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play Recording
                  </>
                )}
              </button>
              <span className="text-sm text-gray-600">
                Duration: {formatTime(recordingTime)}
              </span>
            </div>
          )}

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsAudioPlaying(false)}
            className="hidden"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {audioBlob && (
          <button
            onClick={handleRetry}
            className="btn-secondary"
          >
            Record Again
          </button>
        )}
        <button
          onClick={handleSubmitAssessment}
          disabled={!audioBlob || isProcessing || validationErrors.length > 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Submit Assessment'}
        </button>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Assessment</h3>
              <p className="text-gray-600">
                Analyzing speech patterns and calculating metrics...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentPage; 