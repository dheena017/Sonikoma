# Media Processing Stack Migration Plan

**Date**: 2026-07-03  
**Status**: In Progress  
**Scope**: Video, Audio, and Image Editing Pipeline  

---

## Executive Summary

Migrating Sonikoma's media processing from basic MoviePy/EdgeTTS to a **professional-grade stack** with:
- **Video Editing**: FFmpeg + MoviePy (advanced cuts, transitions, overlays)
- **Audio Editing**: Librosa (analysis/feature extraction) + FFmpeg (conversion) + Whisper (transcription)
- **Image Editing**: ImageMagick (transformations) + Stable Diffusion (AI generation)
- **Orchestration**: n8n workflows + Node.js backend APIs

---

## Current Stack Analysis

### Video Processing (`backend/python/services/video.py`)
| Feature | Current | Issues | New Solution |
|---------|---------|--------|--------------|
| Video compilation | MoviePy | Limited control, slow | FFmpeg + MoviePy wrapper |
| Transitions | Basic concat | No transitions | FFmpeg filters |
| Overlays | PIL only | Limited blending | FFmpeg complex filter graphs |
| Cuts/Trimming | None | ❌ | FFmpeg precise cutting |

### Audio Processing (`backend/python/services/audio.py`)
| Feature | Current | Issues | New Solution |
|---------|---------|--------|--------------|
| TTS | EdgeTTS | Single source, basic | Keep EdgeTTS + add alternatives |
| Analysis | None | ❌ | Librosa (MFCC, spectral analysis) |
| Transcription | None | ❌ | Whisper (OpenAI) |
| Format conversion | pydub | Dependent on FFmpeg | Native FFmpeg |
| Effects | pydub speedup | Pitch shifting issues | FFmpeg with filter chains |

### Image Processing (`backend/python/routes/image_routes.py`)
| Feature | Current | Issues | New Solution |
|---------|---------|--------|--------------|
| Transformations | PIL/OpenCV | Limited effects | ImageMagick CLI (powerful) |
| AI Generation | None | ❌ | Stable Diffusion (local/API) |
| Bubble removal | OpenCV/Gemini | Inconsistent | ImageMagick + ML refinement |
| Batch processing | Sequential | Slow | FFmpeg batch + parallel |

---

