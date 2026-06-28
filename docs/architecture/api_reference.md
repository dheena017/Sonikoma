# 🔌 API Reference & Architecture

The Sonikoma API is organized into several domain-specific modules. Please refer to the [API Documentation Index](../api/README.md) for detailed endpoint references.

---

## 📟 Architecture Overview

All API endpoints are split by domain: authentication, health/metrics, image processing, AI pipelines, and scraping. The Node backend serves as a gateway proxying to the Python modules.

The Express.js backend listens on **port 5173** (development) and routes requests through mounted sub-routers.

### 🐍 Python FastAPI Service Router

FastAPI runs on a child thread or separate worker (usually port **8000**) handling resource-intensive processes.

| Endpoint         | Method | Input Parameters         | Description                                                           |
| :--------------- | :----- | :----------------------- | :-------------------------------------------------------------------- |
| `/process`       | `POST` | `url`, `method`, `voice` | Full automated compilation: Scrape → OCR → TTS → video compilation.   |
| `/detect-panels` | `POST` | `image_path`             | OpenCV contour scanner returning detected panel bounding coordinates. |
