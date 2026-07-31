# Sonikoma Coding Standards & Best Practices

This document establishes the repository-wide engineering standards and architectural conventions for both frontend and backend systems in Sonikoma. Adhering to these standards ensures high code quality, consistency, maintainability, and error resilience.

---

## 🎨 1. UI, Styling & Aesthetics Standards

- **Theme & Palette Consistency:** The UI must maintain a clean, high-polish dark aesthetic. Avoid heavy gradients or sharp, high-contrast borders.
  - Borders should utilize subtle, soft opacities (e.g., `border-white/5` or `border-neutral-800`).
  - Container backgrounds must favor semi-transparent dark tones (e.g., `bg-neutral-900/40` or glassmorphic `backdrop-blur-md`).
  - Text elements must utilize soft, neutral colors (e.g., `text-neutral-300`, `text-neutral-400`). Highlighting must be restricted to minimal accent colors.
- **Responsive Layout Integrity:** Interactive workspaces (such as the main Canvas workspace or Timeline panels) must be responsive. Use aspect-locked containers monitored via `ResizeObserver` and responsive tailwind classes to prevent element overflow or layout drift across varying browser dimensions.
- **Scrollbars:** Custom panels or sidebars that contain overflow text must leverage custom scrollbar styles (e.g., `scrollbar-thin scrollbar-thumb-neutral-800`) to prevent jarring visual browser scrollbars from breaking card and grid layouts.

---

## 🏗️ 2. Frontend Conventions (React & TypeScript)

### Naming Conventions
- **Components:** PascalCase (e.g., `CinemaPlayer.tsx`, `TimelineCard.tsx`).
- **Hooks:** camelCase prefixed with `use` (e.g., `usePlaybackEngine.ts`, `useImageEditor.ts`).
- **Utilities & Services:** camelCase (e.g., `youtubePublisherService.ts`, `imageUtils.ts`).
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_BUBBLE_DILATION = 5`).

### Directory & Import Conventions
- **Feature-First Organization:** Components must be organized into features where appropriate. Global shared UI elements belong in `/components/`.
- **Import Ordering:** Maintain consistent import blocks to improve readability:
  1. React core hooks and libraries.
  2. Third-party packages (e.g., `framer-motion`, `lucide-react`).
  3. Shared Types/Schemas.
  4. Global / local hooks.
  5. Global / local components.
  6. CSS or assets.
- **TypeScript Guidelines:**
  - Avoid using `any`. Use strict, explicit typing or `unknown`/`generic` parameters.
  - Prefer interfaces over types for public API declarations and database models to support extending properties easily.
  - Break down circular state dependencies to avoid infinite re-render loops (e.g., decouple state updates inside hooks by using `useRef` to track active indices/parameters).

---

## 🐍 3. Backend Conventions (Python & FastAPI)

### Coding & File Style
- Follow PEP 8 guidelines.
- Use explicit type hints for all function parameters and return values (e.g., `def run_inpainting(image_path: str, radius: int) -> str:`).
- Always use platform-agnostic file path manipulation utilities (`os.path.join`, `Path` objects) instead of hardcoding slash dividers to guarantee cross-compatibility between Unix and Windows runtimes.

### Resource & Exception Safety
- **Uploads and Temporary Files:** Routes handling file uploads or temporary operations must write files inside nested `try...finally` blocks. This ensures all temporary disk artifacts are deleted on successful resolution OR exceptions, completely preventing server storage leak accumulation.
- **Concurrency & Resource Recovery:** For CPU/VRAM intensive tasks (such as batch YOLO detections, EasyOCR pipelines, or MoviePy composite compilation loops), explicitly trigger python garbage collection (`gc.collect()`) and release PyTorch CUDA caches (`torch.cuda.empty_cache()`) immediately upon task termination to protect system stability.
- **SSE Connection Lifecycles:** Real-time log/event streaming endpoints must catch `asyncio.CancelledError` and `GeneratorExit` exceptions. This ensures that custom SSE log listeners and underlying network resources are cleanly disposed of and unregistered when a client disconnects.

---

## 🔌 4. API & Communication Standards

- **Status Code Standard:**
  - `200 OK` / `201 Created` for successful mutations or queries.
  - `400 Bad Request` for validation failures (such as invalid panel coordinates).
  - `401 Unauthorized` for missing/expired session auth tokens.
  - `429 Too Many Requests` when a user exceeds the rate limiter limit.
  - `500 Internal Server Error` should be reserved for unexpected, unhandled exceptions.
- **Graceful Failure Fallbacks:** Backend endpoints must fail gracefully. For example, if an AI panel separation step fails, the backend must catch the error, write a transparent fallback image, log the warning, and return a clean success payload containing a non-blocking `warnings` list. Avoid throwing generic 500 crashes to protect user workflows.
- **JSON Contracts:** All API payloads must adhere to camelCase JSON naming conventions. All lists must be wrapped in structured objects.

---

## 🧪 5. Testing & Documentation Guidelines

- **Practice Proactive Testing:** Do not write code without accompanying verification plans.
- **Coverage Goals:** Standard utility modules and helper services must aim for >80% code coverage.
- **Commit Constraints:** Before submitting, run TypeScript validation check (`npm run typecheck`) and the production compilation check (`npm run build`). No commits with compilation or typing errors are permitted.
- **Documentation Expectations:** Keep documentation alive. When modifying system architectures, update relevant schema files or the high-level architecture maps.
