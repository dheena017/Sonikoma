# 🔑 Environment Variables Configuration

All configuration variables are defined in the workspace `.env` file (copied from `.env.example`). The server reads these variables at boot to configure API keys, port allocations, limits, and operational modes.

> [!WARNING] > **Never commit `.env` or `.env.local` to version control.** These files contain sensitive production credentials and API keys.

---

## 📋 Configurable Settings

| Variable Name             | Required | Default Value | Description                                                                                  |
| :------------------------ | :------: | :------------ | :------------------------------------------------------------------------------------------- |
| **`GEMINI_API_KEY`**      |  ✅ Yes  | None          | Google AI Studio API key. Essential for vision panel detection, image descriptions, and OCR. |
| **`HUGGINGFACE_API_KEY`** | Optional | None          | API token for fallback open-source translation/detection models.                             |
| **`BACKEND_PORT`**        |  ✅ Yes  | None          | Port the unified FastAPI backend runs on (e.g. `5173`). Secondary fallback is `PORT` (for PaaS environments). |
| **`FRONTEND_PORT`**       |  ✅ Yes  | None          | Port the React/Vite development server runs on (e.g. `3000`).                                |
| **`APP_URL`**             |  ✅ Yes  | None          | Public URL of the React/Vite development server (e.g. `http://localhost:3000`).              |
| **`NODE_ENV`**            | Optional | `development` | Deployment environment state: `development` or `production`.                                 |
| **`SLOW_REQ_MS`**         | Optional | `3000`        | Alert threshold (in ms) before requests are flagged as slow logs.                            |
| **`RATE_LIMIT_RPM`**      | Optional | `120`         | Maximum request allocation count per minute per IP address.                                  |
| **`REQ_TIMEOUT_MS`**      | Optional | `30000`       | Hard timeout limit for client HTTP calls before killing execution.                           |
| **`API_VERSION`**         | Optional | None          | Version indicator injected into Express response headers.                                    |
| **`MAINTENANCE_MODE`**    | Optional | `false`       | Set to `true` to immediately block all routes with a `503 Service Unavailable`.              |
| **`STANDALONE_SERVER`**   | Optional | `false`       | Run as an API-only server without starting the Vite asset bundling pipeline.                 |
| **`DISABLE_HMR`**         | Optional | `false`       | Disables Hot Module Replacement in the Vite development UI.                                  |
| **`DATABASE_URL`**        | Optional | Auto-created  | Custom directory target path override for SQLite DB mapping.                                 |

---

## 🛡️ Security & Validation Rules

1. **Graceful API Key Checking:**
   The backend must always check `process.env.GEMINI_API_KEY` before calling AI functions. If missing, print a prominent warning but **do not crash the server**. Allow non-AI endpoints to function normally.
2. **No Key Leaking:**
   Never log raw API keys, not even partial portions. Standardize logging to redact or conceal auth credentials.

3. **Template Sync:**
   If any new environment variable is introduced, update the [.env.example](file:///c:/Users/dheen/Downloads/sonikoma/.env.example) template file immediately.
