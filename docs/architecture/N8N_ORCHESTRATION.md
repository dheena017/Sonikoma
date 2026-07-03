# n8n Workflow Orchestration Guide

**For**: Sonikoma Media Processing Pipeline  
**Version**: 1.0  
**Date**: 2026-07-03  

---

## Overview

n8n workflows orchestrate complex multi-step media processing tasks across the new media processing stack (FFmpeg, Librosa, Whisper, ImageMagick, Stable Diffusion).

---

## Architecture Pattern

```
┌─────────────────┐
│   Webhook/API   │ (Frontend triggers)
└────────┬────────┘
         │
    ┌────▼───────────────────────────────┐
    │  n8n Workflow Orchestrator         │
    ├────────────────────────────────────┤
    │  ├─ Input validation               │
    │  ├─ Task decomposition             │
    │  ├─ Parallel execution             │
    │  ├─ Error handling & retries       │
    │  └─ Result aggregation             │
    └────────┬─────────────────────────┬─┘
             │                         │
      ┌──────▼───┐          ┌─────────▼──────┐
      │ FastAPI  │          │  Python Worker │
      │  Routes  │          │   Services     │
      └──────────┘          └─────────────────┘
             │                         │
        ┌────▼──────────────────────┬─▼───────┐
        │ Backend Services          │         │
        ├──────────────────────────┼─────────┤
        │ • FFmpeg Engine          │ Cache   │
        │ • Librosa Engine         │ Storage │
        │ • Whisper Engine         │ Temp    │
        │ • ImageMagick Engine     │ Files   │
        │ • Stable Diffusion       │         │
        └───────────────────────────────────┘
```

---

## Workflow Templates

### 1. Video Editing Workflow

**Purpose**: Edit video → Cut → Mix audio → Add subtitles → Render

**Trigger**: Webhook (POST /workflows/video/edit)

**Flow**:

```
START
 ↓
[Webhook Input] → Parse params (video_url, cuts, audio_url)
 ↓
[Download Files] → Fetch video & audio from URLs
 ↓
[Extract Metadata] → Call /api/py/ffmpeg/metadata
 ↓
[Cut Video] → Call /api/py/ffmpeg/cut
 ↓
[Extract Audio] → Call /api/py/ffmpeg/extract-audio
 ↓
[Transcribe] → Call /api/py/audio/transcribe
 ↓
[Generate Subtitles] → Call /api/py/whisper/generate-srt
 ↓
[Mix Audio] → Call /api/py/ffmpeg/mix-audio
 ↓
[Add Subtitles] → Call /api/py/ffmpeg/add-subtitles
 ↓
[Upload Result] → Save to Supabase Storage
 ↓
[Send Callback] → POST to webhook with results
 ↓
END
```

**n8n Nodes**:

1. **Webhook** (Listen)
   - Method: POST
   - Path: `/workflows/video/edit`
   - Return immediately

2. **HTTP Request** (Download video)
   ```
   GET {{ $json.video_url }}
   Save binary to temp file
   ```

3. **Function** (Parse parameters)
   ```javascript
   return {
     video_path: '/tmp/video.mp4',
     cuts: $json.cuts,
     audio_path: $json.audio_url ? '/tmp/audio.mp3' : null
   };
   ```

4. **HTTP Request** (Get metadata)
   ```
   POST http://localhost:5000/api/py/ffmpeg/metadata
   Body: { "video_path": "{{ $prev.video_path }}" }
   ```

5. **HTTP Request** (Cut video)
   ```
   POST http://localhost:5000/api/py/ffmpeg/cut
   Body: {
     "video_path": "{{ $prev.video_path }}",
     "cuts": {{ $json.cuts }},
     "output_path": "/tmp/cut_video.mp4"
   }
   ```

6. **HTTP Request** (Transcribe) - Parallel
   ```
   POST http://localhost:5000/api/py/audio/transcribe
   Body: { "audio_url": "{{ $prev.audio_path }}" }
   ```

7. **HTTP Request** (Mix audio)
   ```
   POST http://localhost:5000/api/py/ffmpeg/mix-audio
   Body: {
     "video_path": "{{ $prev.cut_video_path }}",
     "audio_paths": [{{ $prev.audio_path }}],
     "output_path": "/tmp/mixed_video.mp4"
   }
   ```

8. **Supabase** (Upload to Storage)
   ```
   Insert file to storage/videos/
   Filename: {{ $json.project_id }}_{{ Date.now() }}.mp4
   ```

9. **HTTP Request** (Send callback)
   ```
   POST {{ $json.callback_url }}
   Body: { "status": "completed", "video_url": "{{ $prev.upload_url }}" }
   ```

---

### 2. Audio Enhancement Workflow

