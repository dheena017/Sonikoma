# Provider Layer Architecture Audit

## 1. Executive Summary
An architecture audit of the `backend/app/providers/**` directory was performed to ensure the Provider layer acts exclusively as an adapter for external services, SDKs, and third-party APIs. Violations in the YOLO vision provider where business and orchestration logic (Data Flywheel pipeline) had leaked into the provider layer were identified and refactored safely into the Services layer.

## 2. Provider Inventory
The application currently maintains the following providers:
* **AI Providers** (`backend/app/providers/ai/`)
  * `gemini.py` (Google GenAI API adapter)
  * `whisper.py` (OpenAI Whisper translation model wrapper)
  * `stable_diffusion_client.py` (HuggingFace Diffusers pipeline wrapper)
  * `edge_tts.py` (Microsoft Edge-TTS synthesis adapter)
* **Media Providers** (`backend/app/providers/media/`)
  * `imagemagick.py` (ImageMagick/Wand image transformation wrapper)
* **Vision Providers** (`backend/app/providers/vision/`)
  * `sam.py` (U-2-Net / rembg wrapper for character segmentation)
  * `yolo.py` (Ultralytics YOLO wrapper for image/speech bubble segmentation)

## 3. Dependency Analysis
The dependency boundaries strictly require Providers to have no knowledge of `FastAPI` context, request validation pipelines (`HTTPException`), or arbitrary application-specific `app.services`, `app.repositories`, or `app.database` states. All providers except `yolo.py` were clean and effectively wrapped their underlying SDKs.

## 4. Architectural Violations
**Violation 1: Provider containing business workflows and dataset persistence**
* **File:** `backend/app/providers/vision/yolo.py`
* **Details:** This provider was deeply coupled to the "Data Flywheel" training logic. It handled its own `TrainingStatus` singletons, explicitly wrote/read OS process locks (`training.lock`), shuffled image datasets (`prepare_dataset`), managed dataset splits for 80/20 training setups, ran OS-level background thread processes (`_train_worker`, `trigger_fine_tuning`), and orchestrated Ultralytics `YOLO.train()` pipelines.
* **Resolution:** Moved all dataset preparation, worker management, and training state classes to `backend/app/services/vision_training.py`.

## 5. Dependency Direction Validation
* Re-validated that `FastAPI` and `HTTPException` are nowhere to be found inside `backend/app/providers/**`.
* Validated that exceptions raised by Providers are strictly domain exceptions or python standard errors (`ValueError`, `RuntimeError`, `ImportError`).
* Validated that `providers` no longer internally import from themselves cyclically within worker closures.

## 6. Refactoring Performed
* Created `backend/app/services/vision_training.py` and extracted `TrainingStatus`, `prepare_dataset`, `_train_worker`, and `trigger_fine_tuning` from `backend/app/providers/vision/yolo.py`.
* Updated `backend/app/services/training/training_monitor.py` and `backend/app/api/v1/images/upload.py` to import training mechanisms from `services.vision_training` rather than `providers.vision.yolo` to prevent breaking the Data Flywheel functionality.
* Left model load/download capabilities (`get_yolo_model`, `segment_text_and_balloons`, `segment_characters`, and `convert_mask_to_yolo_txt` as it directly works with OpenCV) intact in `providers/vision/yolo.py` since those represent actual SDK interface translations for object detection requests. All inferences were kept byte-for-byte identical.

## 7. Files Modified
* `backend/app/providers/vision/yolo.py`
* `backend/app/services/vision_training.py` (New file)
* `backend/app/api/v1/images/upload.py`
* `backend/app/services/training/training_monitor.py`

## 8. Files Requiring Manual Review
* None directly, though `backend/app/services/vision_training.py` could benefit from further decomposition into a broader training service package if the YOLO dataset format evolves in the future.

## 9. Validation Results
* Import validations were manually verified to resolve properly without cyclical issues.
* Test executions (`pytest`) could not be automatically validated as the backend lacks dependencies in the sandbox or `tests/` aren't locally executable without `numpy/opencv`.
* To validate manually, the engineer should start the FastAPI server and upload an original + masked panel pair to ensure the Data Flywheel successfully executes the `services/vision_training.py` worker.

## 10. Future Recommendations
* **Consolidation of YOLO Providers:** The project currently maintains an interface `backend/app/services/image/providers/yolo_provider.py` as well as the provider layer `backend/app/providers/vision/yolo.py`. These could be consolidated to prevent duplicate YOLO abstraction logic.
* **Remove Side-Effects:** The custom fine-tuned YOLO model loader should rely strictly on an explicit config path string instead of hot-swapping Python module variables (`se._yolo_model = YOLO(finetuned_path)`) across services.
