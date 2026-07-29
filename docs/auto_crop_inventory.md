# Auto Crop & Panel Detection Architecture Inventory

## 1. Backend APIs & Endpoints

### API Router: `backend/app/api/v1/ai/image.py`
| Endpoint Path | HTTP Method | Function Name | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/ai/detect-panels` | `POST` | `detect_panels()` | OpenCV contour-based panel detection for image URLs |
| `/api/v1/ai/detect-panels-b64` | `POST` | `detect_panels_b64()` | Base64-encoded OpenCV contour panel detection |
| `/api/v1/ai/detect-panels-batch` | `POST` | `detect_panels_batch()` | Parallel batch panel detection for multiple images |
| `/api/v1/ai/ai-detect-panels` | `POST` | `ai_detect_panels()` | AI-powered (Gemini 2.5 Flash / 3.6 Flash) vision panel detection |

---

## 2. Backend Processing Engines & Services

### `backend/app/services/image/detect_panels.py`
- `detect_panels_in_image(image_bytes, options)`: Primary OpenCV entry point for byte-stream decoding, color filter selection, and contour analysis.
- `detect_panels_base64(base64_str, options)`: Wrapper for base64 image decoding and panel extraction.

### `backend/app/services/image/panel_grid_detect.py`
- `detect_manga_panels(img, ...)`: Core OpenCV pipeline. Uses grayscale conversion, Canny edge detection, morphological closing (`cv2.morphologyEx`), contour finding (`cv2.findContours`), and bounding box filtering (min area, min height, aspect ratio).

### `backend/app/services/image/panel_webtoon_detect.py`
- `slice_webtoon_strip(img, ...)`: Specialized vertical gutter analyzer for slicing continuous long webtoon strips into individual panels.

### `backend/app/services/ai/facade.py`
- `detect_panels_ai(image_url, model, guidance)`: Sends visual prompt to Gemini AI model to detect panel coordinates and speech bubble locations.

---

## 3. Frontend API Clients

### `frontend/src/api/endpoints/scraper.ts`
- `detectPanels(fetch, payload)`: Sends request to `/api/v1/ai/detect-panels`.
- `detectPanelsB64(fetch, payload)`: Sends request to `/api/v1/ai/detect-panels-b64`.
- `detectPanelsBatch(fetch, payload)`: Sends request to `/api/v1/ai/detect-panels-batch`.

### `frontend/src/api/endpoints/ai.ts`
- `aiDetectPanels(fetch, payload)`: Sends request to `/api/v1/ai/ai-detect-panels`.

---

## 4. Frontend UI Components & Settings

Location: `frontend/src/features/image/components/editor/Tools/ImageEditor/AutoCrop/`

### Modals & Containers
- `AutoCropModal.tsx` (`frontend/src/features/processing/components/`): Main dialog modal for batch Auto Panel Detection.
- `AutoCropTabContent.tsx` (`components/`): Sub-tab router for General and Advanced CV tabs.
- `AutoSlicer.tsx` (`components/`): Inline sidebar auto-cutter component.

### Tab Components
- `AutoCropGeneralTab.tsx` (`components/`): Renders preset grids, webtoon seam slicer toggle, edge complexity analysis, and engine selector.
- `AutoCropAdvancedTab.tsx` (`components/`): Renders fine-tuning parameter sliders (Sensitivity, Min Panel Height, Min Panel Area, Overlap Merge), Canny controls, and JSON payload debugger.

### Subcomponents & Controls
- `AutoCropEngineSelectorV2.tsx` & `AutoCropEngineSelector.tsx` (`components/`): Engine selector toggle between Local OpenCV and Gemini AI.
- `AutoCropPresetGrid.tsx` (`components/`): Grid selector for built-in crop profiles (Balanced, Webtoon, Splash, Dense).
- `AutoCropComplexityAnalysis.tsx` (`components/`): Analyzes target image edge density to suggest optimal Canny thresholds.
- `AutoCropCannyControls.tsx` (`components/`): Adjusts Canny Low/High thresholds and closing kernel size.
- `AutoCropParameterSlider.tsx` (`components/`): Reusable slider control with parameter hints.
- `AutoCropJsonDebugger.tsx` (`components/`): Real-time JSON payload previewer.
- `AutoSlicerSettings.tsx` & `AutoSlicerCanny.tsx` (`components/`): Inline settings and OpenCV parameters for AutoSlicer sidebar tool.

---

## 5. Frontend State Management & Engines

### `AutoCropContext.tsx` (`contexts/`)
- `AutoCropProvider`: React context provider maintaining `activeEngine`, engine settings, and history state.
- `useAutoCrop()`: Hook to access AutoCrop state across components.

### `EngineRegistry.ts` (`services/`)
- `EngineRegistry`: Pluggable engine registry managing `OpenCVEngine` and `AISmartEngine` implementations.

### `useAutoCropPresets.ts` (`frontend/src/features/image/hooks/crop/`)
- `useAutoCropPresets(props)`: Custom hook for loading and applying built-in crop presets.
