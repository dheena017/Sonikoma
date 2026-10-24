# Exhaustive Specification: Unified `backend/features/video/` Architecture

## Executive Blueprint: Elevating Video to a First-Class Domain

In alignment with Sonikoma's domain consolidation (elevating `image` to a first-class feature in `backend/features/image/`), this plan establishes **`backend/features/video/`** as the dedicated, canonical root for all video capabilities across the platform.

### Architectural Audit & Strategic Elevation
Currently, video functionality is fragmented:
1. **Buried Core Services**: Existing compilers and motion generators live under `backend/features/video_editor/video/services/`.
2. **Trapped Provider Subprocesses**: Low-level FFmpeg operations (`extract_frames`, `cut_video`, `concatenate_videos`, `mix_audio`, `apply_filter`, `adjust_speed`) are trapped in `backend/ai_engine/providers/video/` and `backend/ai_engine/providers/ffmpeg/`.
3. **Disconnected Schemas**: Pydantic models for atomic video operations exist in `schemas.py` but lack active router endpoints.
4. **Scattered Utilities**: Dimension math and timecode models live in `backend/common/video/`.
5. **Empty Domain Folder**: `backend/features/video/` is currently an unpopulated directory ready to become the authoritative video domain.

By consolidating all video pipelines directly into **`backend/features/video/`**, Sonikoma gains a unified, modular, production-grade video architecture with full backward compatibility for `backend/features/video_editor/`.

---

## 1. Directory Blueprint (Elevated & Approved)

```
backend/features/video/
│
├── __init__.py                               # Unified top-level package facade
├── schemas.py                                # All Pydantic request/response models & specs
├── service.py                                # VideoService class & singleton instance
├── README.md                                 # Architecture documentation & Mermaid diagrams
├── video_service_consolidation_plan.md       # This comprehensive specification
│
├── compiler/                                 # ── 1. TIMELINE & COMPILATION ──
│   ├── __init__.py
│   ├── video_compiler.py                     # [CANONICAL] Multi-panel sequence compiler & audio-visual sync
│   ├── render_job.py                         # Asynchronous background job runner & progress tracking
│   ├── timeline_engine.py                    # Multi-track timeline model (video, audio, SFX, BGM)
│   └── audio_sync_engine.py                  # Dialogue speech-rate adaptation & waveform peak alignment
│
├── motion/                                   # ── 2. CAMERA MOTION & DYNAMICS ──
│   ├── __init__.py
│   ├── motion_engine.py                      # [CANONICAL] Ken Burns 2D motions (pans, zooms, static)
│   ├── camera_shake_engine.py                # Harmonic impact jitter & audio-reactive bass shake
│   ├── parallax_engine.py                    # 2.5D multi-plane depth motion (bg, character, text layers)
│   └── transition_engine.py                  # Visual scene transitions (crossfade, whip pan, zoom-through)
│
├── composition/                              # ── 3. FRAME COMPOSITION & GRAPHICS ──
│   ├── __init__.py
│   ├── frame_builder.py                      # Canvas aspect ratio fitting & fast downscaled blur fill
│   ├── subtitle_overlay.py                   # Cinematic dark pill subtitle banner & alpha blending
│   ├── sfx_visualizer.py                     # Animated manga onomatopoeia & visual impact lines
│   └── watermark_overlay.py                  # Creator branding & channel watermarks
│
├── operations/                               # ── 4. ATOMIC FFMPEG CLIP OPERATIONS ──
│   ├── __init__.py
│   ├── cutter_service.py                     # Video trimming, precision cuts & audio/video fades
│   ├── concat_service.py                     # Stream concatenation & xfade transition blending
│   ├── filter_service.py                     # Visual shaders, anime grading & noir grayscale
│   ├── speed_service.py                      # Playback speed adjustment with pitch preservation
│   ├── audio_merge_service.py                # Audio track extraction & multi-channel stem mixing
│   ├── subtitle_burn_service.py              # FFmpeg hardcoded SRT/VTT/ASS subtitle burning
│   ├── thumbnail_service.py                  # Keyframe poster extraction & animated WebP/GIF preview
│   └── probe_service.py                      # ffprobe technical stream & container inspection
│
├── export/                                   # ── 5. PACKAGING & PLATFORM EXPORT ──
│   ├── __init__.py
│   ├── export_presets.py                     # Platform presets (YouTube 16:9, Shorts/Reels 9:16, 1:1)
│   ├── gif_exporter.py                       # High-framerate animated GIF/WebP teaser generator
│   └── video_packager.py                     # Local disk persistence & cloud bucket uploader
│
├── utils/                                    # ── 6. FOUNDATIONAL UTILITY LAYER ──
│   ├── __init__.py                           # Clean facade exporting resolutions, timecodes, media
│   ├── resolutions.py                        # Aspect ratios, H.264 even-dimension clamp & bitrate math
│   ├── timecodes.py                          # SMPTE timecodes (HH:MM:SS:FF) & frame count math
│   └── media_resolver.py                     # Buffer downloads, temp directories & disk cache
│
└── router/                                   # ── 7. FASTAPI ROUTER INTERFACE ──
    ├── __init__.py                           # Assembles unified video_router
    ├── router.py                             # Main APIRouter mounted on /api/v1/video
    ├── render.py                             # Routes for /render, /stream/{filename}, /jobs/{id}
    ├── clip.py                               # Routes for /cut, /concatenate, /filter, /speed
    ├── audio.py                              # Routes for /extract-audio, /mix-audio
    ├── subtitles.py                          # Routes for /subtitles/burn
    └── metadata.py                           # Routes for /metadata inspection
```

