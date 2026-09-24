# 🤖 AI & Computer Vision API

Endpoints for panel detection, image analysis, and smart cropping.

| Endpoint                    | Method | Input Parameters          | Description                                                            |
| :-------------------------- | :----- | :------------------------ | :--------------------------------------------------------------------- |
| `/api/v1/ai/analyze-image`        | `POST` | `imageUrl`, `model`       | Performs Gemini Vision panel classification (caption, motion, timing). |
| `/api/v1/ai/generate-speech-text` | `POST` | `imageUrl`                | Extracts text dialogue from comic panels.                              |
| `/api/v1/ai/detect-panels`     | `POST` | `imageUrl`                | Detects coordinate boundaries using Gemini.                            |
| `/api/v1/ai/smart-crop`        | `POST` | `imageUrl`, `boundingBox` | Automatically crops selected regions.                                  |
| `/api/v1/ai/detect-panels`        | `POST` | `imageUrl`                | Contour-based OpenCV panel boundaries extraction.                      |