**Purpose**: Transcribe → Analyze → Generate subtitles

**Trigger**: Webhook (POST /workflows/audio/enhance)

**Flow**:

```
START
 ↓
[Webhook Input] → audio_url, language, analysis_type
 ↓
[Download Audio]
 ↓
[Transcribe] (Parallel Branch 1)
  ├─ Extract text
  ├─ Get timestamps
  └─ Confidence scores
 ↓
[Audio Analysis] (Parallel Branch 2)
  ├─ Extract MFCC features
  ├─ Detect tempo/BPM
  ├─ Energy analysis
  └─ Silence detection
 ↓
[Generate SRT] (Depends on Branch 1)
 ↓
[Generate JSON Summary] (Depends on both)
 ↓
[Upload Results]
 ↓
[Send Callback]
 ↓
END
```

**n8n Nodes**:

1. **Webhook**
   - Method: POST
   - Path: `/workflows/audio/enhance`

2. **HTTP Request** (Download)
   ```
   GET {{ $json.audio_url }}
   ```

3. **HTTP Request** (Transcribe) - Parallel
   ```
   POST http://localhost:5000/api/py/audio/transcribe
   Body: {
     "audio_url": "{{ $prev.audio_path }}",
     "language": "{{ $json.language || 'en' }}"
   }
   ```

4. **HTTP Request** (Analyze Audio) - Parallel
   ```
   POST http://localhost:5000/api/py/audio/analyze
   Body: {
     "audio_url": "{{ $prev.audio_path }}",
     "analysis_types": ["tempo", "mfcc", "energy", "silence"]
   }
   ```

5. **HTTP Request** (Generate SRT)
   ```
   POST http://localhost:5000/api/py/whisper/generate-srt
   Body: {
     "audio_url": "{{ $prev.audio_path }}",
     "output_path": "/tmp/subtitles.srt"
   }
   ```

6. **Merge** (Combine results)
   ```javascript
   return {
     transcription: {{ $prev.transcribe_result }},
     analysis: {{ $prev.analysis_result }},
     srt_file: {{ $prev.srt_path }}
   };
   ```

7. **Supabase** (Upload SRT & results)

8. **HTTP Request** (Callback)

---

### 3. Image Generation & Enhancement Workflow

**Purpose**: Generate image → Enhance → Composite with background

**Trigger**: Webhook (POST /workflows/image/generate)

**Flow**:

```
START
 ↓
[Webhook Input] → prompt, num_images, enhancement_level
 ↓
[Generate Images] (Stable Diffusion)
 ↓
[Parallel Enhancement]
  ├─ Auto-enhance
  ├─ Add text overlay
  └─ Upscale if needed
 ↓
[Optional: Composite] (Blend with background)
 ↓
[Upload Results]
 ↓
[Generate Thumbnail]
 ↓
[Send Callback]
 ↓
END
```

**n8n Nodes**:

1. **Webhook**
   ```
   POST /workflows/image/generate
   ```

2. **HTTP Request** (Generate)
   ```
   POST http://localhost:5000/api/py/image/generate-ai
   Body: {
     "prompt": "{{ $json.prompt }}",
     "num_images": {{ $json.num_images || 1 }},
     "guidance_scale": {{ $json.guidance_scale || 7.5 }},
     "output_dir": "/tmp/generated_images"
   }
   ```

3. **Loop** (For each generated image)
   ```
   {
     "HTTP Request": {
       "POST": "/api/py/image/enhance",
       "Body": {
         "image_path": "{{ $item.path }}",
         "brightness": {{ $json.enhancement.brightness || 1.1 }},
         "contrast": {{ $json.enhancement.contrast || 1.2 }},
         "saturation": {{ $json.enhancement.saturation || 1.15 }}
       }
     }
   }
   ```

4. **Function** (Prepare upload list)

5. **Supabase** (Batch upload)

6. **HTTP Request** (Callback)

---

### 4. Full Multimedia Pipeline Workflow

**Purpose**: Complete comic → video transformation

**Trigger**: Webhook (POST /workflows/multimedia/full-pipeline)

**Flow**:

```
START
 ↓
[Input] → project_id, panels, config
 ↓
[Generate Panel Images] (If needed)
  └─ For each panel: Stable Diffusion
 ↓
[Enhance Images]
  └─ ImageMagick enhancement
 ↓
[Generate Audio] (TTS/EdgeTTS)
  └─ Text-to-speech for each panel
 ↓
[Transcribe Audio] (Whisper)
  └─ Optional: Get transcription
 ↓
[Analyze Audio] (Librosa)
  └─ Get tempo, energy, etc.
 ↓
[Compile Video] (FFmpeg)
  ├─ From enhanced images
  ├─ With generated audio
  ├─ Transitions
  └─ Subtitles
 ↓
[Add Effects] (Optional)
  └─ Color grading, effects
 ↓
[Upload to Storage]
 ↓
[Send Final Callback]
 ↓
END
```