---

## 2. Universal File Structure Rule: "Helpers at Top, Main API at Bottom"

Every single service file strictly adheres to the following structural standard:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. File Header & Docstring                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Imports (Standard library, 3rd party, foundational utils)           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Module Constants & Private Configuration                            │
├────────────────────────────────────────────────────────────────────────┤
│ 4. TOP: Internal Helper Utilities (Prefixed with `_`)                  │
│    - Pure local helper math, filters, and buffer transformations       │
│    - Private steps (e.g. `_resolve_clip_timing`, `_build_ffmpeg_args`) │
├────────────────────────────────────────────────────────────────────────┤
│ 5. BOTTOM: The Canonical Public API Function                           │
│    - One single public entrypoint for the entire file                  │
│    - Takes clean typed arguments, coordinates helpers, returns result  │
├────────────────────────────────────────────────────────────────────────┤
│ 6. `__all__ = ["main_public_function"]`                                │
│    - Exports ONLY the main function; outside files NEVER call helpers! │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2.1 Simplified English Function Naming Standard

All canonical public API functions follow concise, plain English naming conventions (Verb + Noun). For seamless backward compatibility, all previous names remain available as direct aliases:

| Sub-Module | File | Simplest English API (Primary) | Backward-Compatible Alias |
| :--- | :--- | :--- | :--- |
| **compiler** | `video_compiler.py` | `compile_video(...)` | `compile_video_from_panels(...)` |
| **compiler** | `render_job.py` | `run_render_job(...)` | `process_render_job(...)` |
| **compiler** | `timeline_engine.py` | `build_timeline(...)` | `build_multi_track_timeline(...)` |
| **compiler** | `audio_sync_engine.py`| `sync_dialogue(...)` | `align_dialogue_with_audio(...)` |
| **motion** | `motion_engine.py` | `apply_motion(...)` | `build_cinematic_motion_clip(...)` |
| **motion** | `camera_shake_engine.py`| `apply_shake(...)` | `build_camera_shake_clip(...)` |
| **motion** | `parallax_engine.py` | `apply_parallax(...)` | `build_parallax_motion_clip(...)` |
| **motion** | `transition_engine.py` | `apply_transition(...)` | `apply_clip_transition(...)` |
| **composition** | `frame_builder.py` | `build_frame(...)` | `build_panel_frame_image(...)` |
| **composition** | `subtitle_overlay.py` | `create_subtitles(...)` | `create_subtitle_overlay(...)` |
| **composition** | `sfx_visualizer.py` | `add_sfx_text(...)` | `overlay_manga_sfx(...)` |
| **composition** | `watermark_overlay.py` | `add_watermark(...)` | `apply_video_watermark(...)` |
| **operations** | `cutter_service.py` | `cut_video(...)` | `cut_video_clip(...)` |
| **operations** | `concat_service.py` | `concat_videos(...)` | `concatenate_video_clips(...)` |
| **operations** | `filter_service.py` | `apply_filter(...)` | `apply_video_filter(...)` |
| **operations** | `speed_service.py` | `change_speed(...)` | `adjust_video_speed(...)` |
| **operations** | `audio_merge_service.py`| `extract_audio(...)` | `extract_audio_from_video(...)` |
| **operations** | `audio_merge_service.py`| `mix_audio(...)` | `mix_audio_into_video(...)` |
| **operations** | `subtitle_burn_service.py`| `burn_subtitles(...)` | `burn_subtitles_into_video(...)` |
| **operations** | `thumbnail_service.py` | `get_thumbnail(...)` | `extract_video_thumbnail(...)` |
| **operations** | `probe_service.py` | `get_video_info(...)` | `probe_video_metadata(...)` |
| **export** | `export_presets.py` | `get_export_preset(...)` | `get_platform_export_profile(...)` |
| **export** | `export_gif.py` | `export_gif(...)` | `export_animated_teaser(...)` |
| **export** | `video_packager.py` | `save_video(...)` | `package_and_store_video(...)` |
| **utils** | `resolutions.py` | `make_even_dimensions(...)` | `ensure_even_dimensions(...)` |
| **utils** | `resolutions.py` | `get_resolution(...)` | `resolve_resolution(...)` |
| **utils** | `resolutions.py` | `get_bitrate(...)` | `calculate_video_bitrate(...)` |
| **utils** | `timecodes.py` | `get_total_frames(...)` | `calculate_total_frames(...)` |
| **utils** | `timecodes.py` | `parse_timecode(...)` | `parse_timecode_to_seconds(...)` |
| **utils** | `media_resolver.py` | `load_image(...)` | `resolve_video_input_image(...)` |
| **utils** | `media_resolver.py` | `get_output_path(...)` | `get_video_output_path(...)` |

