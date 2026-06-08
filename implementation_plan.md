# Comprehensive Front-End & Back-End Refactoring Plan

We will refactor several key frontend components, hooks, backend service engines, and route handlers to improve modularity, maintainability, and clean separation of concerns.

## User Review Required

Please review the proposed architectural modularization before proceeding to code changes. We have mapped out specific sub-modules for the frontend modals, hooks, canvas utilities, backend scraper services, python speech-bubble cleaner strategies, and Node.js express route controllers.

---

## Proposed Changes

### Shared Components & Utilities

#### [NEW] [SectionTitle.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/SectionTitle.tsx)
Create a unified, reusable `SectionTitle` component.

#### [NEW] [RangeSlider.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/RangeSlider.tsx)
Create a reusable range-slider component.

---

### Main App Modularization (`App.tsx` & Hook Refactoring)

#### [NEW] [useAppLogic.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/hooks/useAppLogic.ts)
Extract all main application state declarations, local storage synchronization, SSE system logs, playback TTS audio speakers, and generation handlers.

#### [MODIFY] [App.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/App.tsx)
- Re-route state logic to the `useAppLogic` hook.

---

### Scraper Deck Modularization (`LiveScraperDeck.tsx` Refactoring)

#### [NEW] [useLiveScraperActions.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/hooks/useLiveScraperActions.ts)
Extract JSZip downloads and timeline card mapping logic.

#### [NEW] [LiveScraperHeader.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/scraper/LiveScraperHeader.tsx)
Renders title counts and toolbar action buttons.

#### [NEW] [LiveScraperGrid.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/scraper/LiveScraperGrid.tsx)
Renders the horizontally scrollable grid of panel cards.

#### [MODIFY] [LiveScraperDeck.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/LiveScraperDeck.tsx)
- Thin wrapper layout that uses the hook and subcomponents.

---

### Panel Stitcher Modularization (`MergePanel.tsx` Refactoring)

#### [NEW] [MergePanelOptions.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/MergePanelOptions.tsx)
Renders layout directions, scales, padding sliders, and color options selectors.

#### [NEW] [MergePanelList.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/MergePanelList.tsx)
Renders merge counts, preview list thumbnails, and mapping summaries.

#### [MODIFY] [MergePanel.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/MergePanel.tsx)
- Simplify to use the new layout subcomponents.

---

### Panel Slicer Modularization (`HorizontalSplitter.tsx` Refactoring)

#### [NEW] [HorizontalSplitterPresets.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/HorizontalSplitterPresets.tsx)
Handles preset creation, equal parts splitting, interval splitting, custom pixel slicing, and templates loader.

#### [NEW] [HorizontalSplitterControls.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/HorizontalSplitterControls.tsx)
Handles gutter snap controls, threshold tolerance values, and bulk split shifting operations.

#### [NEW] [HorizontalSplitterPreview.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/HorizontalSplitterPreview.tsx)
Renders resulting segment tables and heights.

#### [MODIFY] [HorizontalSplitter.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/HorizontalSplitter.tsx)
- Re-route split presets, templates, and controls logic to layout subcomponents.

---

### Bubble Eraser Panel Modularization (`CleanBubblesPanel.tsx` Refactoring)

#### [NEW] [CleanBubblesPresets.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesPresets.tsx)
Renders presets selection carousel.

#### [NEW] [CleanBubblesModes.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesModes.tsx)
Renders mode selections, erase strategies, fill selectors, and chroma-filtering parameters.

#### [NEW] [CleanBubblesAdvanced.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesAdvanced.tsx)
Renders dilation sliders, Structuring morph shapes, text stroke structures, and inpainting neighborhood configurations.

#### [NEW] [CleanBubblesManual.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesManual.tsx)
Renders manual spot brush size selectors and drawing triggers.

#### [NEW] [CleanBubblesHistory.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesHistory.tsx)
Renders undo/redo state history logs.

#### [MODIFY] [CleanBubblesPanel.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CleanBubblesPanel.tsx)
- Clean up to be a minimal configuration panel container.

---

### Crop Canvas Component Modularization (`CropCanvas.tsx` Refactoring)

#### [NEW] [CanvasBrushLayer.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CanvasBrushLayer.tsx)
Renders the canvas layer for manual spot-healing brush painting.

#### [NEW] [CanvasBubbleBoxes.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CanvasBubbleBoxes.tsx)
Renders detected bubble rectangles.

#### [NEW] [CanvasSplitLines.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CanvasSplitLines.tsx)
Renders split lines overlays.

#### [NEW] [CanvasCropSelection.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CanvasCropSelection.tsx)
Renders crop box handles.

#### [MODIFY] [CropCanvas.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CropCanvas.tsx)
- Delegate layers.

---

### Contours Auto Cutter Component Modularization (`AutoSlicer.tsx` Refactoring)

#### [NEW] [AutoSlicerSettings.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/AutoSlicerSettings.tsx)
Renders background boundary modes and aspect ratio selections.

#### [NEW] [AutoSlicerCanny.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/AutoSlicerCanny.tsx)
Renders Canny edge values and advanced OpenCV contour morph params.

