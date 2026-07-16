# Sonikoma Project Health Dashboard

This dashboard serves as a central template for tracking and monitoring Sonikoma's technical health, repository metrics, pipeline efficiency, and active system resource usage.

---

## 📈 1. Repository & Codebase Metrics

| Metric | Target | Current Value | Status | Last Updated |
| :--- | :---: | :---: | :---: | :---: |
| **Repository Size** | < 500 MB (excl. data) | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **Total File Count** | < 2,000 files | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **Total Lines of Code** | < 150,000 LOC | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **TypeScript Compiler Errors** | 0 Errors | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **ESLint Static Analysis Warnings**| < 50 Warnings | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **TODO Code Comments** | < 30 TODOs | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **Project Build Time (Vite)** | < 45 seconds | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |
| **Production Bundle Size** | < 3.5 MB | `[PLACEHOLDER]` | `[PENDING]` | July 2026 |

*Note: Codebase metrics can be calculated locally by running standard static analysis checkers (`npm run typecheck`, `cloc`, `git count-objects`).*

---

## 🧪 2. Quality Assurance & Test Coverage

| Domain / Suite | Test Count | Statement Coverage | Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Frontend Component Unit Tests** | `[PLACEHOLDER]` | `[PLACEHOLDER]%` | `[PENDING]` | React Testing Library |
| **Frontend Playwright E2E Tests** | `[PLACEHOLDER]` | N/A | `[PENDING]` | Core layout/player tests |
| **Backend Service Unit Tests** | `[PLACEHOLDER]` | `[PLACEHOLDER]%` | `[PENDING]` | pytest for OCR, media utilities |
| **AI Subsystem Integration Tests**| `[PLACEHOLDER]` | `[PLACEHOLDER]%` | `[PENDING]` | Gemini mock skill evaluations |
| **Total System Test Coverage** | `[PLACEHOLDER]` | `[PLACEHOLDER]%` | `[PENDING]` | System-wide combined average |

---

## ⚙️ 3. Operational Performance & Runtime Health

*The metrics below track the real-time operational state of the backend service endpoints under standard user load, as reported via the `/api/metrics` dashboard.*

### Server Performance
* **Backend Boot & Startup Time:** `[PLACEHOLDER] ms` (Target: < 4,000 ms including SQL migration checks)
* **API Average Server Latency:** `[PLACEHOLDER] ms` (Target: < 150 ms for typical non-AI JSON metadata routes)
* **Image Proxy/Cache Hit Rate:** `[PLACEHOLDER]%` (Target: > 85% for scraped panel images)
* **Video Compilation Throughput:** `[PLACEHOLDER] sec/frame` (Target: < 0.2s per composite frame rendered on standard hardware)

### Resource Allocation (Average Baseline)
* **Backend RAM Footprint:** `[PLACEHOLDER] MB` (Target: < 800 MB idling)
* **Backend Peak GPU VRAM Usage:** `[PLACEHOLDER] GB` (Target: < 4.0 GB under concurrent batch YOLO / RemBG runs)
* **Active System CPU Load:** `[PLACEHOLDER]%` (Target: < 15% idling, < 80% rendering)

---

## 🔍 4. System Health Checklist

- [ ] **TypeScript Check:** `npm run typecheck` exits with code `0`.
- [ ] **Production Build Check:** `npm run build` runs successfully.
- [ ] **Database Integrity:** No foreign key or constraint violations in `webtoon_local.db`.
- [ ] **Temp Space Cleared:** Direct temp files under `data/temp/` are successfully collected post-execution.
- [ ] **Log Listener Status:** Server-Sent Events (SSE) system logging cleanly releases connection sockets upon client exit.
