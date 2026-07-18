# Developer Guide

Welcome to the Sonikoma developer guide. This document outlines the local setup, workflows, and coding standards for contributing to the repository.

## 1. Project Structure

The repository is divided into two main components:
- **`frontend/`**: The React 19 application built with Vite and Tailwind CSS.
- **`backend/app/`**: The Python FastAPI server, organized using a Layered Architecture (API, Service, Repository, Provider, Engine).
- **`data/`**: Ignored by git, this directory holds the local SQLite database (`webtoon_local.db`) and all persistent media, caches, and training data.

## 2. Local Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- FFmpeg (must be available in your system's PATH)

### Installation
1. Clone the repository and install Node dependencies:
   ```
   npm install
   ```
2. Install Python dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

### Environment Variables
Copy `.env.example` to `.env` in the root directory. You must configure at least:
- `GEMINI_API_KEY`: Required for AI narrative generation and vision tasks.
- `FRONTEND_PORT` (e.g., 3000)
- `BACKEND_PORT` (e.g., 8000)
- `APP_URL` (e.g., http://localhost:3000)
- `JWT_SECRET_KEY`: A secure random string for authentication.

## 3. Running the Application

To start both the Vite dev server and the Python FastAPI backend concurrently, run:
```
npm run start
```
The script `scripts/run-backend.js` automatically manages the Python subprocess and restarts it when file changes are detected in `backend/app/`.

## 4. Testing

### Backend Tests
The backend test suite is written using `pytest`. Before running tests, ensure your `PYTHONPATH` is set correctly to resolve absolute imports. This is typically handled by `backend/pytest.ini`, but you can run them manually:
```
export PYTHONPATH=backend/app
python -m pytest backend/tests/
```

## 5. Coding Standards

- **Python**: Follow PEP 8 guidelines. Use type hints extensively. Keep business logic out of API routers.
- **React**: Use functional components and hooks. Group files by feature (Feature-First Architecture).
- **Documentation**: Ensure all new public modules, classes, and complex functions have descriptive docstrings.

See `docs/coding-standards.md` for a comprehensive list of rules.