---

## API Endpoints (Backend Routes Required)

```python
# FFmpeg routes
POST /api/py/ffmpeg/metadata
POST /api/py/ffmpeg/cut
POST /api/py/ffmpeg/extract-audio
POST /api/py/ffmpeg/mix-audio
POST /api/py/ffmpeg/add-subtitles
POST /api/py/ffmpeg/apply-filter

# Librosa routes
POST /api/py/audio/analyze
POST /api/py/audio/detect-silence
POST /api/py/audio/segment-by-energy

# Whisper routes
POST /api/py/audio/transcribe
POST /api/py/whisper/generate-srt
POST /api/py/whisper/generate-vtt
POST /api/py/whisper/extract-words

# ImageMagick routes
POST /api/py/image/resize
POST /api/py/image/rotate
POST /api/py/image/enhance
POST /api/py/image/remove-background
POST /api/py/image/add-text
POST /api/py/image/batch-process

# Stable Diffusion routes
POST /api/py/image/generate-ai
POST /api/py/image/inpaint
POST /api/py/image/upscale
POST /api/py/image/style-transfer

# Compound processor routes
POST /api/py/workflows/video/edit
POST /api/py/workflows/audio/enhance
POST /api/py/workflows/image/generate
POST /api/py/workflows/multimedia/full-pipeline
GET /api/py/workflows/{workflow_id}/progress
```

---

## Deployment Configuration

### n8n Installation

```bash
# Docker Compose (recommended)
docker-compose up -d n8n

# Or direct install
npm install -g n8n
n8n start
```

### Environment Variables (.env.n8n)

```bash
# n8n Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http

# Database (postgres recommended for production)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=secure_password

# Workflows
N8N_ENCRYPTION_KEY=your_encryption_key
N8N_EDITOR_BASEURL=http://localhost:5678

# Backend API
BACKEND_API_URL=http://localhost:5000
BACKEND_API_KEY=your_api_key

# Storage
STORAGE_BASE_URL=https://your-storage-url.supabase.co
STORAGE_API_KEY=your_storage_key
```

### Docker Compose

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=secure
      - N8N_ENCRYPTION_KEY=your_key
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: secure
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

---

## Testing Workflows Locally

```bash
# 1. Start all services
docker-compose up -d

# 2. Test video editing workflow
curl -X POST http://localhost:5678/webhook/video-edit \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "s3://bucket/video.mp4",
    "cuts": [{"start": 0, "end": 30}],
    "callback_url": "https://yourapp.com/video-callback"
  }'

# 3. Check workflow progress
curl http://localhost:5000/api/py/workflows/{workflow_id}/progress

# 4. Monitor logs
docker-compose logs -f n8n
```

---

## Best Practices

### 1. Error Handling
- Wrap all HTTP requests in try-catch
- Implement exponential backoff for retries
- Log detailed errors for debugging

### 2. Performance
- Use parallel execution for independent tasks
- Implement timeouts on long-running operations
- Cache results when possible

### 3. Security
- Validate all inputs
- Use authentication tokens for API calls
- Encrypt sensitive data in transit
- Implement rate limiting

### 4. Monitoring
- Track workflow execution times
- Monitor failure rates
- Set up alerts for critical failures
- Log all workflow inputs/outputs

### 5. Scaling
- Use job queues for heavy operations
- Implement worker pools for parallel tasks
- Consider distributed processing for large batches
- Monitor resource usage

---

## Troubleshooting

### Workflow Timeout
- Increase timeout in HTTP Request nodes
- Break into smaller sequential tasks
- Run heavy tasks asynchronously

### Memory Issues
- Reduce batch sizes
- Stream large files instead of loading fully
- Clean up temporary files after use

### API Rate Limiting
- Implement delays between requests
- Use batch endpoints when available
- Cache results

---

## Future Enhancements

1. **Webhook Retry Logic** - Automatic retries with exponential backoff
2. **Progress Streaming** - Real-time progress updates via WebSocket
3. **Conditional Branching** - Dynamic workflow paths based on conditions
4. **Scheduled Workflows** - Cron-based automatic processing
5. **Batch Processing** - Handle multiple items in parallel
6. **Result Caching** - Cache intermediate results
7. **Cost Tracking** - Monitor API costs across services

---

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Workflow Examples](https://n8n.io/workflows/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Librosa Documentation](https://librosa.org/)
- [Whisper Documentation](https://github.com/openai/whisper)
- [Stable Diffusion Guide](https://huggingface.co/docs/diffusers)

