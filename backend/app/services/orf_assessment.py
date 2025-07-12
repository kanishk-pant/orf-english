import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import librosa
import difflib
import re
from collections import namedtuple
import os
from typing import List, Tuple, Dict, Any
from app.core.config import settings

# Result structure
ORFResults = namedtuple('ORFResults', [
    'transcript', 'target_text', 'wcpm', 'hits', 'substitutions', 
    'insertions', 'deletions', 'wer', 'accuracy', 'detailed_errors'
], defaults=[0.0])  # Default value for wcpm

class ORFAssessment:
    def __init__(self):
        self.model_name = settings.WAV2VEC2_MODEL
        self.processor = Wav2Vec2Processor.from_pretrained(self.model_name)
        self.model = Wav2Vec2ForCTC.from_pretrained(self.model_name)
    
    def preprocess_audio(self, audio_file_path: str) -> Tuple[List[float], int]:
        """Load and preprocess audio file"""
        # Load audio and convert to 16kHz
        audio, sr = librosa.load(audio_file_path, sr=16000)
        
        # Normalize audio amplitude
        if max(abs(audio)) > 0:
            audio = audio / max(abs(audio))
        
        return audio, 16000
    
    def generate_transcript(self, audio_file_path: str) -> str:
        """Generate transcript from audio file using Wave2Vec2"""
        # Load and preprocess audio
        audio, sr = self.preprocess_audio(audio_file_path)
        
        # Process through Wave2Vec2
        inputs = self.processor(audio, sampling_rate=16000, return_tensors="pt")
        
        with torch.no_grad():
            logits = self.model(inputs.input_values).logits
        
        predicted_ids = torch.argmax(logits, dim=-1)
        transcript = self.processor.batch_decode(predicted_ids)[0]
        
        return transcript.strip().lower()
    
    def clean_text(self, text: str) -> str:
        """Clean text for comparison"""
        # Remove punctuation and extra spaces
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()
    
    def align_sequences(self, reference_words: List[str], transcript_words: List[str]) -> Tuple[List, List, List, List]:
        """Perform sequence alignment using difflib"""
        matcher = difflib.SequenceMatcher(None, reference_words, transcript_words)
        
        hits = []
        substitutions = []
        insertions = []
        deletions = []
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for i, j in zip(range(i1, i2), range(j1, j2)):
                    hits.append((reference_words[i], transcript_words[j]))
            
            elif tag == 'replace':
                ref_slice = reference_words[i1:i2]
                trans_slice = transcript_words[j1:j2]
                
                max_len = max(len(ref_slice), len(trans_slice))
                for k in range(max_len):
                    ref_word = ref_slice[k] if k < len(ref_slice) else None
                    trans_word = trans_slice[k] if k < len(trans_slice) else None
                    
                    if ref_word and trans_word:
                        substitutions.append((ref_word, trans_word))
                    elif ref_word and not trans_word:
                        deletions.append(ref_word)
                    elif not ref_word and trans_word:
                        insertions.append(trans_word)
            
            elif tag == 'delete':
                for i in range(i1, i2):
                    deletions.append(reference_words[i])
            
            elif tag == 'insert':
                for j in range(j1, j2):
                    insertions.append(transcript_words[j])
        
        return hits, substitutions, insertions, deletions
    
    def assess_reading(self, audio_file_path: str, target_text: str, duration_seconds: float = None) -> ORFResults:
        """Complete ORF assessment pipeline"""
        # Generate transcript
        transcript = self.generate_transcript(audio_file_path)
        
        # Clean texts and split into words
        target_clean = self.clean_text(target_text)
        transcript_clean = self.clean_text(transcript)
        
        target_words = target_clean.split()
        transcript_words = transcript_clean.split()
        
        # Perform alignment
        hits, substitutions, insertions, deletions = self.align_sequences(
            target_words, transcript_words
        )
        
        # Calculate metrics
        n_hits = len(hits)
        n_subs = len(substitutions)
        n_ins = len(insertions)
        n_dels = len(deletions)
        n_ref = len(target_words)
        
        # Word Error Rate
        wer = (n_subs + n_dels + n_ins) / n_ref if n_ref > 0 else 0
        accuracy = 1 - wer
        
        # Words Correct Per Minute
        wcpm = 0.0
        if duration_seconds:
            duration_minutes = duration_seconds / 60
            wcpm = n_hits / duration_minutes if duration_minutes > 0 else 0.0
        
        # Prepare detailed errors
        detailed_errors = {
            "substitutions": substitutions,
            "insertions": insertions,
            "deletions": deletions
        }
        
        return ORFResults(
            transcript=transcript,
            target_text=target_text,
            wcpm=wcpm,
            hits=n_hits,
            substitutions=n_subs,
            insertions=n_ins,
            deletions=n_dels,
            wer=wer,
            accuracy=accuracy,
            detailed_errors=detailed_errors
        )
    
    def validate_inputs(self, audio_path: str, text: str) -> List[str]:
        """Validate input files before processing"""
        errors = []
        
        # Check audio file
        try:
            audio, sr = librosa.load(audio_path)
            if len(audio) < 1.0:  # Less than 1 second
                errors.append("Audio file too short")
            if max(abs(audio)) < 0.01:  # Very quiet
                errors.append("Audio level too low")
        except Exception as e:
            errors.append(f"Cannot read audio file: {e}")
        
        # Check text
        if len(text.split()) < 10:
            errors.append("Text too short (minimum 10 words)")
        
        return errors 