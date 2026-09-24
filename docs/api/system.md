# 🩺 System & Diagnostics API

Endpoints for health checks, system metrics, and real-time logging.

| Endpoint                  | Method | Input Parameters   | Description                                                                           |
| :------------------------ | :----- | :----------------- | :------------------------------------------------------------------------------------ |
| `/api/v1/system/health`             | `GET`  | None               | Liveness check; validates SQLite connection.                                          |
| `/api/v1/system/metrics`            | `GET`  | None               | Reports live server uptime, RSS memory, request stats, rate-limits, and image caches. |
| `/api/v1/system/system-logs`        | `GET`  | `limit` (optional) | Retrieval fallback for backend logs.                                                  |
| `/api/v1/system/system-logs/stream` | `GET`  | None               | Pushes real-time, ANSI-colored log updates to UI via Server-Sent Events (SSE).        |
