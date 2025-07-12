# Wave2Vec2 Implementation Guide for ORF Assessment

## Overview
This document provides complete implementation guidance for using Wave2Vec2 to perform Oral Reading Fluency (ORF) assessments. The system takes student audio recordings and reference texts to generate detailed reading performance metrics.

---

## 1. Model Specification

### 1.1 Recommended Model
**Model Name**: `facebook/wav2vec2-large-960h-lv60-self`

**Why This Model:**
- Pre-trained on 960 hours of English speech data
- Optimized for general English speech recognition
- Good balance of accuracy and processing speed
- Suitable for educational/child speech recognition
- Well-supported by Hugging Face transformers library

### 1.2 Installation Requirements
```bash
pip install transformers torch torchaudio librosa difflib
```

### 1.3 Model Loading Code
```python
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import torch

# Load model and processor
MODEL_NAME = "facebook/wav2vec2-large-960h-lv60-self"
processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
```

---

## 2. System Inputs

### 2.1 Audio File Requirements

**Input Format:** 
- **Primary**: MP3 files (most common from web browsers)
- **Also Supports**: WAV, M4A, FLAC

**Audio Specifications:**
- **Sample Rate**: Must be converted to 16kHz (Wave2Vec2 requirement)
- **Channels**: Mono (single channel)
- **Duration**: 15 seconds to 5 minutes optimal
- **Quality**: Clear speech, minimal background noise

**Audio Preprocessing Steps:**
```python
import librosa

def preprocess_audio(audio_file_path):
    # Load audio and convert to 16kHz
    audio, sr = librosa.load(audio_file_path, sr=16000)
    
    # Normalize audio amplitude
    audio = audio / max(abs(audio)) if max(abs(audio)) > 0 else audio
    
    return audio, 16000
```

### 2.2 Target Passage Requirements

**Input Format:** Plain text file (.txt)

**Text Specifications:**
- **Length**: 50-200 words optimal for assessment
- **Content**: Grade-appropriate reading material
- **Format**: Clean text without special formatting
- **Encoding**: UTF-8

**Text Preprocessing:**
```python
import re

def clean_text(text):
    # Remove punctuation and extra spaces
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip().lower()
```

---

## 3. Core Processing Pipeline

### 3.1 Complete Implementation
```python
import torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import librosa
import difflib
import re
from collections import namedtuple

# Result structure
ORFResults = namedtuple('ORFResults', [
    'transcript', 'target_text', 'wcpm', 'hits', 'substitutions', 
    'insertions', 'deletions', 'wer', 'accuracy'
])

class ORFAssessment:
    def __init__(self):
        self.model_name = "facebook/wav2vec2-large-960h-lv60-self"
        self.processor = Wav2Vec2Processor.from_pretrained(self.model_name)
        self.model = Wav2Vec2ForCTC.from_pretrained(self.model_name)
    
    def generate_transcript(self, audio_file_path):
        """Generate transcript from audio file"""
        # Load and preprocess audio
        audio, sr = librosa.load(audio_file_path, sr=16000)
        
        # Process through Wave2Vec2
        inputs = self.processor(audio, sampling_rate=16000, return_tensors="pt")
        
        with torch.no_grad():
            logits = self.model(inputs.input_values).logits
        
        predicted_ids = torch.argmax(logits, dim=-1)
        transcript = self.processor.batch_decode(predicted_ids)[0]
        
        return transcript.strip().lower()
    
    def align_sequences(self, reference_words, transcript_words):
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
    
    def assess_reading(self, audio_file_path, target_text_file, duration_seconds=None):
        """Complete ORF assessment pipeline"""
        # Read target text
        with open(target_text_file, 'r', encoding='utf-8') as f:
            target_text = f.read()
        
        # Generate transcript
        transcript = self.generate_transcript(audio_file_path)
        
        # Clean texts and split into words
        target_clean = re.sub(r'[^\w\s]', '', target_text).lower().strip()
        transcript_clean = re.sub(r'[^\w\s]', '', transcript).lower().strip()
        
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
        wcpm = None
        if duration_seconds:
            duration_minutes = duration_seconds / 60
            wcpm = n_hits / duration_minutes if duration_minutes > 0 else 0
        
        return ORFResults(
            transcript=transcript,
            target_text=target_text,
            wcpm=wcpm,
            hits=n_hits,
            substitutions=n_subs,
            insertions=n_ins,
            deletions=n_dels,
            wer=wer,
            accuracy=accuracy
        )
```

---

## 4. Expected Outputs

### 4.1 Primary Metrics

