# image-editor/canvas/api

Image editing and smart crop API endpoints.

## Files

| File | Purpose |
|------|---------|
| `image.ts` | submitImageEdits, mergeImages, removeSpeechBubbles, transformImage, processLayers, YOLO training |
| `crop.ts` | detectPanelCropType, cropLongPanels, cropSmallPanels, DetectTypeResponse, CroppedSliceItem |

## Usage

```ts
import { submitImageEdits, mergeImages } from "@/features/image-editor/canvas/api/image";
import { cropLongPanels }               from "@/features/image-editor/canvas/api/crop";
```