---

## 3. Standardized Function Specifications (Every File Defined)

---

### Module: `backend/features/video/compiler/`

#### 1. `video_compiler.py`
* **Role**: Primary sequence compiler assembling comic panels, narration/dialogue audio, Ken Burns camera clips, and MoviePy/FFmpeg encoding into a master MP4.
* **Local Helpers (Top)**:
  * `_normalize_panel_data(raw_panel: Any) -> Dict[str, Any]`
  * `_resolve_audio_candidates(panel: Dict[str, Any], db_panel: Dict[str, Any], prefer_narrative: bool) -> List[str]`
  * `_resolve_panel_duration(panel: Dict[str, Any], audio_duration: Optional[float]) -> float`
  * `_build_panel_clip(img: Image.Image, panel: Dict[str, Any], w: int, h: int, duration: float, idx: int) -> VideoClip`
* **Main Public API (Bottom)**:
  ```python
  async def compile_video_from_panels(
      project_id: str,
      panels: List[Dict[str, Any]],
      output_dir: Optional[str] = None,
      target_width: int = 1920,
      target_height: int = 1080,
      voice: Optional[str] = None,
      enable_dialogue_audio: Optional[bool] = None,
      enable_narrative_audio: Optional[bool] = None,
      enable_subtitles: bool = False,
      report_progress: Optional[Any] = None,
      **kwargs: Any
  ) -> str:
      """Compiles comic panels, synchronized dialogue/narrative audio, and motion clips into master MP4 video."""
  ```
* **Exports**: `__all__ = ["compile_video_from_panels"]`