## Architecture: New Media Processing Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend / n8n Dashboard                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│             FastAPI Routes (Backend API Layer)              │
│  ├─ /api/py/video/*        (Orchestrator)                  │
│  ├─ /api/py/audio/*        (Orchestrator)                  │
│  └─ /api/py/image/*        (Orchestrator)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              n8n Workflows (Compound Operations)            │
│  ├─ Video Editing Workflow                                 │
│  ├─ Audio Enhancement Workflow                             │
│  ├─ Image Transformation Workflow                          │
│  └─ Multi-Media Processing Workflow                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│            Service Layer (Python + Node.js)                │
│  ├─ services/ffmpeg_engine.py    (Video engine)            │
│  ├─ services/librosa_engine.py   (Audio analysis)          │
│  ├─ services/whisper_engine.py   (Transcription)           │
│  ├─ services/imagemagick_engine.py (Image transforms)      │
│  ├─ services/stable_diffusion_engine.py (AI generation)    │
│  └─ services/compound_processor.py (Orchestrator)          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              System CLI Tools (Installed)                   │
│  ├─ ffmpeg      (system dependency)                        │
│  ├─ imagemagick (system dependency)                        │
│  └─ stable-diffusion-cli (optional local)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Dependencies & Infrastructure

### 1.1 Update `requirements.txt`

**Video Processing**
- `moviepy>=1.0.3` ✅ (keep, as orchestrator)
- `ffmpeg-python` or `PyFFmpeg` (wrapper)

**Audio Processing**
- `librosa>=0.10.0` (spectral analysis, MFCC, feature extraction)
- `soundfile>=0.12.0` (audio I/O)
- `openai-whisper>=20230314` (transcription model)
- `pydub>=0.25.1` ✅ (keep for quick ops)

**Image Processing**
- `Pillow>=10.3.0` ✅ (keep for basic ops)
- `opencv-python>=4.9.0` ✅ (keep for detection)
- `wand>=0.6.10` (ImageMagick Python binding)
- `diffusers>=0.21.0` (Stable Diffusion via Hugging Face)
- `torch>=2.0.0` (required by diffusers)
- `transformers>=4.30.0` (transformer models)

**Utilities**
- `numpy>=1.26.0` ✅ (keep)
- `scipy>=1.11.0` (audio signal processing)
- `tqdm>=4.65.0` (progress bars)

### 1.2 System Dependencies

```bash
# Windows (PowerShell Admin)
winget install ffmpeg
winget install imagemagick

# macOS
brew install ffmpeg imagemagick

# Linux (Ubuntu/Debian)
sudo apt install ffmpeg imagemagick-6.q16
```

### 1.3 Optional GPU Acceleration

For Stable Diffusion & Whisper (much faster):
- CUDA 11.8+ (NVIDIA GPU)
- `torch>=2.0` with CUDA support
- `transformers[torch]>=4.30.0`

---

## Phase 2: Service Wrappers

### 2.1 FFmpeg Engine (`services/ffmpeg_engine.py`)

```python
# Key capabilities:
- extract_frames()      # Video to frames
- concatenate_videos()  # Advanced concat with transitions
- apply_filter()        # Filters: blur, fade, overlay, etc.
- extract_audio()       # Video → audio
- add_subtitles()       # Burn-in SRT/VTT
- cut_video()           # Precise trimming
- adjust_speed()        # Speed/slow-mo without artifacts
- mix_audio()           # Multi-track audio mixing
```

### 2.2 Librosa Audio Analysis (`services/librosa_engine.py`)

```python
# Key capabilities:
- extract_features()    # MFCC, spectral centroid, etc.
- detect_silence()      # Find silent sections
- detect_tempo()        # BPM extraction
- extract_chroma()      # Musical note extraction
- visualize_spectrogram() # Debug audio
- segment_by_energy()   # Dynamic segmentation
```

### 2.3 Whisper Transcription (`services/whisper_engine.py`)

```python
# Key capabilities:
- transcribe()          # Audio → text + timestamps
- transcribe_with_speaker_detection() # Multi-speaker
- extract_subtitles()   # Generate SRT files
- get_confidence_scores() # Transcription confidence
```

### 2.4 ImageMagick Engine (`services/imagemagick_engine.py`)

```python
# Key capabilities:
- apply_transform()     # Resize, rotate, skew
- batch_apply_effects() # Parallel image processing
- blend_images()        # Advanced composition
- auto_enhance()        # Brightness, contrast, saturation
- remove_background()   # Transparent extraction
- text_overlay()        # Burn text with effects
```

### 2.5 Stable Diffusion (`services/stable_diffusion_engine.py`)

```python
# Key capabilities:
- generate_image()      # Text prompt → image
- inpaint()             # Edit masked regions
- upscale()             # Super-resolution
- style_transfer()      # Apply artistic styles
- batch_generate()      # Parallel generation
```

### 2.6 Compound Processor (`services/compound_processor.py`)

```python
# Orchestrator for multi-step workflows:
- process_video_editing_workflow()
- process_audio_enhancement_workflow()
- process_image_transformation_workflow()
- process_full_media_pipeline()
```

---

## Phase 3: Route Updates

### 3.1 Enhanced Video Routes

**POST /api/py/video/render-advanced**
```json
{
  "panels": [...],
  "transitions": [
    {"type": "fade", "duration": 1.0},
    {"type": "slide", "direction": "left"}
  ],
  "overlays": [
    {"type": "text", "content": "...", "position": "top"}
  ],
  "effects": ["blur", "brighten"],
  "output_format": "mp4"
}
```

**POST /api/py/video/edit**
```json
{
  "video_path": "...",
  "cuts": [{"start": 0, "end": 10}],
  "speed_adjustments": [{"time": 5, "factor": 0.5}],
  "audio_mix": {"background": 0.3, "dialog": 1.0}
}
```

### 3.2 Enhanced Audio Routes

**POST /api/py/audio/transcribe**
```json
{
  "audio_url": "...",
  "language": "en",
  "include_timestamps": true
}
```

**POST /api/py/audio/analyze**
```json
{
  "audio_url": "...",
  "analysis_type": ["tempo", "energy", "mfcc"]
}
```

### 3.3 Enhanced Image Routes

**POST /api/py/image/generate-ai**
```json
{
  "prompt": "...",
  "style": "anime",
  "num_images": 3,
  "guidance_scale": 7.5
}
```

**POST /api/py/image/batch-transform**
```json
{
  "urls": [...],
  "transforms": [
    {"type": "resize", "width": 1024},
    {"type": "auto_enhance", "brightness": 1.2}
  ]
}
```

---

## Phase 4: n8n Orchestration

### 4.1 Workflow: Video Editing Pipeline

```
Trigger (webhook/manual)
  ↓
[Load Video Metadata]
  ↓
├─ [Extract Audio] → [Transcribe with Whisper]
├─ [Extract Frames] → [Enhance with ImageMagick]
└─ [Analyze Audio] → [Detect pacing]
  ↓
[Apply Transitions & Cuts (FFmpeg)]
  ↓
[Mix Audio Tracks]
  ↓
[Generate Subtitles]
  ↓
[Encode Final Output]
  ↓
[Upload to Storage]
  ↓
Webhook Callback (completion)
```

### 4.2 Workflow: Multi-Language Audio Generation

```
Trigger (panel data)
  ↓
[EdgeTTS: Generate primary audio]
  ↓
├─ [Analyze with Librosa]
├─ [Transcribe with Whisper]
└─ [Detect pauses]
  ↓
[Apply audio effects (FFmpeg)]
  ↓
[Mix with background music]
  ↓
[Export multi-format] (MP3, WAV, AAC)
  ↓
Result
```

### 4.3 Workflow: Image Generation & Enhancement

```
Trigger (AI prompt)
  ↓
[Stable Diffusion: Generate image]
  ↓
[Enhance with ImageMagick]
  ↓
├─ [Auto-enhance colors]
├─ [Upscale if needed]
└─ [Add text overlay]
  ↓
[Store in cache]
  ↓
Result
```

---

## Phase 5: Migration Steps

### Step 1: Dependency Installation
- [ ] Update `requirements.txt`
- [ ] Run `pip install -r requirements.txt`
- [ ] Verify system CLIs: `ffmpeg --version`, `identify --version`
- [ ] Download Whisper model: `python -m openai_whisper --model base`

### Step 2: Create Service Wrappers
- [ ] Create `services/ffmpeg_engine.py`
- [ ] Create `services/librosa_engine.py`
- [ ] Create `services/whisper_engine.py`
- [ ] Create `services/imagemagick_engine.py`
- [ ] Create `services/stable_diffusion_engine.py`
- [ ] Create `services/compound_processor.py`

### Step 3: Update Existing Routes
- [ ] Refactor `routes/video.py` to use FFmpeg engine
- [ ] Refactor `routes/audio.py` to support Whisper + Librosa
- [ ] Refactor `routes/image_routes.py` to use ImageMagick + Stable Diffusion
- [ ] Add new endpoints for compound workflows

### Step 4: n8n Integration
- [ ] Design n8n workflow templates
- [ ] Deploy workflows to n8n instance
- [ ] Create API endpoints to trigger workflows
- [ ] Set up webhook callbacks for results

### Step 5: Testing & Optimization
- [ ] Unit tests for each service wrapper
- [ ] Integration tests for compound workflows
- [ ] Performance benchmarking
- [ ] GPU acceleration setup (optional)

### Step 6: Deployment & Documentation
- [ ] Update `docs/api/video.md`
- [ ] Update `docs/api/audio.md`
- [ ] Update `docs/api/image.md`
- [ ] Add n8n workflow documentation
- [ ] Create deployment guide for production

---

## Backward Compatibility

All existing endpoints **remain unchanged**:
- `/api/py/audio/generate` → Still supports EdgeTTS
- `/api/py/video/render` → Still works with MoviePy
- `/api/py/image/*` → Still supports PIL/OpenCV

**New endpoints** added for advanced features:
- `/api/py/video/render-advanced` → FFmpeg features
- `/api/py/audio/transcribe` → Whisper integration
- `/api/py/image/generate-ai` → Stable Diffusion

---

## Resource Requirements

| Component | CPU | Memory | Storage | GPU (Optional) |
|-----------|-----|--------|---------|----------------|
| FFmpeg processing | High | Medium | 5GB temp | N/A |
| Librosa analysis | Medium | Medium | 100MB | N/A |
| Whisper (base) | High | 2GB | 1.4GB model | 2x faster |
| ImageMagick | Medium | Low | 500MB | N/A |
| Stable Diffusion | High | 4GB | 4GB model | 10x faster |
| **Total** | **High** | **8-12GB** | **12-15GB** | **6-8GB VRAM** |

---

## Configuration (.env variables)

```bash
# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
FFMPEG_THREADS=4

# Whisper
WHISPER_MODEL=base  # tiny, base, small, medium, large
WHISPER_DEVICE=cpu  # cuda (if GPU available)

# Stable Diffusion
STABLE_DIFFUSION_MODEL=runwayml/stable-diffusion-v1-5
DIFFUSION_DEVICE=cpu  # cuda
DIFFUSION_SAFETY_CHECKER=false  # for faster inference

# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=...

# Storage
MEDIA_CACHE_DIR=/workspace/backend/public/videos
TEMP_MEDIA_DIR=/tmp/sonikoma_media
```

---

## Testing Strategy

```python
# tests/test_ffmpeg_engine.py
- test_extract_frames()
- test_concatenate_videos()
- test_apply_transitions()
- test_audio_mixing()

# tests/test_librosa_engine.py
- test_extract_mfcc()
- test_detect_silence()
- test_detect_tempo()

# tests/test_whisper_engine.py
- test_transcribe_english()
- test_transcribe_with_timestamps()

# tests/test_imagemagick_engine.py
- test_resize_with_quality()
- test_batch_processing()

# tests/test_stable_diffusion_engine.py
- test_text_to_image()
- test_inpainting()
```

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup & deps | 1 day | Updated requirements.txt, system CLIs |
| Service wrappers | 3 days | All 6 service wrappers + tests |
| Route updates | 2 days | Enhanced video/audio/image routes |
| n8n integration | 2 days | Workflow templates + APIs |
| Testing & optimization | 2 days | Full test suite + benchmarks |
| **Total** | **~10 days** | Production-ready system |

---

## Notes

- All changes are **incremental & non-breaking**
- Existing functionality preserved via legacy endpoints
- New features available via new endpoints
- Gradual migration allows A/B testing
- Easy rollback if needed

---

## Related Documents

- [API Reference: Video](../api/video.md)
- [API Reference: Audio](../api/audio.md)
- [API Reference: Image](../api/image.md)
- [System Architecture](database.md)
- [Environment Variables](environment_variables.md)

