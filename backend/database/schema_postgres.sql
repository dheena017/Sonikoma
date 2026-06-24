-- =============================================================================
-- Webtoon-to-Video — Relational PostgreSQL Database Schema (Supabase)
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id              TEXT    PRIMARY KEY,
  username        TEXT    NOT NULL UNIQUE,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  preferences     TEXT    NOT NULL DEFAULT '{}',
  avatar_url      TEXT,
  full_name       TEXT,
  google_id       TEXT,
  creator_role    TEXT    NOT NULL DEFAULT 'creator',
  bio             TEXT    NOT NULL DEFAULT '',
  newsletter      INTEGER NOT NULL DEFAULT 1,
  language        TEXT    NOT NULL DEFAULT 'en',
  portfolio_links TEXT    NOT NULL DEFAULT '[]',
  credits         INTEGER NOT NULL DEFAULT 840,
  last_claimed_date TEXT,
  unlocked_rewards TEXT   NOT NULL DEFAULT '[]',
  mfa_enabled     INTEGER NOT NULL DEFAULT 0,
  social_connections TEXT NOT NULL DEFAULT '{"google":true,"github":false,"discord":false}',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Series Table
CREATE TABLE IF NOT EXISTS series (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  slug            TEXT    UNIQUE,
  author          TEXT    NOT NULL,
  cover_image     TEXT,
  genre           TEXT    NOT NULL DEFAULT 'general',
  synopsis        TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
  id              TEXT    PRIMARY KEY,
  series_id       TEXT    NOT NULL,
  episode_number  TEXT    NOT NULL,
  slug            TEXT    UNIQUE,
  original_url    TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending',
  panels_count    INTEGER NOT NULL DEFAULT 0,
  video_url       TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- 4. Storyboard Panels Table
CREATE TABLE IF NOT EXISTS panels (
  id               SERIAL PRIMARY KEY,
  chapter_id       TEXT    NOT NULL,
  panel_index      INTEGER NOT NULL,
  image_url        TEXT    NOT NULL,
  original_url     TEXT,
  speech_text      TEXT    NOT NULL DEFAULT '',
  sfx              TEXT    NOT NULL DEFAULT '',
  duration         REAL    NOT NULL DEFAULT 4.5,
  motion_type      TEXT    NOT NULL DEFAULT 'zoom_in',
  visual_description TEXT,
  brightness       REAL,
  contrast         REAL,
  saturation       REAL,
  grayscale        INTEGER NOT NULL DEFAULT 0,
  filter_preset    TEXT,
  bubble_method    TEXT,
  bubble_sensitivity REAL,
  bubble_dilation  REAL,
  inpaint_radius   INTEGER,
  detection_style  TEXT,
  audio_url        TEXT,
  smart_crop       INTEGER NOT NULL DEFAULT 0,
  crop_padding     INTEGER,
  is_sanitized     INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- 5. Web Scraped Sessions cache
CREATE TABLE IF NOT EXISTS scrape_sessions (
  id          SERIAL PRIMARY KEY,
  url         TEXT    NOT NULL,
  image_urls  TEXT    NOT NULL,
  panel_count INTEGER NOT NULL DEFAULT 0,
  scraped_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Image edits operations undo logs
CREATE TABLE IF NOT EXISTS edit_history (
  id           SERIAL PRIMARY KEY,
  edited_url   TEXT    NOT NULL UNIQUE,
  original_url TEXT    NOT NULL,
  edit_type    TEXT    NOT NULL DEFAULT 'crop',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Device sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  browser     TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  location    TEXT    NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Security audit trails logs
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  event       TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Billing invoices ledger log
CREATE TABLE IF NOT EXISTS user_invoices (
  id          SERIAL PRIMARY KEY,
  invoice_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Developer token credentials
CREATE TABLE IF NOT EXISTS user_api_keys (
  id          SERIAL PRIMARY KEY,
  key_id      TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  api_key     TEXT    NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimizations
CREATE INDEX IF NOT EXISTS idx_panels_chapter_id ON panels(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scrape_url ON scrape_sessions(url);
CREATE INDEX IF NOT EXISTS idx_edit_history_url ON edit_history(edited_url);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_user ON user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug);

-- 11. Token Usage Logs (Time-Series)
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          TEXT NOT NULL,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  NUMERIC(10, 6) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at DESC);
