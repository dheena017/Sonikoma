# API Endpoints Documentation

This document describes the primary REST endpoints available in the Sonikoma FastAPI backend. All endpoints are prefixed with `/api/v1` (unless otherwise noted).

## Authentication

### `POST /api/v1/auth/login`
- **Purpose**: Authenticates a user and returns a JWT.
- **Auth Required**: No.
- **Request Body**: JSON containing `username` and `password`.
- **Response**: `{ "access_token": "string", "token_type": "bearer" }`
- **Errors**: `401 Unauthorized` for invalid credentials.

## Health & Metrics

### `GET /api/health`
- **Purpose**: Returns the system health, memory usage, and database connection state.
- **Auth Required**: No.
- **Response**: JSON detailing system metrics (e.g., `{ "status": "healthy", "memory": {...} }`).

## Projects

### `GET /api/v1/projects`
- **Purpose**: Retrieves a list of all projects.
- **Auth Required**: Yes (Bearer Token).
- **Response**: Array of project objects.

### `GET /api/v1/projects/{project_id}`
- **Purpose**: Retrieves details for a specific project.
- **Auth Required**: Yes (Bearer Token).
- **Response**: Project object including its associated chapters and panels.
- **Errors**: `404 Not Found` if project does not exist.

## Scraper

### `POST /api/v1/scraper/scrape`
- **Purpose**: Scrapes a Webtoon/Manhwa URL to extract image panels.
- **Auth Required**: Yes (Bearer Token).
- **Request Body**: JSON containing `url` to scrape.
- **Response**: Array of scraped image URLs or cache references.

## AI Narrative & Processing

### `POST /api/v1/ai/analyze-sequence`
- **Purpose**: Analyzes a sequence of panels to generate narrative text, dialogue, and sound effects using Gemini.
- **Auth Required**: Yes (Bearer Token).
- **Request Body**: JSON containing array of panel data (images/metadata).
- **Response**: Narrative script data mapped to panels.

## Video Compilation

### `POST /api/v1/video/compile`
- **Purpose**: Triggers the MoviePy/FFmpeg pipeline to compile the project's panels into a final MP4 video.
- **Auth Required**: Yes (Bearer Token).
- **Request Body**: JSON containing `project_id`.
- **Response**: Job ID or status, and eventually the path to the compiled MP4.

## Export & Publishing

### `POST /api/v1/export/youtube`
- **Purpose**: Publishes the compiled video directly to a linked YouTube channel.
- **Auth Required**: Yes (Bearer Token) & OAuth credentials configured.
- **Request Body**: JSON containing `project_id`, `title`, `description`, `tags`.
- **Response**: YouTube video URL and upload status.

---

*Note: This is a high-level summary. The actual FastAPI implementation may expose additional query parameters or granular error codes. For full dynamic documentation, refer to the `/docs` (Swagger UI) endpoint when the backend is running.*