#### 2. `render_job.py`
* **Role**: Asynchronous background worker coordinating credit deduction, progress updates, output file persistence, and platform job manager integration.
* **Local Helpers (Top)**:
  * `_calculate_render_progress(current_pct: float) -> float`
  * `_format_video_url(filename: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def process_render_job(
      report_progress: Any,
      job_id: str,
      panels: List[Dict[str, Any]],
      voice: Optional[str] = None,
      music_theme: str = "none",
      aspect_ratio: str = "auto",
      frame_rate: int = 24,
      video_format: str = "mp4",
      background_style: str = "black",
      subtitles_style: str = "none",
      audio_reactive_shake: bool = False,
      shake_intensity: str = "medium",
      master_volume: float = 1.0,
      narration_volume: float = 1.0,
      bgm_volume: float = 1.0,
      speech_rate: float = 1.0,
      speech_pitch: float = 1.0,
      enable_dialogue_audio: Optional[bool] = None,
      enable_narrative_audio: Optional[bool] = None,
      project_id: Optional[str] = None,
  ) -> Dict[str, str]:
      """Coordinates and executes an asynchronous video render background task."""
  ```
* **Exports**: `__all__ = ["process_render_job"]`

#### 3. `timeline_engine.py`
* **Role**: Manages multi-track timeline data structures (video, dialogue, narrative, SFX, BGM) with non-overlapping cue points and track blending.
* **Local Helpers (Top)**:
  * `_calculate_track_bounds(clips: List[Dict[str, Any]]) -> float`
  * `_validate_cue_points(tracks: List[Dict[str, Any]]) -> None`
* **Main Public API (Bottom)**:
  ```python
  def build_multi_track_timeline(
      panels: List[Dict[str, Any]],
      bgm_track: Optional[str] = None,
      master_duration: Optional[float] = None
  ) -> Dict[str, Any]:
      """Constructs an integrated multi-track timeline mapping audio stems and motion clips."""
  ```
* **Exports**: `__all__ = ["build_multi_track_timeline"]`

#### 4. `audio_sync_engine.py`
* **Role**: Synchronizes narration dialogue segments with speech audio waveforms, detecting energy peaks to drive camera emphasis.
* **Local Helpers (Top)**:
  * `_detect_waveform_peaks(audio_data: bytes, sample_rate: int) -> List[float]`
* **Main Public API (Bottom)**:
  ```python
  def align_dialogue_with_audio(
      speech_text: str,
      audio_duration: float,
      audio_peaks: Optional[List[float]] = None
  ) -> Dict[str, Any]:
      """Aligns dialogue character counts and audio waveform energy peaks to panel timing."""
  ```
* **Exports**: `__all__ = ["align_dialogue_with_audio"]`

---

### Module: `backend/features/video/motion/`

#### 1. `motion_engine.py`
* **Role**: 2D Ken Burns camera engine generating smooth pans, optical zooms, and stationary clips from still panel images.
* **Local Helpers (Top)**:
  * `_normalize_motion_type(motion: Optional[str], aspect_ratio: float, idx: int) -> str`
  * `_create_scroll_frame_func(arr: np.ndarray, duration: float, target_w: int, target_h: int, is_up: bool, overlay: Any)`
  * `_create_pan_frame_func(arr: np.ndarray, duration: float, target_w: int, target_h: int, is_reverse: bool, is_vertical: bool, overlay: Any)`
  * `_create_zoom_frame_func(arr: np.ndarray, duration: float, target_w: int, target_h: int, is_zoom_out: bool, overlay: Any)`
* **Main Public API (Bottom)**:
  ```python
  def build_cinematic_motion_clip(
      img: Image.Image,
      target_width: int,
      target_height: int,
      duration: float,
      idx: int,
      motion_type: Optional[str] = None,
      subtitle_text: Optional[str] = None
  ) -> Tuple[VideoClip, str]:
      """Constructs a high-performance cinematic motion clip adhering strictly to the panel's configured motion."""
  ```
* **Exports**: `__all__ = ["build_cinematic_motion_clip"]`

#### 2. `camera_shake_engine.py`
* **Role**: Generates harmonic camera shake oscillation and audio-reactive impact jitter for high-action combat or explosion panels.
* **Local Helpers (Top)**:
  * `_calculate_shake_offsets(t: float, intensity: str, freq: float) -> Tuple[int, int]`
