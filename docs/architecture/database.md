# 🗃️ Local Database Architecture (SQLite)

Anivox uses a localized file-based **SQLite** database. This eliminates complex external database setups and enables running the workspace completely locally.

---

## 📂 Database Components

- **Database Path:** [webtoon_local.db](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/database/webtoon_local.db) (git-ignored, created on first boot)
- **Schema Bootstrap File:** [schema.sql](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/database/schema.sql)
- **Singleton Connection File:** [db.ts](file:///c:/Users/dheen/Downloads/webtoon-to-video-backend/backend/database/db.ts)

---

## 📊 SQLite Tables Structure

The database manages persistent states for scraped episodes, edited segments, user authentication, and undo/redo caches.

| Table Name | Description | Key Fields / Relational Schema |
| :--- | :--- | :--- |
| **`users`** | Registered user accounts. | `id`, `username`, `email`, `password_hash`, `created_at` |
| **`projects`** | High-level containers for processed comic books/episodes. | `id`, `name`, `source_url`, `created_at`, `user_id` (foreign key) |
| **`panels`** | Granular data mappings for individual comic frames. | `id`, `project_id` (foreign key), `image_url`, `speech_text`, `duration`, `motion_type`, `sort_order` |
| **`scrape_sessions`** | Caching layers to prevent scraping the same Webtoon URL multiple times. | `id`, `url`, `panels_json` (serialized cache), `scraped_at` |
| **`edit_history`** | Persistent undo/redo stacks. | `id`, `panel_id` (foreign key), `before_url`, `after_url`, `action_type`, `timestamp` |

---

## 🛡️ Database Execution Rules

1. **Self-Healing Bootstrap:**
   On server startup, `db.ts` checks if the database contains the required table structures. If tables are missing, it automatically parses and applies `schema.sql`.

2. **Always Use Parameterized Queries:**
   To prevent SQL injection vulnerabilities, strings should **never** be concatenated directly into SQL queries.
   ```typescript
   // ✅ CORRECT — parameterized queries protect from injection
   const stmt = db.prepare("SELECT * FROM projects WHERE id = ?");
   const project = stmt.get(projectId);

   // ❌ WRONG — vulnerable to string injection
   const project = db.exec(`SELECT * FROM projects WHERE id = '${projectId}'`);
   ```

3. **Status Reporting:**
   The `/api/health` endpoint queries table record counts to verify active connections and report stats back to the user interface.
