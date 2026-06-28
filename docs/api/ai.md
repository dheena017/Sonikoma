# 🤖 AI & Computer Vision API

Endpoints for panel detection, image analysis, and smart cropping.

| Endpoint                    | Method | Input Parameters          | Description                                                            |
| :-------------------------- | :----- | :------------------------ | :--------------------------------------------------------------------- |
| `/api/analyze-image`        | `POST` | `imageUrl`, `model`       | Performs Gemini Vision panel classification (caption, motion, timing). |
| `/api/generate-speech-text` | `POST` | `imageUrl`                | Extracts text dialogue from comic panels.                              |
| `/api/ai-detect-panels`     | `POST` | `imageUrl`                | Detects coordinate boundaries using Gemini.                            |
| `/api/ai-smart-crop`        | `POST` | `imageUrl`, `boundingBox` | Automatically crops selected regions.                                  |
| `/api/detect-panels`        | `POST` | `imageUrl`                | Contour-based OpenCV panel boundaries extraction.                      |
