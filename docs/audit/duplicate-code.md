# 👥 Duplicate Code Audit Report

## Executive Summary
This report analyzes and catalogs occurrences of duplicated code, overlapping utilities, cloned file systems, and redundant component structures across the Sonikoma repository.

Identifying and removing duplicate logic is key to minimizing technical debt, preserving API contracts, and ensuring that future bug fixes apply globally rather than leaving "shadow" components un-patched.

---

## Duplicate Files (Identical Content Hashes)

An automated cryptographic hash scan (MD5/SHA) of all non-binary and non-library files identified the following duplicate sets:

### 1. Root-Level Initialization Files (Duplicate Set 1)
The following files are 100% identical and serve only to mark folders as Python modules:
* `backend/__init__.py`
* `backend/python/__init__.py`
* `backend/python/media/__init__.py`
* `backend/python/media/image/__init__.py`
* `backend/python/media/video/__init__.py`
* `backend/python/media/ai/__init__.py`
* `backend/python/media/audio/__init__.py`

- **Severity**: **Low** (Harmless; required by Python 3.x namespace scanning).
- **Recommendation**: Keep as-is.

### 2. Frontend Branding Assets (Duplicate Set 2)
The following files are structurally identical:
* `frontend/public/logo.png`
* `frontend/public/logo-dark.png`

- **Severity**: **Low** (Wastes 15KB of static resource cache).
- **Recommendation**: Delete the redundant file or provide unique assets if dark-mode branding is required.

---

## Overlapping Utility Implementations

Several utility files in both the frontend and backend have overlapping or duplicate responsibilities:

### 1. Database Schema Definitions
* `backend/database/schema.sql` (Relational SQLite schema setup)
* `backend/database/schema_postgres.sql` (PostgreSQL setup)

- **Problem**: Table definitions, default values, and index configurations are duplicated across two SQL dialects. Changes (such as adding narrative tracking columns) must be manually ported to both files.
- **Severity**: **Medium**
- **Recommendation**: Maintain a single source of truth for the database schema, or implement automated migration tools (such as Alembic) that support multi-dialect compilations.

### 2. Crop Editor Routing & Redirections
* `frontend/src/hooks/useAppRouter.ts` (Dynamic router parsing)
* `frontend/src/utils/workspaceNavigation.ts` (Workspace redirect mappings)

- **Problem**: Both files parse URL parameters (`idx`, `project_id`, `series`, `chapter`) to determine active workspace editor routes. This leads to duplicate route-mapping logic.
- **Severity**: **Medium**
- **Recommendation**: Centralize route mapping inside `workspaceNavigation.ts` and import those methods inside `useAppRouter.ts`.

---

## Duplicate Logic & Cloned Code Patterns

### 1. Image Path Validations and Temporary File Unlinking
* **Location**: Found in `image_routes.py`, `panels.py`, `ocr.py`, and `cleaner.py`.
* **Issue**: The same nested `try...except...finally` block for creating, reading, and unlinking temporary files is written inline multiple times.
```python
# Duplicated pattern:
image_path = None
try:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        ...
finally:
    if image_path and os.path.exists(image_path):
        os.remove(image_path)
```
- **Severity**: **Medium**
- **Recommendation**: Create a centralized context manager utility inside `backend/python/utils/image_utils.py` (e.g., `@contextmanager def temp_image_file()`) to handle temporary image lifecycles elegantly.

### 2. Video Settings Initializations
* **Location**: `backend/python/routes/video.py`
* **Issue**: The default configurations for background-music layers, frame rates, subtitles, and widescreen letterbox bars are initialized inline in both `/render` and legacy composition endpoints.
- **Severity**: **Low**
- **Recommendation**: Isolate a default configuration model (e.g., `DefaultVideoConfig` schema class) inside `backend/python/config/` to share across endpoints.

---

## Summary of Refactoring Impact

| Refactoring Target | Why it is duplicated | Risk of Refactoring | Estimated Effort |
| :--- | :--- | :--- | :--- |
| **Unified Database Schema** | Dual SQL setups (SQLite/Postgres). | Minor; ensure migrations are run correctly. | 4 hours |
| **Context Manager for Temp Files**| Standardize `finally` blocks for file cleanup. | Low; reduces potential storage leak risk. | 2 hours |
| **Workspace Navigation Helper** | Shared url parsing in routers. | Medium; verify and run Playwright tests. | 3 hours |
