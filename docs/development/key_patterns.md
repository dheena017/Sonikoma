# 🧩 Key Codebase Patterns

This document details the standard coding patterns used throughout the Anivox codebase. Always reuse these patterns when adding new features or components.

---

## 1. Image Cache Pattern (Node.js)

Stores temporary stitched or processed images in memory, reducing disk reads.

```typescript
// Store processed image buffer in backend memory
const uniqueId = `stitched_${Date.now()}_<descriptor>`;
const newUrl = `/api/stitch-images/cached/${uniqueId}`;

stitchedCache.set(uniqueId, { 
  data: buffer, 
  contentType: "image/png" 
});

// Always register updates in editHistory for frontend undo/redo support
editHistory.set(newUrl, originalUrl); 

return res.json({ 
  success: true, 
  url: newUrl 
});
```

---

## 2. Gemini API Retry Pattern

Guards against rate-limiting (429) and server errors (503) when calling Google Generative AI.

```typescript
import { callGeminiWithRetry } from "../utils/aiUtils.js";

const result = await callGeminiWithRetry(
  () => ai.models.generateContent({ 
    model: "gemini-2.5-flash", 
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  }),
  4,    // Maximum retries
  1500  // Initial back-off delay in ms
);
```

---

## 3. Python Shell Execution Pattern

Safely calls Python modules from Node backend with argument validation.

```typescript
import { exec } from "child_process";
import os from "os";
import path from "path";

const tempIn = path.join(os.tmpdir(), `in_${Date.now()}.png`);
const tempOut = path.join(os.tmpdir(), `out_${Date.now()}.png`);

// Parameter sanitation
const allowedMethods = ["inpaint", "blur", "solid_white"];
const activeMethod = allowedMethods.includes(method) ? method : "inpaint";

const pythonCommand = `python3 backend/python/services/cleaner.py --image_path "${tempIn}" --output_path "${tempOut}" --method "${activeMethod}"`;

exec(pythonCommand, (error, stdout, stderr) => {
  if (error) {
    console.error("[Shell Call] Error:", error);
    // Cleanup and throw structured error response
  } else {
    // Read processed buffer from tempOut, write to memory cache, and return
  }
});
```

---

## 4. Standardized Console Logging Pattern

All logs in the codebase must follow the standard structure:
`HH:MM:SS [CATEGORY] [LEVEL] [filename] message`

- **Timestamp**: `HH:MM:SS` format (handled by interceptors).
- **Category**: `[BACKEND]` or `[FRONTEND]`.
- **Log Level**: `[INFO]`, `[DEBUG]`, `[WARN]`, `[ERROR]`, `[SUCCESS]`, `[DATABASE]`, `[AI]`, `[API]`, etc.
- **Filename**: Source code file containing the log call (e.g. `db.py`, `useAppState.ts`).
- **Message**: Details of the logged event.

### Python Backend Logger Pattern

In Python services and routes, use modular namespace loggers. The logging middleware will automatically translate these calls into the standard layout:
```python
import logging
logger = logging.getLogger("anivox.routes.my_feature")

# Standard Info Log (outputs: HH:MM:SS [BACKEND] [INFO] [file.py] Message)
logger.info("Initializing relational database cache")

# Warning Log
logger.warning("Optional HuggingFace key not set - disabling voice models")

# Error Log
logger.error("Stitching process failed due to corrupt asset", exc_info=True)
```

### Frontend console.log Pattern

In React components and custom hooks, the global console interceptor automatically formats log statements. Developers should include context in brackets to set the source file:
```typescript
// Standard Info Log (outputs: HH:MM:SS [FRONTEND] [INFO] [useCropEditor.ts] Opening crop editor canvas)
console.log("[useCropEditor] Opening crop editor canvas");

// Warning Log
console.warn("[useBackendHealth] Backend unreachable - retrying connection");

// Error Log
console.error("[useVideoGeneration] [ERROR] Compilation failed", err);
```

---

## 5. Modular Route Mapping Pattern

Mounts modular routers inside domain files to avoid loading rules in `server.ts`.

```typescript
// backend/routes/imageRoutes.ts
import express from "express";
import editRouter from "./image/edit.js";
import mergeRouter from "./image/merge.js";
import cleanupRouter from "./image/cleanup.js";

const router = express.Router();

// Mount children sub-routers
router.use(editRouter);
router.use(mergeRouter);
router.use(cleanupRouter);

export default router;
```

---

## 6. Custom React Hook Extraction

Separates visual rendering layout files from active React business hooks.

```typescript
// frontend/src/hooks/useSingleImageEdits.ts
import { useState, useCallback } from "react";
import { GeneratedPanel } from "../types.js";

export function useSingleImageEdits(panel: GeneratedPanel, onUpdate: (p: GeneratedPanel) => void) {
  const [isEditing, setIsEditing] = useState(false);

  const handleRotate = useCallback(async (angle: number) => {
    // API edit-image request...
    onUpdate(updatedPanel);
  }, [panel, onUpdate]);

  return { 
    isEditing, 
    handleRotate 
  };
}
```

---

## 7. Webtoon URL Parsing

Applies region stripping helpers to avoid parsing errors from localized path prefixes.

```typescript
import { stripRegionFromUrl, parseWebtoonUrl } from "../utils/urlUtils.js";

const cleanUrl = stripRegionFromUrl(url); // strips /en/, /fr/, /ko/ locale paths
const { title, episode } = parseWebtoonUrl(cleanUrl);
```