* **Main Public API (Bottom)**:
  ```python
  def build_camera_shake_clip(
      img: Image.Image,
      target_width: int,
      target_height: int,
      duration: float,
      intensity: str = "medium",
      subtitle_text: Optional[str] = None
  ) -> VideoClip:
      """Generates a high-intensity harmonic camera oscillation clip for impact panels."""
  ```
* **Exports**: `__all__ = ["build_camera_shake_clip"]`

#### 3. `parallax_engine.py`
* **Role**: 2.5D multi-plane camera movement for decomposed layers (background, character, dialogue bubbles) generating depth-enhanced parallax clips.
* **Local Helpers (Top)**:
  * `_calculate_layer_offset(depth: float, time_pct: float, intensity: float) -> Tuple[int, int]`
  * `_composite_parallax_frame(bg_arr: np.ndarray, char_arr: np.ndarray, text_arr: Optional[np.ndarray], offsets: Dict[str, Tuple[int, int]]) -> np.ndarray`
* **Main Public API (Bottom)**:
  ```python
  def build_parallax_motion_clip(
      background_img: Image.Image,
      character_img: Image.Image,
      text_img: Optional[Image.Image],
      target_width: int,
      target_height: int,
      duration: float,
      parallax_intensity: float = 30.0,
      motion_type: str = "zoom_in"
  ) -> VideoClip:
      """Generates a multi-layer parallax motion clip with differential layer velocity based on simulated depth."""
  ```
* **Exports**: `__all__ = ["build_parallax_motion_clip"]`

#### 4. `transition_engine.py`
* **Role**: Generates inter-scene transitions (crossfade, wipe, zoom-through, dip-to-black) between sequential clips.
* **Local Helpers (Top)**:
  * `_resolve_transition_mode(transition_name: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def apply_clip_transition(
      clip_a: VideoClip,
      clip_b: VideoClip,
      transition_type: str = "crossfade",
      duration: float = 0.5
  ) -> VideoClip:
      """Blends two video clips using cinematic visual transition curves."""
  ```
* **Exports**: `__all__ = ["apply_clip_transition"]`

---

### Module: `backend/features/video/composition/`

#### 1. `frame_builder.py`
* **Role**: Resizes foreground panels, centers them into the target aspect canvas, and fills background margins using accelerated downsampled Gaussian blur.
* **Local Helpers (Top)**:
  * `_calculate_letterbox_dims(src_w: int, src_h: int, dst_w: int, dst_h: int) -> Tuple[int, int, int, int]`
  * `_generate_blurred_fill(bg_image: Image.Image, dst_w: int, dst_h: int, blur_radius: int = 6) -> Image.Image`
* **Main Public API (Bottom)**:
  ```python
  def build_panel_frame_image(
      background_image: Image.Image,
      foreground_image: Image.Image,
      target_width: int = 1920,
      target_height: int = 1080,
  ) -> Image.Image:
      """Combines foreground panel centered over a blurred background fill with fast downscaled blur."""
  ```
* **Exports**: `__all__ = ["build_panel_frame_image"]`

#### 2. `subtitle_overlay.py`
* **Role**: Precomputes rounded dark pill banners with glowing borders and sharp centered text for non-destructive alpha compositing onto video frames.
* **Local Helpers (Top)**:
  * `_resolve_overlay_font(font_size: int) -> ImageFont.FreeTypeFont`
  * `_truncate_subtitle_text(text: str, max_chars: int = 160) -> str`
* **Main Public API (Bottom)**:
  ```python
  def create_subtitle_overlay(
      text: str,
      target_width: int = 1920
  ) -> Optional[SubtitleOverlay]:
      """Renders a sleek cinematic subtitle overlay banner to blend onto frames."""
  ```
* **Exports**: `__all__ = ["create_subtitle_overlay", "SubtitleOverlay"]`

#### 3. `sfx_visualizer.py`
* **Role**: Renders animated manga onomatopoeia text and dynamic speed lines overlaid on key action moments.
* **Local Helpers (Top)**:
  * `_generate_impact_radial_lines(width: int, height: int, density: int) -> Image.Image`
