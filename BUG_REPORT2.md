# 🕵️ Anivox Codebase Audit & Bug Report #2

**Date:** 2025-05-15
**Scope:** Frontend State Management, Data Persistence, AI Prompt Robustness, and Rule Compliance

---

## 1. 🖥️ Frontend State & UI Robustness (Critical)

| Issue | Description | Impact |
| :--- | :--- | :--- |
| **State Race Conditions** | `useAutoAnalysis.ts` triggers multiple concurrent `runBackgroundAnalysis` calls that all perform functional updates on the same `panels` state. | Can lead to **lost panel metadata** if updates overwrite each other due to closure staleness. |
| **Stuck Loading States** | Error handlers in `useBatchImageActions.ts` and `useCropEditorPipelines.ts` sometimes fail to reset `setIsCleaningBubbles(false)` or `setIsDetecting(false)` in specific catch blocks. | The UI can become **permanently "stuck"** in a loading state, requiring a page refresh. |
| **Zombie Request Logs** | The system logs engine in `useAppLogic.ts` sets up both SSE and Polling fallbacks, but the logic for switching between them can create **duplicate log entries** or redundant network traffic. | UI performance degradation and log clutter. |

---

## 2. 🐍 Python Pipeline Logic (Critical / Blocker)

| Issue | Description | Impact |
| :--- | :--- | :--- |
| **Missing OCR Function** | `backend/python/routes/process.py` imports and calls `extract_dialogue_from_panel`, but this function is **completely missing** from `backend/python/services/ocr.py`. | **The FastAPI pipeline is non-functional** (ImportError/AttributeError). |
| **Insecure Shell Calls** | `backend/routes/image/cleanup.ts` uses `exec()` with parameters that, while partially sanitized, still rely on string interpolation for complex objects like base64 masks. | **Potential for shell injection** or execution failure on large payloads. |
| **Hardcoded Hostnames** | `backend/utils/cvUtils.py` hardcodes `http://127.0.0.1:3000`. | Violates **Rule #9** and breaks detection if the frontend port changes or is served over HTTPS. |

---

## 3. 💾 Data Persistence & Logic (Medium)

| Issue | Description | Recommendation |
| :--- | :--- | :--- |
| **Incorrect Project Status** | `backend/routes/projects.ts` defaults all new projects to `status: "completed"`. | Projects should start as `pending` or `processing` to reflect reality. |
| **Unbounded DB Writes** | AI-generated `speech_text` and `visual_description` are written to SQLite without length validation. | Risk of **database bloat** or truncation errors if the AI generates extremely long responses. |
| **Missing Undo Sync** | The Python `PanelProcessor` maintains its own `undo_stack`, but the Node server uses `editHistory` in a different way. | **Conflicting Undo logic** makes the editing experience unpredictable. |

---

## 4. 🤖 AI & Scraper Fragility (Medium)

| Issue | Description | Risk |
| :--- | :--- | :--- |
| **Brittle JSON Cleaning** | `storyboardAI.ts` uses `.replace(/```json/g, '')` regex to parse AI output. | If the AI response is slightly different or contains the string "```json" inside the text, **JSON parsing will fail**. |
| **HF Path Inconsistency** | The HuggingFace path in `storyboardAI.ts` lacks the retry logic and structured error handling present in the Gemini path. | **Silent failures** when HF inference providers are overloaded. |
| **Fallback Count Mismatch** | The programmatic fallback in `generate.ts` returns exactly 5 panels, regardless of how many images were actually scraped. | Can lead to **broken or missing frames** in the final storyboard. |

---

## 📏 Remaining Rule Violations (Maintainability)

| Rule Violation | Location | Description |
| :--- | :--- | :--- |
| **Rule #10 (Strict Typing)** | `storyboardAI.ts`, `projects.ts` | Excessive use of `: any` and `any[]` instead of defined interfaces. |
| **Rule #12 (Logic Location)** | `AppWorkspace.tsx` (inferred) | Some components still contain logic that should be moved to hooks. |
| **Rule #4 (Python Version)** | `backend/routes/image/cleanup.ts` | Uses `process.platform` check for `python` vs `python3` instead of a unified helper. |

---

## ✅ Recommended Immediate Actions
1. **Implement OCR:** Add the `extract_dialogue_from_panel` implementation to `ocr.py`.
2. **Secure Shells:** Move from string interpolation to an arguments array or use a temporary JSON config file for Python CLI calls.
3. **Sequence State:** Use functional state updates `(prev => ...)` exclusively in hooks to prevent race conditions during batch AI analysis.
4. **Standardize Status:** Fix the project creation status default in the database routes.
