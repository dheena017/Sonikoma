# 🔌 API Reference & Architecture

All API endpoints are split by domain: authentication, health/metrics, image processing, AI pipelines, and scraping. The Node backend serves as a gateway proxying to the Python modules.

---

## 📟 Node.js Express API Router

The Express.js backend listens on **port 5173** (development) and routes requests through mounted sub-routers.

### 🔐 Authentication Router
Mounted under `/api/auth/`

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | `username`, `password`, `email` | Registers a new user account. |
| `/api/auth/login` | `POST` | `username`, `password` | Logs in a user, returning a JWT token. |
| `/api/auth/google` | `POST` | `token` (Google ID token) | Handles federated Google Authentication. |
| `/api/auth/forgot-password` | `POST` | `email` | Initiates the account recovery flow (mocked). |
| `/api/auth/me` | `GET` | *Header Authorization Token* | Returns the currently logged-in user profile. |

---

### 🩺 System Diagnostics & Logging
Mounted under `/api/`

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | None | Liveness check; validates SQLite connection. |
| `/api/metrics` | `GET` | None | Reports live server uptime, RSS memory, request stats, rate-limits, and image caches. |
| `/api/system-logs` | `GET` | `limit` (optional) | Retrieval fallback for backend logs. |
| `/api/system-logs/stream` | `GET` | None | Pushes real-time, ANSI-colored log updates to UI via Server-Sent Events (SSE). |

---

### 🎨 Image Processing Router
Mounted under `/api/` (proxies Sharp and OpenCV backend scripts)

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/proxy-image` | `GET` | `url` (Webtoon source image) | Proxies external images to bypass Referer headers and CORS blocks. |
| `/api/edit-image` | `POST` | `imageUrl`, `actions` (crop, rotate, flip) | Edits an image frame and caches the buffer. |
| `/api/merge-images` | `POST` | `imageUrls`, `direction` (h/v), `gap` | Combines multiple panels into a stitched image. |
| `/api/remove-speech-bubbles` | `POST` | `imageUrl`, `method`, `sensitivity`, `dilation` | Cleans dialog bubbles via Python OpenCV inpainting. |
| `/api/download-zip` | `POST` | `imageUrls`, `projectName` | Compresses panel frames into a ZIP buffer. |
| `/api/download-zip/get/:id` | `GET` | `:id` (temporary UUID) | Downloads the generated ZIP file. |

---

### 🤖 AI Processing Router
Mounted under `/api/` (calls Gemini and HF models)

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/analyze-image` | `POST` | `imageUrl`, `model` | Performs Gemini Vision panel classification (caption, motion, timing). |
| `/api/generate-speech-text` | `POST` | `imageUrl` | Extracts text dialogue from comic panels. |
| `/api/ai-detect-panels` | `POST` | `imageUrl` | Detects coordinate boundaries using Gemini. |
| `/api/ai-smart-crop` | `POST` | `imageUrl`, `boundingBox` | Automatically crops selected regions. |

---

### 🗣️ Audio & Video Compilation
Mounted under `/api/`

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/convert-images-to-video` | `POST` | `panels` (array of frames), `fps` | Runs MoviePy compiler to compile cinematic MP4. |
| `/api/generate-tts` | `POST` | `text`, `voice` | Generates speech narration audio using Edge-TTS. |

---

### 🕸️ Scraper Router
Mounted under `/api/`

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/scrape-images` | `POST` | `url` (Webtoon series episode) | Webtoon crawler script downloading comic images. |
| `/api/generate` | `POST` | `panels` | Generates AI storyboards from raw images. |
| `/api/detect-panels` | `POST` | `imageUrl` | Contour-based OpenCV panel boundaries extraction. |

---

### 📂 Projects DB CRUD
Mounted under `/api/projects/`

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/projects` | `GET` | None | Lists all saved projects inside SQLite. |
| `/api/projects` | `POST` | `name`, `url` | Saves a new project container. |
| `/api/projects/:id` | `GET` | `:id` | Retrieves single project with associated panels. |
| `/api/projects/:id` | `DELETE` | `:id` | Deletes a project and its corresponding SQLite records. |
| `/api/projects/:id/panels` | `POST` | `:id`, `panels` | Saves list of updated panels mapping to the project. |

---

## 🐍 Python FastAPI Service Router

FastAPI runs on a child thread or separate worker (usually port **8000**) handling resource-intensive processes.

| Endpoint | Method | Input Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/process` | `POST` | `url`, `method`, `voice` | Full automated compilation: Scrape → OCR → TTS → video compilation. |
| `/detect-panels` | `POST` | `image_path` | OpenCV contour scanner returning detected panel bounding coordinates. |