* **Main Public API (Bottom)**:
  ```python
  def overlay_manga_sfx(
      frame: Image.Image,
      sfx_text: str,
      impact_level: str = "medium"
  ) -> Image.Image:
      """Overlays stylized comic action lettering and radial speed lines onto a video frame."""
  ```
* **Exports**: `__all__ = ["overlay_manga_sfx"]`

#### 4. `watermark_overlay.py`
* **Role**: Stamps customizable branding watermarks or channel logos onto output video frames with selectable opacity and corner anchors.
* **Local Helpers (Top)**:
  * `_calculate_anchor_coords(cw: int, ch: int, ww: int, wh: int, position: str) -> Tuple[int, int]`
* **Main Public API (Bottom)**:
  ```python
  def apply_video_watermark(
      frame: Image.Image,
      watermark_image: Image.Image,
      position: str = "bottom-right",
      opacity: float = 0.85
  ) -> Image.Image:
      """Stamps a transparent creator logo or watermark onto the video canvas."""
  ```
* **Exports**: `__all__ = ["apply_video_watermark"]`

---

### Module: `backend/features/video/operations/`

#### 1. `cutter_service.py`
* **Role**: Cuts and trims video clips based on start/end timestamps with optional audio/video fade-in and fade-out effects using FFmpeg.
* **Local Helpers (Top)**:
  * `_build_cut_filter_args(fade_in: float, fade_out: float, duration: float) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def cut_video_clip(
      video_path: str,
      start_time: float,
      end_time: float,
      output_path: Optional[str] = None,
      fade_in: float = 0.0,
      fade_out: float = 0.0
  ) -> str:
      """Trims a video segment between start_time and end_time, applying optional visual and acoustic fades."""
  ```
* **Exports**: `__all__ = ["cut_video_clip"]`

#### 2. `concat_service.py`
* **Role**: Merges multiple video clips sequentially using FFmpeg, supporting xfade visual transitions.
* **Local Helpers (Top)**:
  * `_generate_concat_demuxer_manifest(video_paths: List[str]) -> str`
  * `_build_xfade_filter_complex(video_paths: List[str], transitions: List[Dict[str, Any]]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def concatenate_video_clips(
      video_paths: List[str],
      output_path: Optional[str] = None,
      transitions: Optional[List[Dict[str, Any]]] = None,
      fps: int = 24,
      width: int = 1920,
      height: int = 1080
  ) -> str:
      """Merges multiple video files with optional transition blending into a unified video stream."""
  ```
* **Exports**: `__all__ = ["concatenate_video_clips"]`

#### 3. `filter_service.py`
* **Role**: Applies visual color and image processing filters (grayscale, blur, sepia, invert, sharpen) using FFmpeg.
* **Local Helpers (Top)**:
  * `_resolve_filter_graph(filter_type: str, intensity: float) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def apply_video_filter(
      video_path: str,
      filter_type: str,
      intensity: float = 1.0,
      output_path: Optional[str] = None
  ) -> str:
      """Applies FFmpeg visual shaders and grading filters to an existing video file."""
  ```
* **Exports**: `__all__ = ["apply_video_filter"]`

#### 4. `speed_service.py`
* **Role**: Adjusts video playback speed while preserving audio pitch stability using the `atempo` filter.
* **Local Helpers (Top)**:
  * `_build_speed_filter_args(speed_factor: float, preserve_pitch: bool) -> Tuple[str, str]`
* **Main Public API (Bottom)**:
  ```python
  async def adjust_video_speed(
      video_path: str,
      speed_factor: float,
      preserve_pitch: bool = True,
      output_path: Optional[str] = None
  ) -> str:
      """Adjusts video playback speed while maintaining audio pitch stability."""
  ```
* **Exports**: `__all__ = ["adjust_video_speed"]`

#### 5. `audio_merge_service.py`
* **Role**: Demuxes audio streams from video containers, and mixes multi-channel audio stems into a master video file with gain controls.
* **Local Helpers (Top)**:
  * `_build_amix_filter_graph(track_count: int, volumes: Optional[List[float]]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def extract_audio_from_video(
      video_path: str,
      output_path: Optional[str] = None,
      format_str: str = "mp3",
      bitrate: str = "192k"
  ) -> str:
      """Demuxes and encodes the primary audio stream from a video file."""

  async def mix_audio_into_video(
      video_path: str,
      audio_paths: List[str],
      audio_volumes: Optional[List[float]] = None,
      output_path: Optional[str] = None
  ) -> str:
      """Replaces or mixes external audio stems into the video container."""
  ```
