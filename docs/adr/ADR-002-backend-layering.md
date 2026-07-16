# ADR-002: Backend Layering and Domain Separation

## Status
Proposed

## Context
The Sonikoma backend is written in FastAPI/Python. Currently, routes under `backend/routes/` often handle direct database queries, file system read/writes, AI service orchestration (e.g., calling Gemini/Edge-TTS), and business logic in single route handlers. This tightly coupled structure:
1. Impedes unit testing (requiring heavy, complex mocking of route frameworks).
2. Increases risk of duplicate business logic (e.g., proxy URL wrapping implemented in both `projects.py` and `ai_routes.py`).
3. Complicates exceptions handling and standard API responses.

## Decision
We enforce a strict **Three-Tier Backend Layering Pattern**:
1. **Controller Layer (API Routes):** Exposes FastAPI endpoints. Responsible only for validating request schemas (Pydantic), translating HTTP exceptions, and returning standardized JSON payloads.
2. **Service Layer (Domain Logic):** Fully isolated Python classes/modules implementing pure business logic (e.g., compilation math, OCR text extraction, narrative state machines). It is entirely agnostic of HTTP requests and works purely with Python primitives and data structures.
3. **Data Access Layer (Repository):** Handles all persistence mechanisms (SQLite via `db.py` or future PostgreSQL repositories) and file-system/storage interactions.

### Flow Diagram:
```text
HTTP Request ──> Controller (FastAPI Router) ──> Service (Pure Python Logic) ──> Repository (SQLite / Storage)
```

## Consequences
* **Pros:**
  - **Testability:** The service layer can be 100% unit tested without spinning up FastAPI TestClients or mocking network interfaces.
  - **Reusability:** CLI tools, cron scripts, or background workers can invoke services directly without mimicking HTTP contexts.
  - **Maintainability:** Clear isolation makes it trivial to replace or swap data stores or AI engine clients behind a clean interface.
* **Cons:**
  - **Boilerplate:** Small CRUD operations require traversing multiple files/layers (Router -> Service -> Repository).

## Alternatives Considered
* **Active Record / Fat Routers (Status Quo):** Keep mixing business logic and HTTP routing. Rejected due to declining maintainability and high probability of regression in core processing routes (e.g., panel segmentation, video compiling).
