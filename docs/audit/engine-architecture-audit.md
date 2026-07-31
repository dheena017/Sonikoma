# Engine Layer Architecture Audit

## 1. Executive Summary
An enterprise-grade architectural audit of the `backend/app/engines/` layer was performed to enforce strict Layered Architecture principles. The Engine layer is responsible solely for executing processing tasks, constructing commands, and external tool integration, while remaining completely agnostic of business logic, Services, API, or Repository layers.

The audit identified one major architectural violation: an inversion of dependencies where `engines/ffmpeg.py` imported execution components from `services/video/`. This violation has been fully remediated by extracting and relocating the execution components down into the `engines/video/` module and redirecting dependencies accordingly. The `librosa`, `stable_diffusion_engine`, and `whisper` engines were also audited and found to be strictly compliant.

## 2. Engine Inventory
The current backend Engine layer consists of the following components:
- `backend/app/engines/ffmpeg.py` (and the newly created `backend/app/engines/video/` package)
- `backend/app/engines/librosa.py`
- `backend/app/engines/stable_diffusion_engine.py`
- `backend/app/engines/whisper.py`

## 3. Dependency Analysis
- `librosa.py`: Compliant. Depends only on standard library (`logging`, `asyncio`, `dataclasses`), external AI/math libraries (`numpy`, `librosa`, `soundfile`), and typing primitives.
- `stable_diffusion_engine.py`: Compliant. Depends only on standard library, external libraries (`torch`, `diffusers`, `PIL`, `numpy`), and typing.
- `whisper.py`: Compliant. Depends only on standard library, external libraries (`whisper`), and typing primitives.
- `ffmpeg.py`: **Non-compliant** (prior to refactor). It previously depended directly on `services.video.render_service`, `services.video.subtitle_service`, `services.video.ffmpeg_commands`, and `services.video.ffmpeg_types`.

## 4. Architectural Violations
**Violation 1: Dependency Inversion in FFmpeg Engine**
- **Location:** `backend/app/engines/ffmpeg.py`
- **Description:** The `FFmpegEngine` class acted as a facade but instantiated and invoked `RenderService` and `SubtitleService` from the `services/video/` layer. Command construction logic (`build_ffprobe_cmd`, `build_add_subtitles_cmd`, etc.) and processing enums were also placed in `services/video/`.
- **Severity:** High (Breaks layered dependency flow). Engines must not depend on Services.

## 5. Dependency Direction Validation
Following the refactoring, the dependency direction is now correct:
- Services (`backend/app/services/video/video_service.py`) orchestrate video tasks.
- Services import configurations/types from Engines (`backend/app/engines/video/ffmpeg_types.py`).
- Engines (`backend/app/engines/ffmpeg.py`, `backend/app/engines/video/*`) only import standard libraries, external tools (`subprocess`), and internal engine utilities. No engines import from `services`, `api`, or `repositories`.

## 6. Refactoring Performed
The dependency inversion in the FFmpeg processing flow was resolved by shifting purely execution-focused modules from the Service layer into the Engine layer:

1. Created a new submodule `backend/app/engines/video/`.
2. Moved the following purely technical files from `services/video/` to `engines/video/`:
   - `ffmpeg_types.py`
   - `ffmpeg_commands.py`
   - `edit_helpers.py`
   - `render_service.py`
   - `subtitle_service.py`
3. Updated `backend/app/engines/ffmpeg.py` to import these delegates from `engines.video.*`.
4. Updated `backend/app/engines/video/ffmpeg_commands.py`, `edit_helpers.py`, `types.py`, and `render_service.py` to reference `engines.video.*`.
5. Created a proxy wrapper file `backend/app/services/video/types.py` that re-exports standard types from `engines.video.ffmpeg_types` to maintain backward-compatibility with upstream consumers in the rest of the application without introducing breaking changes.

## 7. Files Modified
- `backend/app/engines/ffmpeg.py` (Modified imports)
- `backend/app/services/video/ffmpeg_types.py` (Moved to `backend/app/engines/video/`)
- `backend/app/services/video/ffmpeg_commands.py` (Moved to `backend/app/engines/video/`)
- `backend/app/services/video/edit_helpers.py` (Moved to `backend/app/engines/video/`)
- `backend/app/services/video/render_service.py` (Moved to `backend/app/engines/video/`)
- `backend/app/services/video/subtitle_service.py` (Moved to `backend/app/engines/video/`)
- `backend/app/services/video/types.py` (Updated to re-export from `engines.video.ffmpeg_types`)

## 8. Files Requiring Manual Review
- `backend/app/engines/ffmpeg.py` (To verify the architectural split satisfies team preferences).
- `backend/app/engines/video/render_service.py` (To confirm that orchestrating `subprocess` calls within this newly moved module perfectly aligns with the execution semantics of the Engine layer).

## 9. Validation Results
- **Backend Import Validation:** Ran successfully for `engines/ffmpeg.py`, `services/video/types.py`, and all newly moved components under `engines/video/`.
- **Static Test Suite Execution:** Could not be fully completed.
- **Why:** The local sandbox environment is missing third-party system dependencies required by the requirements file (`pytest`, `uvicorn`, `numpy`, etc.) needed to bootstrap the complete FastAPI test suite.
- **Manual Command Required:** To fully validate the test suite and verify standard server startup, developers should run:
  ```bash
  cd backend
  pip install -r requirements.txt
  python -m pytest
  ```

## 10. Future Recommendations
- **Naming Conventions:** Currently, the FFmpeg execution modules moved from Services still carry the suffix `_service.py` (i.e. `render_service.py` and `subtitle_service.py`). Although they are now securely within the Engine layer and contain only execution logic, a future non-breaking rename to `render_engine.py` or `render_worker.py` is recommended to avoid semantic confusion.
- **Further Decoupling of the AI Engines:** The AI Engines (`whisper.py`, `stable_diffusion_engine.py`) heavily embed `asyncio.to_thread` directly wrapping the library's blocking calls. This is architecturally sound for the Engine layer, but a future refactor could consider decoupling the synchronous ML inference into an isolated queue/process pool to reduce GIL contention within the ASGI application loop.