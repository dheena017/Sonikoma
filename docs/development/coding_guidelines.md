# 💻 Development Guidelines

This document details the code rules, constraints, and architecture guidelines required when writing or refactoring backend Node code, React components, and Python services.

---

## 🛠️ Backend Rules (Node.js Express)

### 1. Gemini API Usage
- **Never** call the Gemini API (`generateContent()`) directly. You **must** wrap it in the retry helper `callGeminiWithRetry()`.
- Use exponential back-off for error handling (specifically rate limit `429` and server failure `503`).
- Return a fallback response structured output if all retries fail. Never let the server crash or throw a 500 error.
- Default to `gemini-2.5-flash` unless specified otherwise.

### 2. Image Resolution
- Always resolve raw image URL requests using `resolveImageToBuffer(url)`.
- Never make standard `fetch()` or `axios()` requests directly on image endpoints inside routers.

### 3. In-Memory Image Cache
- Cached processed files are held in `stitchedCache` as a Map.
- Caching keys must follow: `stitched_<timestamp>_<descriptor>`.
- Register the cache path changes under `editHistory` so that frontend undo/redo features work seamlessly.

### 4. Executing Python Scripts
- Always invoke Python files via child process shell execution (`exec()`) using sanitized, allow-listed parameters.
- Target scripts under `backend/python/services/`.
- **Use `python3`** instead of `python` in execution commands (cross-platform compatibility).
- Write temporary file buffers to `os.tmpdir()`, and always clean up files (`unlink`) in a `finally` block.

### 5. Routing Segregation
- Do not accumulate routing rules in `server.ts`. Mount files modularly under `backend/routes/`.
- Segregate endpoints into domain folders: `/routes/ai/`, `/routes/image/`, and `/routes/scraper/`.

---

## 🎨 Frontend Rules (React / TypeScript)

### 1. Structure Placement
- Put JSX views under `frontend/src/components/`.
- Reusable hooks go in `frontend/src/hooks/`.
- Pure operations and formatting utilities go in `frontend/src/utils/`.
- Shared interfaces go in `frontend/src/types.ts`.

### 2. React Components
- Write functional components using `React.FC` or typed properties parameters.
- Limit component sizes to under **300 lines**. If files exceed this, split them into modular component files in subfolders.
- Do not put API fetch calls inside components; encapsulate them inside hooks or call functions.
- Add descriptive logging prefixes on mount: `console.log("[ComponentName] Mounted")`.

### 3. Stateful Hook Extraction
- Extract business state logic and API orchestrations into custom hooks.
- Large views like `App.tsx` should remain layouts with hook orchestrations.

### 4. Styling
- Use **Tailwind CSS** for layout adjustments.
- Do not use inline `style={{}}` declarations unless referencing dynamic runtime variables.
- Maintain a dark-mode-first aesthetic (dark backgrounds, bright labels, harmonious accent colors).

---

## 🐍 Python backend rules

### 1. Code Quality & Type Hints
- Always provide type annotations for parameters and return packages.
- Log failures using the Python `logging` module with the namespace format `webtoon_engine.services.<module_name>`.

### 2. CLI Execution Standards
- Python files designed for CLI shell execution (e.g. `cleaner.py`) must accept command arguments using `argparse`.
- Write exit statuses explicitly to stdout: `STATUS=SUCCESS` or `STATUS=ERROR`.
- Never print custom raw messages to stdout unless explicitly part of the integration API protocol. Use standard python logging instead.

### 3. Resilient Fallbacks
- Handle module import failures gracefully (e.g., if OpenCV or MoviePy are unavailable, fallback to standard library implementations such as Pillow).
- Never hardcode absolute directory paths; resolve relative directories via `os.path.join()`.
