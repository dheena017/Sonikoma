# 🕵️ Anivox Codebase Audit & Bug Report

**Date:** 2025-05-15
**Scope:** Storyboard AI Pipeline, Video Compilation, Architectural Integrity

---

## 1. 🚀 Pipeline Stability (Critical / Blocker)

| Issue | Description | Impact |
| :--- | :--- | :--- |
| **Broken Python Path** | `backend/routes/image/cleanup.ts` calls `backend/services/cleaner.py`, but the file actually lives in `backend/python/services/cleaner.py`. | **Speech bubble removal is 100% broken** (File Not Found). |
| **API Route Mismatch** | Express defines `/api/remove-speech-bubbles` (plural), but `useBatchImageActions.ts` and `useCropEditorPipelines.ts` call `/api/remove-speech-bubble` (singular). | **Frontend cleaning actions fail** with 404. |
| **"Dead End" Video Route** | `/api/convert-images-to-video` (Express) is a mock that only returns a static background URL. It never calls the actual `video.py` compiler. | **Video compilation is not actually functional** in the main app flow. |
| **Silent Detection Failures** | `detect_panels.py` and `cvUtils.py` return 3 "equidistant" panels when CV detection fails instead of reporting an error. | **Masks pipeline failures** and results in poor AI storyboard quality. |
| **Memory Cache Eviction** | `mergedCache` (in-memory) has a short 30-min TTL. If a user spends >30m in the editor, image URLs will 404. | **User data loss** during long editing sessions. |

---

## 2. 🏛️ Architectural Redundancy (Medium)

| Issue | Description | Recommendation |
| :--- | :--- | :--- |
| **Orphaned FastAPI Router** | `backend/python/routes/process.py` is a fully defined FastAPI pipeline that is **never started** or called by the Node server. | **High Technical Debt.** Either integrate FastAPI as a sidecar or port its logic (OCR/TTS integration) to Express. |
| **Duplicate Logic** | Scraper and Panel detection logic exist in both Node (`scraperService.ts`) and Python (`process.py`). | Consolidate core logic into the Python Engine and keep Node as the API Gateway. |
| **Project ID Collision** | Multiple routes generate `project_id` or `uniqueId` using different formats (`video_${Date.now()}`, `proj_${uuid}`, etc.). | Standardize on a single project identification strategy. |

---

## 3. 📦 Dependency Integrity (Medium)

| Issue | Description | Risk |
| :--- | :--- | :--- |
| **ffmpeg Dependency** | `pydub` and `moviepy` require `ffmpeg` installed on the system path. It was missing in the sandbox. | **Video/Audio rendering will crash** on new deployments if not pre-installed. |
| **Heavy ML Imports** | `easyocr` and `pytorch` are imported in the main flow but are very large (~2GB) and CPU intensive. | Can cause **request timeouts** (408) on first-run model downloads or under-powered servers. |
| **Permission Drift** | HuggingFace logic in `storyboardAI.ts` uses Mistral 7B which often requires specific inference permissions/tokens. | Fallbacks to Gemini work, but HF path is unreliable without clear user feedback. |

---

## 4. 📏 Code Governance (Maintainability / Debt)

| Rule Violation | Location | Description |
| :--- | :--- | :--- |
| **Rule #3 Violation** | `backend/utils/cache.ts` | `RULES.md` mandates `stitchedCache`, but the code uses `mergedCache`. |
| **Hook Complexity** | `useCropEditorPipelines.ts` | Violates "one responsibility" rule; handles transforms, merges, cleaning, and detection. |
| **Pathing Inconsistency** | `backend/utils/cvUtils.py` | Python code placed in a Node-dominated `utils/` folder instead of `backend/python/services/`. |
| **Direct fetch() usage** | `backend/utils/imageUtils.ts` | Uses global `fetch()` instead of a controlled client, though it does include Referer spoofing. |

---

## ✅ Recommended Immediate Actions
1. **Fix Paths:** Correct the Python script path in `cleanup.ts`.
2. **Align Routes:** Sync the pluralization of the speech bubble removal endpoint.
3. **Bridge the Gap:** Update the Express `/api/convert-images-to-video` route to actually execute `video.py`.
4. **Error Handling:** Replace "equidistant fallbacks" with a "No panels detected" signal so the frontend can trigger the AI fallback properly.
