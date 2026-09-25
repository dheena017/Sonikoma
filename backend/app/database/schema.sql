-- =============================================================================
-- Webtoon-to-Video — Relational SQLite Database Schema
-- =============================================================================
-- This file defines the relational tables for Users, Series, and Chapters
-- with ON DELETE CASCADE constraints.
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id              TEXT    PRIMARY KEY,              -- UUID format, e.g. "user_7f9e2b1a"
  username        TEXT    NOT NULL UNIQUE,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  preferences     TEXT    NOT NULL DEFAULT '{}',    -- JSON string for frontend customization values
  avatar_url      TEXT,
  full_name       TEXT,
  google_id       TEXT,
  google_access_token TEXT,
  creator_role    TEXT    NOT NULL DEFAULT 'creator',
  bio             TEXT    NOT NULL DEFAULT '',
  newsletter      INTEGER NOT NULL DEFAULT 1,
  language        TEXT    NOT NULL DEFAULT 'en',
  portfolio_links TEXT    NOT NULL DEFAULT '[]',
  credits         INTEGER NOT NULL DEFAULT 840,
  credit_balance  INTEGER NOT NULL DEFAULT 840,
  last_claimed_date TEXT,
  unlocked_rewards TEXT   NOT NULL DEFAULT '[]',
  mfa_enabled     INTEGER NOT NULL DEFAULT 0,
  is_locked       INTEGER NOT NULL DEFAULT 0,
  is_banned       INTEGER NOT NULL DEFAULT 0,
  ban_reason      TEXT,
  last_login_at   TEXT,
  last_login_ip   TEXT,
  social_connections TEXT NOT NULL DEFAULT '{"google":true,"github":false,"discord":false}',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 2. Series Table (Manhwa/Comic metadata parent level)