**Words Correct Per Minute (WCPM)**
- **Description**: Number of correctly read words per minute
- **Calculation**: `(Number of Hits / Duration in Minutes)`
- **Range**: 0-200+ (typical grade ranges: Grade 2: 44-124, Grade 5: 94-194)
- **Usage**: Primary fluency indicator

**Word Error Rate (WER)**
- **Description**: Percentage of words that were read incorrectly
- **Calculation**: `(Substitutions + Insertions + Deletions) / Total Reference Words`
- **Range**: 0.0 to 1.0 (0% to 100%)
- **Usage**: Overall accuracy measure

**Accuracy Percentage**
- **Description**: Percentage of words read correctly
- **Calculation**: `1 - WER` or `Hits / Total Reference Words`
- **Range**: 0% to 100%
- **Usage**: Easy-to-understand accuracy metric

### 4.2 Detailed Breakdown

**Hits (Correct Words)**
- **Description**: Words pronounced correctly
- **Data Type**: Integer count
- **Example**: 42 words correctly read

**Substitutions (Pronunciation Errors)**
- **Description**: Words pronounced incorrectly
- **Data Type**: Integer count + list of (reference_word, spoken_word) pairs
- **Example**: 3 substitutions: [("picture", "pitcher"), ("struggling", "strangling")]

**Deletions (Missed Words)**
- **Description**: Words in reference text but not spoken
- **Data Type**: Integer count + list of missed words
- **Example**: 2 deletions: ["already", "developers"]

**Insertions (Extra Words)**
- **Description**: Words spoken but not in reference text
- **Data Type**: Integer count + list of extra words
- **Example**: 1 insertion: ["the"]

### 4.3 Additional Output Data

**Generated Transcript**
- **Description**: Complete text transcription of spoken audio
- **Format**: String (lowercase, cleaned)
- **Usage**: Review and verification purposes

**Processing Metadata**
- Audio duration (seconds)
- Processing time
- Model confidence scores (if needed)
- Timestamp of assessment

### 4.4 Output Format Example
```python
{
    "transcript": "with the eye and the picture developers are already struggling...",
    "target_text": "With AI in the picture, developers are already struggling...",
    "metrics": {
        "wcpm": 85.4,
        "hits": 42,
        "substitutions": 8,
        "insertions": 3,
        "deletions": 5,
        "wer": 0.276,
        "accuracy": 0.724,
        "accuracy_percentage": 72.4
    },
    "detailed_errors": {
        "substitutions": [("ai", "eye"), ("picture", "pitcher")],
        "insertions": ["the", "right"],
        "deletions": ["already", "billion"]
    },
    "metadata": {
        "audio_duration": 45.2,
        "processing_time": 3.1,
        "assessment_timestamp": "2024-01-15T10:30:00Z"
    }
}
```

---

## 5. Error Handling & Edge Cases

### 5.1 Common Issues

**Audio Quality Problems**
- Silent or very quiet audio
- Background noise interference
- Multiple speakers

**Text Alignment Issues**
- Very short recordings (< 10 words)
- Completely incorrect readings
- Missing sections of text

### 5.2 Error Handling Code
```python
def validate_inputs(audio_path, text_path):
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
    
    # Check text file
    try:
        with open(text_path, 'r') as f:
            text = f.read().strip()
        if len(text.split()) < 10:
            errors.append("Text too short (minimum 10 words)")
    except Exception as e:
        errors.append(f"Cannot read text file: {e}")
    
    return errors
```

---

## 6. Performance Expectations

### 6.1 Processing Times
- **Audio Loading**: < 1 second
- **Wave2Vec2 Inference**: 5-15 seconds (depending on audio length)
- **Alignment**: < 1 second
- **Total Processing**: 10-20 seconds for typical assessment

### 6.2 Accuracy Expectations
- **Good Quality Audio**: WER typically 10-30%
- **Classroom Audio**: WER typically 20-40%
- **Poor Quality Audio**: WER may exceed 50%

### 6.3 Hardware Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **CPU**: Modern multi-core processor
- **GPU**: Optional, but speeds up processing significantly
- **Storage**: ~2GB for model files

---

## 7. Integration Notes

### 7.1 API Endpoint Structure
```python
from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.post("/assess")
async def assess_reading(
    audio_file: UploadFile = File(...),
    text_file: UploadFile = File(...),
    duration_seconds: float = None
):
    # Save uploaded files temporarily
    # Process with ORFAssessment class
    # Return structured results
    pass
```

### 7.2 Database Storage
Store the following for each assessment:
- Student identifier
- Original audio file path
- Target text
- Generated transcript
- All calculated metrics
- Assessment timestamp

This implementation guide provides everything needed to integrate Wave2Vec2 into the ORF assessment application reliably and effectively.