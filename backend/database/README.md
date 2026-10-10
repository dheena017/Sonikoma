# Database Infrastructure (`backend/database/`)

## 1. Overview & Architecture
The `database/` package provides Sonikoma's unified database abstraction layer, operating on **SQLite (WAL Mode)** with thread-safe connection pooling, automated schema validation, and cloud bucket storage integration:

```text
backend/database/
├── __init__.py         # Package root with unified public exports
├── bootstrap.py        # Thread-safe database startup orchestration & mutex guards
├── config.py           # Path constants, environment variables, and credit thresholds
├── engine.py           # Low-level SQLite connection factory with WAL mode & PRAGMAs
├── migrator.py         # Canonical schema applicator and legacy-table data migration
├── schema.sql          # Canonical 29-table DDL schema with domain grouping and indexes
├── utils.py            # Unified utilities: UUID/datetime generation, slugs, transactions, proxy unwrapping
├── supabase.py         # Supabase client and storage bucket upload integration
└── README.md           # Database architecture documentation
```

---

## 2. Entity-Relationship & Domain Table Mapping

Application state is partitioned across the 10 feature domains in `schema.sql`:

```mermaid
erDiagram
    auth_users ||--o{ auth_sessions : has
    auth_users ||--o{ profile_api_keys : owns
    auth_users ||--o{ profile_invoices : billed
    auth_users ||--o{ platform_series : creates
    platform_series ||--o{ workspace_chapters : contains
    workspace_chapters ||--o{ image_panels : divides_into
    auth_users ||--o{ platform_jobs : triggers
    auth_users ||--o{ creative_youtube_profiles : configures
    creative_youtube_profiles ||--o{ creative_youtube_publications : publishes
    platform_scrape_sessions ||--o{ workspace_chapters : produces
```

### Table Breakdown by 10 Core Application Domains:
| # | Feature Domain | Sub-Domain | Database Tables | Responsibilities |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **`admin/`** | `settings`, `notifications`, `moderation` | `admin_settings`, `admin_announcements`, `admin_moderation_logs` | Global toggles, banner announcements, safety moderation |
| **2** | **`landing/`** | `showcase`, `pricing` | *(Stateless / public queries)* | Public landing page metrics (reads series/user aggregates) |
| **3** | **`auth/`** | `identity`, `session`, `security` | `auth_users`, `auth_sessions`, `auth_audit_logs` | Credential auth, login sessions, security event audits |
| **4** | **`workspace/`** | `shell`, `storyboard` | `workspace_chapters`, `image_panels` | Storyboard scene breakdowns, voiceover scripts, panel queues |
| **5** | **`image-editor/`** | `canvas`, `auto-crop`, `history` | `image_panels`, `image_edit_history` | Panel detection, crop coordinates, bubble params, edit cache history |
| **6** | **`video-editor/`** | `timeline`, `render` | `workspace_chapters`, `image_panels` | Video render status, frame timings, motion transitions, audio sync |
| **7** | **`creative/`** | `youtube`, `agent` | `creative_youtube_channels`, `creative_youtube_unlinked_channels`, `creative_youtube_tokens`, `creative_youtube_profiles`, `creative_youtube_publications`, `creative_youtube_credentials`, `creative_style_profiles` | YouTube publishing, OAuth2 credentials, creator style preferences |
| **8** | **`platform/`** | `projects`, `scraper`, `jobs`, `terminal` | `platform_series`, `workspace_chapters`, `platform_scrape_sessions`, `platform_series_cache`, `platform_jobs`, `platform_system_logs` | Series/chapter lifecycle, web scraping, async jobs, debug logs |
| **9** | **`profile/`** | `account`, `api-keys`, `billing` | `auth_users`, `profile_api_keys`, `profile_invoices`, `profile_credit_transactions` | Creator bio, developer API keys, billing invoices, credit wallet |
| **10** | **`intelligence/`** | `series-studio`, `lore`, `routing` | `intelligence_projects`, `intelligence_continuity_memory`, `intelligence_feedback_events`, `intelligence_ledger`, `intelligence_token_usage` | AI project state, lore memory, feedback, token usage |

---

## 3. Connection Lifecycle & Utilities

### Connection Factory (`engine.py`)
Repositories and services obtain managed connections via `get_db_connection`:
```python
from database.engine import get_db_connection

conn = get_db_connection()
try:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workspace_chapters WHERE series_id = ?", (series_id,))
    rows = cursor.fetchall()
finally:
    conn.close()
```

### Managed Transactions (`utils.py`)
Atomic operations wrapped with `managed_transaction` guarantee automatic commit on success and rollback on exceptions:
```python
from database import managed_transaction

with managed_transaction(conn) as active_conn:
    active_conn.execute("INSERT INTO platform_series (id, user_id, title, author) VALUES (?, ?, ?, ?)", (series_id, user_id, title, author))
    active_conn.execute("INSERT INTO workspace_chapters (id, series_id, episode_number) VALUES (?, ?, ?)", (chapter_id, series_id, episode_number))
    # Automatically committed at block exit, or rolled back on error
```

---

## 4. Migrations & Schema Evolution (`migrator.py`)
- **Canonical Schema**: `schema.sql` defines 29 domain-prefixed tables, foreign keys, and indexes using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
- **Migration Runner**: On startup, `migrator.init_sqlite()` applies the schema, copies intersecting columns from legacy table names into canonical tables, preserves legacy tables as rollback copies, and backfills missing slugs.