CREATE TABLE IF NOT EXISTS series (
  id              TEXT    PRIMARY KEY,              -- UUID format, e.g. "ser_8b2c4e1f"
  user_id         TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  slug            TEXT    UNIQUE,                   -- SEO-friendly URL slug
  author          TEXT    NOT NULL,
  cover_image     TEXT,                             -- URL to the thumbnail/cover image
  genre           TEXT    NOT NULL DEFAULT 'general',
  synopsis        TEXT,                             -- Series synopsis/description
  status          TEXT    NOT NULL DEFAULT 'ready',  -- pending | processing | ready | archived | failed
  is_flagged      INTEGER NOT NULL DEFAULT 0,
  flag_reason     TEXT,
  flagged_by      TEXT,
  flagged_at      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Chapters Table (Child level under Series, replaces flat projects)
CREATE TABLE IF NOT EXISTS chapters (
  id              TEXT    PRIMARY KEY,              -- UUID format, e.g. "chap_9c3d5f2g"
  series_id       TEXT    NOT NULL,
  job_id          TEXT,                             -- Persistent Workspace Job ID
  episode_number  TEXT    NOT NULL,                 -- Text or Float, e.g. "Chapter 15"
  slug            TEXT    UNIQUE,                   -- SEO-friendly URL slug
  original_url    TEXT,                             -- Scraped source URL
  status          TEXT    NOT NULL DEFAULT 'pending', -- pending | processing | completed | failed
  panels_count    INTEGER NOT NULL DEFAULT 0,
  video_url       TEXT,                             -- Path or URL to completed video output (.mp4)
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  audio_settings  TEXT,                             -- Serialized JSONB string of audio mixer settings
  project_type    TEXT    NOT NULL DEFAULT 'permanent', -- temp | permanent
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- 4. Storyboard Panels Table (Grandchild level under chapters)
CREATE TABLE IF NOT EXISTS panels (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id       TEXT    NOT NULL,
  panel_index      INTEGER NOT NULL,
  image_url        TEXT    NOT NULL,
  original_url     TEXT,
  speech_text      TEXT    NOT NULL DEFAULT '',
  sfx              TEXT    NOT NULL DEFAULT '',
  duration         REAL,
  motion_type      TEXT,
  visual_description TEXT,
  narrative        TEXT,
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
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- 5. Web Scraped Sessions cache
CREATE TABLE IF NOT EXISTS scrape_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT    NOT NULL,
  image_urls  TEXT    NOT NULL,                 -- JSON array of image URLs
  panel_count INTEGER NOT NULL DEFAULT 0,
  scraped_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 6. Image edits operations undo logs
CREATE TABLE IF NOT EXISTS edit_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  edited_url   TEXT    NOT NULL UNIQUE,
  original_url TEXT    NOT NULL,
  edit_type    TEXT    NOT NULL DEFAULT 'crop',
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 7. Device sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  browser     TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  location    TEXT    NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Security audit trails logs
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  event       TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Billing invoices ledger log
CREATE TABLE IF NOT EXISTS user_invoices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Developer token credentials
CREATE TABLE IF NOT EXISTS user_api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id      TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  api_key     TEXT    NOT NULL UNIQUE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Content Moderation Audit Logs
CREATE TABLE IF NOT EXISTS content_moderation_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id     TEXT,
  chapter_id    TEXT,
  admin_id      TEXT NOT NULL,
  action        TEXT NOT NULL,
  reason        TEXT NOT NULL,
  previous_state TEXT,
  new_state     TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Scraper Rules Configuration
CREATE TABLE IF NOT EXISTS scraper_rules (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  domain              TEXT UNIQUE NOT NULL,
  is_blocked          INTEGER NOT NULL DEFAULT 0,
  rate_limit_per_min  INTEGER NOT NULL DEFAULT 30,
  proxy_required      INTEGER NOT NULL DEFAULT 0,
  custom_headers      TEXT DEFAULT '{}',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
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
CREATE INDEX IF NOT EXISTS idx_series_is_flagged ON series(is_flagged);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug);

-- 14. Token Usage Logs (Time-Series)
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT,
  project_id          TEXT NOT NULL,
  chapter_id          TEXT,
  job_id              TEXT,
  model_name          TEXT,
  provider            TEXT,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  REAL NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_user_id ON token_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at);

-- 15. Credit Transactions Ledger
CREATE TABLE IF NOT EXISTS credit_transactions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  feature_name    TEXT NOT NULL,
  transaction_type TEXT DEFAULT 'grant',
  reference_id    TEXT,
  metadata        TEXT DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);

-- 16. System Announcements
CREATE TABLE IF NOT EXISTS system_announcements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  status      TEXT NOT NULL DEFAULT 'active',
  target_role TEXT NOT NULL DEFAULT 'all',
  starts_at   TEXT,
  expires_at  TEXT,
  created_by  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. YouTube Publishing Profiles (Custom Settings)
CREATE TABLE IF NOT EXISTS youtube_profiles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             TEXT    NOT NULL,
  name                TEXT    NOT NULL,
  title_template      TEXT    NOT NULL,
  description_template TEXT   NOT NULL,
  tags                TEXT    NOT NULL,                 -- JSON array format
  category_id         TEXT    NOT NULL DEFAULT '1',
  privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
  is_short            INTEGER NOT NULL DEFAULT 0,
  made_for_kids       TEXT    NOT NULL DEFAULT 'no',
  paid_promotion      INTEGER NOT NULL DEFAULT 0,
  license             TEXT    NOT NULL DEFAULT 'youtube',
  video_language      TEXT    NOT NULL DEFAULT 'en',
  channel_link        TEXT,
  discord_link        TEXT,
  patreon_link        TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- 18. YouTube Publications Log (Upload History)
CREATE TABLE IF NOT EXISTS youtube_publications (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             TEXT    NOT NULL,
  chapter_id          TEXT,
  youtube_url         TEXT    NOT NULL,
  title               TEXT    NOT NULL,
  privacy_status      TEXT    NOT NULL DEFAULT 'unlisted',
  published_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_youtube_profiles_user ON youtube_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_publications_user ON youtube_publications(user_id);

-- 19. YouTube Custom OAuth Credentials
CREATE TABLE IF NOT EXISTS youtube_credentials (
  user_id             TEXT    PRIMARY KEY,
  client_id           TEXT    NOT NULL,
  client_secret       TEXT    NOT NULL,
  project_id          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 20. Persistent System Logs (High Volume Diagnostic Data)
CREATE TABLE IF NOT EXISTS system_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT    NOT NULL,                 -- Display time (HH:MM:SS)
  message     TEXT    NOT NULL,
  level       TEXT    NOT NULL,                 -- INFO, SUCCESS, WARN, ERROR, etc.
  module      TEXT    NOT NULL,                 -- Scraper, Model, AI, API, etc.
  details     TEXT,                             -- JSON or raw payload details
  correlation_id TEXT,
  user_id     TEXT,
  snapshot    TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- 21. Persistent Background Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT    PRIMARY KEY,              -- Replaces job_id as the canonical identifier
  user_id         TEXT    NOT NULL,
  project_id      TEXT,                             -- Can be series_id depending on context
  chapter_id      TEXT,
  type            TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'QUEUED',
  progress        REAL    NOT NULL DEFAULT 0.0,
  stage           TEXT    NOT NULL DEFAULT 'QUEUED',
  result          TEXT,                             -- JSON string for result payload
  error           TEXT,
  metadata        TEXT,                             -- JSON string for metadata payload
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  started_at      TEXT,
  completed_at    TEXT,
  cancelled_at    TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);

-- 22. YouTube OAuth Tokens
CREATE TABLE IF NOT EXISTS youtube_oauth_tokens (
  user_id                    TEXT PRIMARY KEY,
  access_token               TEXT NOT NULL,
  refresh_token              TEXT,
  token_uri                  TEXT NOT NULL DEFAULT 'https://oauth2.googleapis.com/token',
  client_id                  TEXT,
  client_secret              TEXT,
  scopes                     TEXT,
  google_email               TEXT,
  selected_channel_id        TEXT,
  selected_channel_title     TEXT,
  selected_channel_thumbnail TEXT,
  selected_channel_handle    TEXT,
  updated_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 23. Connected YouTube Channels
CREATE TABLE IF NOT EXISTS user_youtube_channels (
  channel_id       TEXT NOT NULL,
  user_id          TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  custom_url       TEXT,
  thumbnail        TEXT,
  subscriber_count TEXT,
  view_count       TEXT,
  video_count      TEXT,
  channel_type     TEXT DEFAULT 'personal',
  is_selected      INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 24. User-unlinked YouTube Channels
CREATE TABLE IF NOT EXISTS user_unlinked_youtube_channels (
  user_id     TEXT NOT NULL,
  channel_id  TEXT NOT NULL,
  unlinked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_yt_channels_user
  ON user_youtube_channels(user_id);

