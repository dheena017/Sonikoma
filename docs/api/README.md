# 🔌 API Documentation Index

Welcome to the Sonikoma API documentation. The API is modularized by domain to reflect the backend architecture.

## 📂 API Domains

- [🔐 Authentication](./auth.md) - User registration, login, and profile management.
- [🩺 System & Diagnostics](./system.md) - Health checks, metrics, and logs.
- [🎨 Image Processing](./image.md) - Editing, merging, and cleaning panels.
- [🤖 AI & Computer Vision](./ai.md) - Detection, analysis, and smart cropping.
- [🕸️ Scraper & Generation](./scraper.md) - Web crawling and storyboard generation.
- [🗣️ Audio & Video](./video.md) - TTS and video compilation.
- [📂 Projects](./projects.md) - CRUD operations for user projects.

---

## 📟 Architecture Overview

The Node.js backend serves as a gateway proxying to specialized Python modules (FastAPI) for resource-intensive tasks like image processing and AI analysis.

### 🐍 Python FastAPI Service

FastAPI runs on a child thread or separate worker (usually port **8000**) handling resource-intensive processes.

| Endpoint         | Method | Input Parameters         | Description                                                           |
| :--------------- | :----- | :----------------------- | :-------------------------------------------------------------------- |
| `/process`       | `POST` | `url`, `method`, `voice` | Full automated compilation: Scrape → OCR → TTS → video compilation.   |
| `/detect-panels` | `POST` | `image_path`             | OpenCV contour scanner returning detected panel bounding coordinates. |