* **Exports**: `__all__ = ["extract_audio_from_video", "mix_audio_into_video"]`

#### 6. `subtitle_burn_service.py`
* **Role**: Burns subtitle tracks (.srt, .vtt, .ass) permanently into video frames using FFmpeg's subtitle filter.
* **Local Helpers (Top)**:
  * `_sanitize_subtitle_path_for_ffmpeg(path: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def burn_subtitles_into_video(
      video_path: str,
      subtitle_path: str,
      output_path: Optional[str] = None
  ) -> str:
      """Burns styled subtitles permanently into video frames using the FFmpeg subtitle filter."""
  ```
* **Exports**: `__all__ = ["burn_subtitles_into_video"]`

#### 7. `thumbnail_service.py`
* **Role**: Extracts keyframe stills and creates lightweight animated WebP/GIF previews from video files for fast scrubbing and poster cards.
* **Local Helpers (Top)**:
  * `_build_thumbnail_time_offset(duration: float, position_pct: float) -> float`
* **Main Public API (Bottom)**:
  ```python
  async def extract_video_thumbnail(
      video_path: str,
      timestamp_seconds: Optional[float] = None,
      output_path: Optional[str] = None,
      width: int = 1280
  ) -> str:
      """Extracts a high-definition poster image from the designated timestamp of a video."""
  ```
* **Exports**: `__all__ = ["extract_video_thumbnail"]`

#### 8. `probe_service.py`
* **Role**: Extracts complete technical container and stream metadata (resolution, frame rate, duration, audio sample rate, codec, bitrate) via ffprobe.
* **Local Helpers (Top)**:
  * `_parse_ffprobe_json(raw_json: Dict[str, Any]) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def probe_video_metadata(
      video_path: str
  ) -> Dict[str, Any]:
      """Probes a video container using ffprobe and returns normalized technical stream metadata."""
  ```
* **Exports**: `__all__ = ["probe_video_metadata"]`

---

### Module: `backend/features/video/export/`

#### 1. `export_presets.py`
* **Role**: Standardized encoding presets for major publishing platforms.
* **Main Public API (Bottom)**:
  ```python
  def get_platform_export_profile(platform: str = "youtube_1080p") -> Dict[str, Any]:
      """Returns recommended encoder settings (codec, bitrate, aspect ratio, audio sample rate) for targeted platform."""
  ```
* **Exports**: `__all__ = ["get_platform_export_profile"]`

#### 2. `gif_exporter.py`
* **Role**: Converts video highlights into highly optimized animated GIFs and WebP teasers with palette generation.
* **Local Helpers (Top)**:
  * `_build_gif_palette_cmd(video_path: str, output_path: str, fps: int, width: int) -> List[str]`
* **Main Public API (Bottom)**:
  ```python
  async def export_animated_teaser(
      video_path: str,
      start_time: float,
      duration: float,
      format_type: str = "webp",
      output_path: Optional[str] = None
  ) -> str:
      """Generates an animated teaser preview clip with optimized two-pass color palette generation."""
  ```
* **Exports**: `__all__ = ["export_animated_teaser"]`

#### 3. `video_packager.py`
* **Role**: Persists compiled videos to local media directories or uploads them to Supabase Storage buckets.
* **Main Public API (Bottom)**:
  ```python
  async def package_and_store_video(
      source_video_path: str,
      project_id: str,
      upload_to_cloud: bool = False
  ) -> Dict[str, str]:
      """Finalizes video rendering output, sets permissions, and stores references to disk/cloud storage."""
  ```
* **Exports**: `__all__ = ["package_and_store_video"]`

---

### Module: `backend/features/video/utils/` (Pure Foundational Layer)