#### [MODIFY] [AutoSlicer.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/AutoSlicer.tsx)
- Simplify wrapper to use the new subcomponents.

---

### Crop Editor Modal Refactoring

#### [NEW] [CropEditorHeader.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CropEditorHeader.tsx)
#### [NEW] [CropEditorFooter.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CropEditorFooter.tsx)
#### [NEW] [CropEditorCanvasContainer.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CropEditorCanvasContainer.tsx)
#### [NEW] [CropEditorSidebar.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/CropEditorSidebar.tsx)
#### [NEW] [useEnhancementHandlers.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/useEnhancementHandlers.ts)
#### [NEW] [useBodyScrollLock.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/hooks/useBodyScrollLock.ts)
#### [MODIFY] [types.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/types.ts)
#### [MODIFY] [CropEditorModal.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/CropEditorModal.tsx)

---

### Bubble Cleaner Modal Refactoring

#### [NEW] [bubbleCleanerConfig.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/bubbleCleanerConfig.ts)
#### [NEW] [BubbleCleanerLeftColumn.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/BubbleCleanerLeftColumn.tsx)
#### [NEW] [BubbleCleanerRightColumn.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/BubbleCleanerRightColumn.tsx)
#### [MODIFY] [BubbleCleanerModal.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/BubbleCleanerModal.tsx)

---

### Auto Crop Modal Refactoring

#### [NEW] [autoCropConfig.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/autoCropConfig.ts)
#### [NEW] [AutoCropLeftColumn.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/AutoCropLeftColumn.tsx)
#### [NEW] [AutoCropRightColumn.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/AutoCropRightColumn.tsx)
#### [MODIFY] [AutoCropModal.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/AutoCropModal.tsx)

---

### Storyboard Timeline Component Refactoring

#### [NEW] [TimelineEmptyState.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/TimelineEmptyState.tsx)
#### [NEW] [TimelineHeader.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/TimelineHeader.tsx)
#### [NEW] [TimelineBulkOps.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/TimelineBulkOps.tsx)
#### [NEW] [TimelineCard.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/crop/TimelineCard.tsx)
#### [MODIFY] [StoryboardTimeline.tsx](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/frontend/src/components/StoryboardTimeline.tsx)

---

### Python Backend Cleaning Service Refactoring

#### [NEW] [standard.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaners/standard.py)
#### [NEW] [shout.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaners/shout.py)
#### [NEW] [narration.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaners/narration.py)
#### [NEW] [borderless.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaners/borderless.py)
#### [NEW] [sfx.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaners/sfx.py)
#### [MODIFY] [cleaner.py](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/cleaner.py)

---

### Node Backend Scraper Service Refactoring

#### [NEW] [crawlers.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/scraper/crawlers.ts)
Extract Node fetch headers, regionalized fallbacks, reader selector tags, and regex matching filters.

#### [NEW] [storyboardAI.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/scraper/storyboardAI.ts)
Extract Gemini AI and HuggingFace chat storyboards prompts generator.

#### [MODIFY] [scraperService.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/services/scraperService.ts)
- Clean up file by routing functions to specialized crawlers and AI generators.

---

### Express Backend Image Routes Modularization (`imageRoutes.ts` Refactoring)

#### [NEW] [proxy.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/image/proxy.ts)
Extract `/proxy-image` referrer-bypass proxy route handler.

#### [NEW] [zip.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/image/zip.ts)
Extract ZIP compilation and download endpoint handlers (`/download-zip` and `/download-zip/get/:id`).

#### [NEW] [edit.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/image/edit.ts)
Extract crop, rotate, flip, and general properties modification routes (`/edit-image`, `/undo-crop`, `/transform-image`).

#### [NEW] [merge.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/image/merge.ts)
Extract canvas image stitching and caching routes (`/merge-images`, `/stitch-images`, `/merge-images/cached/:id`).

#### [NEW] [cleanup.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/image/cleanup.ts)
Extract OpenCV + EasyOCR speech bubble removal script execution route `/remove-speech-bubbles`.

#### [MODIFY] [imageRoutes.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/imageRoutes.ts)
- Clean up file by importing and mounting sub-routers/controllers.

---

### Express Backend AI Routes Modularization (`aiRoutes.ts` Refactoring)

#### [NEW] [crop.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/ai/crop.ts)
Extract `/ai-detect-panels` / `/detect-panels` / `/ai-smart-crop` handlers and the aspect ratio coordinate adjustment helper (`adjustToAspectRatio`).

#### [NEW] [analyze.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/ai/analyze.ts)
Extract panel image narrative subtitles and timeline timings analyser `/analyze-image`.

#### [NEW] [video.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/ai/video.ts)
Extract cinematic video timeline compiler route `/convert-images-to-video`.

#### [MODIFY] [aiRoutes.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/routes/aiRoutes.ts)
- Clean up file by mounting sub-routers.

---

## Verification Plan

### Manual Verification
- Compile and build frontend check (`npm run build` or equivalent tool verify).
- Run Node backend tests to verify that routing tables register `/api/proxy-image`, `/api/download-zip`, `/api/edit-image`, `/api/ai-smart-crop`, `/api/analyze-image`, etc. correctly.
- Test endpoint execution against sample payloads.
