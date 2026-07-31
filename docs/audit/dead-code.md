# 💀 Dead Code Audit Report

## Executive Summary
This report identifies and catalogs unreferenced files, unused hooks, dead components, and obsolete endpoints across the Sonikoma repository.

Pruning dead code reduces bundle sizes, avoids confusion during development, and keeps the repository focused on active features.

---

## Unreferenced Production Files

An automated analysis of the repository identified the following files as having zero active references or imports:

### 1. `frontend/src/utils/supabase.ts`
- **File Type**: TypeScript Utility.
- **Description**: Configures a standalone Supabase client.
- **Why it is dead**: Database operations are strictly centralized on the backend (using a local SQLite instance managed by `db.py`), while media storage uploads utilize custom proxy endpoints. The frontend has no need to communicate with Supabase directly.
- **Severity**: **Low** (Adds 1KB of dead code to the frontend bundle).
- **Recommendation**: Safe to delete.

### 2. Standalone Diagnostic Scripts (`backend/python/scripts/*`)
* `backend/python/scripts/test_translate.py` (0 references)
* `backend/python/scripts/test_gemini.py` (0 references)
* `backend/python/scripts/list_models.py` (0 references)
* `backend/python/scripts/test_logging_db.py` (0 references)

- **File Type**: Python Script.
- **Why they are dead**: These are standalone utility and validation files used during development to verify model connectivity and logging. They are not referenced by the core application runtime.
- **Severity**: **Low** (Does not impact bundle size or runtime performance).
- **Recommendation**: Move these files to `scratch/` or maintain them under a unified `tests/` directory.

---

## Unused Hooks & Methods

### 1. `useSupabaseStorage` inside `frontend/src/hooks`
- **Problem**: Defines upload and fetch routines for Supabase buckets, but the frontend has moved to local proxy APIs.
- **Recommendation**: Delete once backend image proxies are fully verified.

### 2. Obsolete API Handlers in `frontend/src/api/`
* `fetchWithInterceptor` includes configurations for legacy `/player` (Theater Mode) routes which have been removed from the application layout.
- **Recommendation**: Refactor interceptor files to remove dead endpoint signatures.

---

## Deprecated & Unreachable Logic

### 1. Scraper URL Fallback Endpoints
* **Location**: `scraper_routes.py`
  - `/process-url` is explicitly documented as a `Legacy endpoint` with minor fallback checks.
- **Why it is dead**: The frontend utilizes the newer `/scrape-images` and `/scrape-episodes` endpoints.
- **Severity**: **Medium** (Unused endpoints increase API surface area unnecessarily).
- **Recommendation**: Safe to deprecate and delete.

### 2. Backward-Compatible Image Routing Aliases
* **Location**: `image_routes.py`
  - `/crop` (Backward-compatible alias for `/edit`)
  - `/undo-crop` (Backward-compatible alias for `/undo-edit`)
- **Why it is dead**: Legacy wrappers that redirect to updated edit endpoints.
- **Severity**: **Low**
- **Recommendation**: Keep these aliases to prevent breaking third-party or external client API integrations, or fully deprecate them in the next major API release.

---

## Circular Dependencies & Bundler Impacts

### 1. Image Editor State Synchronization
- **Issue**: State synchronization hooks in `useImageEditor.ts` must break circular dependencies by omitting parent states like `imageEditStates` from loading effects.
- **Impact**: While mitigated at runtime using ref guards (e.g., `activeImageUrlRef`), the circular dependency increases bundling complexity during production builds (`vite build`).
- **Recommendation**: Migrate image editor configurations to a unified Zustand state slice rather than synchronization loops.

---

## Summary of Safe Cleanup Actions

| File / Method | Path | Action | Estimated Effort |
| :--- | :--- | :--- | :--- |
| **Delete Supabase Utility** | `frontend/src/utils/supabase.ts` | Delete | 5 minutes |
| **Relocate Standalone Scripts** | `backend/python/scripts/*.py` | Move to `scratch/` | 10 minutes |
| **Deprecate Legacy Scraper Endpoint**| `/process-url` in `scraper_routes.py` | Delete | 30 minutes |
| **Prune Legacy Aliases** | `/crop` & `/undo-crop` in `image_routes.py` | Delete / Deprecate | 15 minutes |