#### 1. `resolutions.py`
* **Role**: Resolution preset dictionary, aspect ratio calculations, H.264 even-dimension validation, and bitrate recommendations.
* **Main Public API (Bottom)**:
  ```python
  def resolve_resolution(preset: str, default: Tuple[int, int] = (1920, 1080)) -> Tuple[int, int]: ...
  def ensure_even_dimensions(width: int, height: int) -> Tuple[int, int]: ...
  def calculate_video_bitrate(width: int, height: int, fps: int = 30) -> str: ...
  ```
* **Exports**: `__all__ = ["STANDARD_RESOLUTIONS", "resolve_resolution", "ensure_even_dimensions", "calculate_video_bitrate"]`

#### 2. `timecodes.py`
* **Role**: SMPTE timecode conversions (`HH:MM:SS:FF`), frame count calculations, and timing clamps.
* **Main Public API (Bottom)**:
  ```python
  def calculate_total_frames(duration_seconds: Union[int, float], fps: int = 30) -> int: ...
  def format_timecode(seconds: Union[int, float], fps: int = 30) -> str: ...
  def parse_timecode_to_seconds(timecode: str, fps: int = 30) -> float: ...
  ```
* **Exports**: `__all__ = ["calculate_total_frames", "format_timecode", "parse_timecode_to_seconds"]`

#### 3. `media_resolver.py`
* **Role**: Resolves remote image URLs and Base64 payloads into local memory buffers or disk paths for video composition.
* **Main Public API (Bottom)**:
  ```python
  async def resolve_video_input_image(url_or_b64: str) -> Image.Image: ...
  def get_video_output_path(filename: Optional[str] = None) -> str: ...
  ```
* **Exports**: `__all__ = ["resolve_video_input_image", "get_video_output_path"]`

---

## 4. Architectural Guarantee: Caller Discipline & Backward Compatibility

### Strict Caller Discipline
1. External modules and routers **NEVER** import internal `_helper` functions.
2. Every file defines `__all__` exposing **ONLY its main public function**.
3. All inter-service calls use the main entrypoint at the bottom of the target file.
4. `utils/` is strictly foundational and never imports any parent domain service.
5. All route definitions in `router/` delegate execution immediately to the respective service file.

### Backward Compatibility Guarantees
To prevent breaking existing frontends, background tasks, or tests:
1. `backend/features/video_editor/video/` will re-export directly from `backend/features/video/`:
   ```python
   # In features/video_editor/video/service.py
   from features.video.service import VideoService, video_service
   ```
2. Both `/api/v1/video/*` and `/api/v1/video-editor/video/*` route prefixes will be mounted and functional.
3. Test suite [`test_11_audio_video_export.py`](file:///c:/Users/dheen/project/Sonikoma/backend/tests/test_11_audio_video_export.py) will continue running cleanly with zero modifications.

---

## 5. Migration & Consolidation Roadmap (For Execution)

| Phase | Target Scope | Key Tasks |
| :--- | :--- | :--- |
| **Phase 1** | **Directory Initialization & Utils** | Create subdirectories in `backend/features/video/`. Populate `utils/` with `resolutions.py`, `timecodes.py`, `media_resolver.py`. |
| **Phase 2** | **Composition & Motion Services** | Standardize `frame_builder.py`, `subtitle_overlay.py`, `motion_engine.py`, `camera_shake_engine.py`, `parallax_engine.py`. |
| **Phase 3** | **Compilation & Timeline Core** | Move and standardize `video_compiler.py`, `render_job.py`, `timeline_engine.py`, `audio_sync_engine.py`. |
| **Phase 4** | **FFmpeg Operations Integration** | Absorb trapped FFmpeg logic from `ai_engine/providers/video` into `operations/` (`cutter`, `concat`, `filter`, `speed`, `audio_merge`, `subtitle_burn`, `thumbnail`, `probe`). |
| **Phase 5** | **Export & Packaging** | Implement `export/` presets, GIF/WebP teaser exporter, and video packaging service. |
| **Phase 6** | **Modular Routing & Compatibility Shims** | Deploy modular `router/` handlers and wire backward compatibility shims in `features/video_editor/video/`. |
