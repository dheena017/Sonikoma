-- =============================================================================
-- SONIKOMA AI STUDIO — CANONICAL DATABASE SCHEMA (schema.sql)
-- =============================================================================
-- Dual-Engine Compatible: SQLite (Local Development) & PostgreSQL (Production)
-- Fully normalized entity nomenclature, unified timestamps, and indexed date sorting.
-- Redundant tables and duplicate synonym columns eliminated.
-- =============================================================================

-- =============================================================================
-- SECTION 1: USER IDENTITY, AUTHENTICATION & ACCESS CONTROL
-- =============================================================================

-- 1. Users (Creator, Artist & Admin Accounts)
CREATE TABLE IF NOT EXISTS users (
  id                  TEXT    PRIMARY KEY,              -- UUID format, e.g. "user_7f9e2b1a"
  username            TEXT    NOT NULL UNIQUE,
  email               TEXT    NOT NULL UNIQUE,
  password_hash       TEXT    NOT NULL,
  creator_role        TEXT    NOT NULL DEFAULT 'creator',-- "creator" | "admin" | "moderator"
  full_name           TEXT,
  avatar_url          TEXT,
  bio                 TEXT    NOT NULL DEFAULT '',
  location            TEXT    NOT NULL DEFAULT '',
  website             TEXT    NOT NULL DEFAULT '',
  timezone            TEXT    NOT NULL DEFAULT 'UTC',
  language            TEXT    NOT NULL DEFAULT 'en',
  credits             INTEGER NOT NULL DEFAULT 840,     -- Canonical compute credits for AI generation
  credit_balance      INTEGER NOT NULL DEFAULT 840,     -- Legacy mirror column for backward compatibility
  last_claimed_date   TEXT,                             -- Daily bonus claim tracker (YYYY-MM-DD)
  unlocked_rewards    TEXT    NOT NULL DEFAULT '[]',    -- JSON array of unlocked achievement badges
  preferences         TEXT    NOT NULL DEFAULT '{}',    -- JSON string for UI customization & presets
  google_id           TEXT,                             -- Google OAuth subject identifier
  google_access_token TEXT,                             -- Transient OAuth bearer token
  social_connections  TEXT    NOT NULL DEFAULT '{"google":true,"github":false,"discord":false}',
  newsletter          INTEGER NOT NULL DEFAULT 0,       -- 1 if subscribed to product updates
  portfolio_links     TEXT    NOT NULL DEFAULT '[]',    -- JSON array of external portfolio URLs
  mfa_enabled         INTEGER NOT NULL DEFAULT 0,       -- Multi-factor authentication flag
  is_locked           INTEGER NOT NULL DEFAULT 0,       -- Administrative account lock flag
  is_banned           INTEGER NOT NULL DEFAULT 0,       -- Safety ban flag
  ban_reason          TEXT,
  last_login_at       TEXT,
  last_login_ip       TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 2. Active User Sessions (Device & Browser Tracking)
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

-- 3. Security Audit Logs (Authentication & Sensitive Operations)
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  event       TEXT    NOT NULL,                         -- "login", "logout", "password_reset", "export"
  ip          TEXT    NOT NULL,
  status      TEXT    NOT NULL,                         -- "SUCCESS" | "FAILED"
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Developer API Keys (Programmatic SDK & Automation Credentials)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id      TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  api_key     TEXT    NOT NULL UNIQUE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================================================
-- SECTION 2: CREATIVE STUDIO CORE (Series -> Chapters -> Panels)
-- =============================================================================

-- 5. Series (Parent Manhwa / Comic / Manga Publication)
CREATE TABLE IF NOT EXISTS series (
  id          TEXT    PRIMARY KEY,                      -- UUID format, e.g. "ser_83cbec86"
  user_id     TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  slug        TEXT    UNIQUE,                           -- URL slug, e.g. "here-u-are-1"
  author      TEXT    NOT NULL,
  cover_image TEXT,                                     -- URL or path to series thumbnail poster
  genre       TEXT    NOT NULL DEFAULT 'general',
  synopsis    TEXT,                                     -- Series overview / storyline summary
  status      TEXT    NOT NULL DEFAULT 'ready',          -- "pending" | "processing" | "ready" | "archived"
  is_flagged  INTEGER NOT NULL DEFAULT 0,               -- Content moderation flag
  flag_reason TEXT,
  flagged_by  TEXT,
  flagged_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Chapters (Episodes Nested Under a Series)
CREATE TABLE IF NOT EXISTS chapters (
  id                TEXT    PRIMARY KEY,                -- UUID format, e.g. "chap_here_u_are_148"
  series_id         TEXT    NOT NULL,
  episode_number    TEXT    NOT NULL,                   -- Display chapter title, e.g. "Chapter 148"
  slug              TEXT    UNIQUE,                     -- URL slug, e.g. "chapter-here-u-are-148-2"
  original_url      TEXT,                               -- Source scraped URL
  status            TEXT    NOT NULL DEFAULT 'pending', -- "pending" | "processing" | "completed" | "failed"
  panels_count      INTEGER NOT NULL DEFAULT 0,         -- Total storyboard panels
  video_url         TEXT,                               -- Completed MP4 video export path
  job_id            TEXT,                               -- Active background rendering job reference
  total_tokens_used INTEGER NOT NULL DEFAULT 0,         -- AI tokens consumed generating this chapter
  audio_settings    TEXT,                               -- Serialized JSON of audio mixer settings
  project_type      TEXT    NOT NULL DEFAULT 'permanent',-- "temp" | "permanent"
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- 7. Storyboard Panels (Extracted Comic Frames, Dialogue & Visual Effects)
CREATE TABLE IF NOT EXISTS panels (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id         TEXT    NOT NULL,
  panel_index        INTEGER NOT NULL,                  -- Sequential frame index (0, 1, 2, ...)
  image_url          TEXT    NOT NULL,                  -- Clean cropped panel image path
  original_url       TEXT,                              -- Source uncropped strip image
  speech_text        TEXT    NOT NULL DEFAULT '',       -- Dialogue extracted from speech bubbles
  sfx                TEXT    NOT NULL DEFAULT '',       -- Onomatopoeia / sound effect text
  duration           REAL,                              -- Timeline display duration in seconds
  motion_type        TEXT,                              -- "Ken Burns", "Pan Up", "Static"
  visual_description TEXT,                              -- Frame visual description / artwork generation prompt
  narrative          TEXT,                              -- Scene visual summary & context (unified narrative)
  brightness         REAL,
  contrast           REAL,
  saturation         REAL,
  grayscale          INTEGER DEFAULT 0,                 -- Grayscale filter toggle (0 or 1)
  filter_preset      TEXT,                              -- "grayscale", "warm", "vintage", "dramatic"
  bubble_method      TEXT,                              -- Detection algorithm: "opencv", "yolo", "manual"
  detection_style    TEXT,                              -- Detection filter: "all", "white_only", "text_only"
  bubble_sensitivity REAL    DEFAULT 0.5,               -- Bubble detection contour sensitivity threshold
  bubble_dilation    INTEGER DEFAULT 2,                 -- Contour dilation pixel radius
  inpaint_radius     INTEGER DEFAULT 5,                 -- Inpainting brush pixel radius
  audio_url          TEXT,                              -- Generated TTS speech audio clip
  smart_crop         INTEGER NOT NULL DEFAULT 0,        -- 1 if auto-crop heuristic applied
  crop_padding       INTEGER DEFAULT 0,                 -- Outer bounding box padding in pixels
  is_sanitized       INTEGER NOT NULL DEFAULT 0,        -- 1 if text bubbles have been inpainted
  created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);


-- =============================================================================
-- SECTION 3: BACKGROUND WORKER JOBS, AI TELEMETRY & BILLING LEDGER
-- =============================================================================

-- 8. Persistent Background Jobs (Asynchronous Worker Tasks)
CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT    PRIMARY KEY,                    -- UUID format, e.g. "job_9a1b..."
  user_id       TEXT    NOT NULL,
  project_id    TEXT,                                   -- Reference to series or chapter
  chapter_id    TEXT,
  type          TEXT    NOT NULL,                       -- "SCRAPE", "AUTOCROP", "TTS", "VIDEO"
  status        TEXT    NOT NULL DEFAULT 'QUEUED',      -- "QUEUED", "PROCESSING", "COMPLETED", "FAILED"
  progress      REAL    NOT NULL DEFAULT 0.0,           -- Progress percentage (0.0 to 100.0)
  stage         TEXT    NOT NULL DEFAULT 'QUEUED',      -- Current pipeline stage description
  result        TEXT,                                   -- Serialized JSON payload on completion
  error         TEXT,                                   -- Error traceback on failure
  metadata      TEXT,                                   -- Serialized JSON input parameters
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  started_at    TEXT,
  completed_at  TEXT,
  cancelled_at  TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. AI Token Usage Logs (Job & Chapter-Scoped LLM Cost Accounting)
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id                  TEXT    PRIMARY KEY,
  user_id             TEXT,
  project_id          TEXT    NOT NULL,
  chapter_id          TEXT,
  job_id              TEXT,
  model_name          TEXT,                             -- "gemini-2.0-flash", "kokoro", "claude-3-7"
  provider            TEXT,                             -- "google", "local", "anthropic"
  input_tokens        INTEGER NOT NULL DEFAULT 0,       -- Prompt tokens consumed
  output_tokens       INTEGER NOT NULL DEFAULT 0,       -- Completion tokens generated
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  REAL    NOT NULL DEFAULT 0.0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 10. AI Telemetry Analytics Ledger (Fine-Grained Latency & Model Performance)
CREATE TABLE IF NOT EXISTS ai_token_usage_ledger (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             TEXT,
  provider            TEXT    NOT NULL,                 -- "google", "local", "anthropic"
  model               TEXT    NOT NULL,                 -- Model identifier
  feature             TEXT    NOT NULL,                 -- "storyboard", "tts", "scripting"
  prompt_tokens       INTEGER NOT NULL DEFAULT 0,
  completion_tokens   INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  latency_ms          INTEGER NOT NULL DEFAULT 0,       -- Response latency in milliseconds
  cost_estimate_usd   REAL    NOT NULL DEFAULT 0.0,
  status              TEXT    NOT NULL DEFAULT 'success',
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 11. Credit Transactions Ledger (User Wallet Balance Changes)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                TEXT    PRIMARY KEY,
  user_id           TEXT    NOT NULL,
  amount            INTEGER NOT NULL,                   -- +/- credit balance adjustment
  feature_name      TEXT    NOT NULL,                   -- "tts", "video_render", "translation", "bonus"
  transaction_type  TEXT    DEFAULT 'grant',            -- "grant" | "deduction" | "bonus" | "refund"
  reference_id      TEXT,                               -- Associated job_id or payment reference
  metadata          TEXT    DEFAULT '{}',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. User Billing Invoices
CREATE TABLE IF NOT EXISTS user_invoices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  status      TEXT    NOT NULL,                         -- "paid" | "pending" | "failed"
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================================================
-- SECTION 4: WEBTOON SCRAPER & INGESTION CACHING ENGINE
-- =============================================================================

-- 13. Scrape Sessions (Scraped URL Deck & Extracted Image URLs)
CREATE TABLE IF NOT EXISTS scrape_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT    NOT NULL,
  image_urls  TEXT    NOT NULL,                         -- JSON array of raw scraped image URLs
  panel_count INTEGER NOT NULL DEFAULT 0,
  scraped_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 14. Series Chapters Discovery Cache (Aggregated Series Metadata)
CREATE TABLE IF NOT EXISTS series_chapters_cache (
  series_url     TEXT    PRIMARY KEY,
  title          TEXT,
  data_json      TEXT    NOT NULL,                      -- Serialized JSON chapter list
  total_chapters INTEGER DEFAULT 0,
  updated_at     TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 15. Scraper Domain Crawling Rules (Domain Rate Limiting & Policies)
CREATE TABLE IF NOT EXISTS scraper_rules (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  domain              TEXT UNIQUE NOT NULL,
  is_blocked          INTEGER NOT NULL DEFAULT 0,
  rate_limit_per_min  INTEGER NOT NULL DEFAULT 30,
  proxy_required      INTEGER NOT NULL DEFAULT 0,
  custom_headers      TEXT DEFAULT '{}',
  engine_strategy     TEXT DEFAULT 'auto',
  timeout_sec         INTEGER DEFAULT 30,
  max_concurrency     INTEGER DEFAULT 2,
  retry_attempts      INTEGER DEFAULT 2,
  notes               TEXT DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 16. Scraper L1 HTML Cache (Raw Webpage Cache)
CREATE TABLE IF NOT EXISTS scraper_l1_cache (
  cache_key   TEXT    PRIMARY KEY,
  url         TEXT    NOT NULL,
  html        TEXT    NOT NULL,
  expires_at  REAL    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 17. Scraper L5 Results Cache (Idempotent Scrape Cache)
CREATE TABLE IF NOT EXISTS scraper_l5_cache (
  idempotency_key TEXT    PRIMARY KEY,
  canonical_url   TEXT    NOT NULL,
  result_json     TEXT    NOT NULL,
  expires_at      REAL    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);


-- =============================================================================
-- SECTION 5: YOUTUBE STUDIO & MULTI-CHANNEL PUBLISHING
-- =============================================================================

-- 18. Connected YouTube Channels
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
  channel_type     TEXT DEFAULT 'personal',             -- "personal" | "brand"
  is_selected      INTEGER NOT NULL DEFAULT 0,          -- 1 if active target channel
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 19. YouTube Account OAuth Tokens
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

-- 20. YouTube Publishing Profiles (Video Metadata Presets)
CREATE TABLE IF NOT EXISTS youtube_profiles (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              TEXT    NOT NULL,
  name                 TEXT    NOT NULL,
  title_template       TEXT    NOT NULL,
  description_template TEXT    NOT NULL,
  tags                 TEXT    NOT NULL,                -- JSON array format
  category_id          TEXT    NOT NULL DEFAULT '1',
  privacy_status       TEXT    NOT NULL DEFAULT 'unlisted',
  is_short             INTEGER NOT NULL DEFAULT 0,
  made_for_kids        TEXT    NOT NULL DEFAULT 'no',
  paid_promotion       INTEGER NOT NULL DEFAULT 0,
  license              TEXT    NOT NULL DEFAULT 'youtube',
  video_language       TEXT    NOT NULL DEFAULT 'en',
  channel_link         TEXT,
  discord_link         TEXT,
  patreon_link         TEXT,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

-- 21. YouTube Publication History (Upload Logs)
CREATE TABLE IF NOT EXISTS youtube_publications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT    NOT NULL,
  chapter_id      TEXT,
  youtube_url     TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  privacy_status  TEXT    NOT NULL DEFAULT 'unlisted',
  published_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

-- 22. YouTube Custom Client Credentials (BYO GCP Project)
CREATE TABLE IF NOT EXISTS youtube_credentials (
  user_id         TEXT    PRIMARY KEY,
  client_id       TEXT    NOT NULL,
  client_secret   TEXT    NOT NULL,
  project_id      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =============================================================================
-- SECTION 6: AI STUDIO PROJECTS, CONTINUITY LORE MEMORY & FEEDBACK
-- =============================================================================

-- 23. AI Generated Series Projects
CREATE TABLE IF NOT EXISTS ai_series_projects (
  series_id   TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  format_type TEXT    NOT NULL,
  art_style   TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  data_json   TEXT    NOT NULL
);

-- 24. Series Continuity Memory (Franchise Canon, World Rules & Character States)
-- NOTE: Standardized canonical columns eliminate legacy synonyms (canon_facts -> world_rules,
-- character_states -> active_characters, recurring_motifs -> canonical_locations).
CREATE TABLE IF NOT EXISTS series_continuity_memory (
  series_id                TEXT PRIMARY KEY,
  active_characters        TEXT,                        -- JSON: Character visual traits & current states
  world_rules              TEXT,                        -- JSON: Immutable physics, power systems & world laws
  lore_revelations         TEXT,                        -- JSON: Unveiled secrets & lore milestones
  unresolved_threads       TEXT,                        -- JSON: Active plot hooks & foreshadowing
  resolved_threads         TEXT,                        -- JSON: Concluded storyline arcs
  canonical_locations      TEXT,                        -- JSON: Recurring locations & spatial continuity
  total_chapters_generated INTEGER DEFAULT 0,
  last_synced_at           TEXT,
  updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 25. Creator Feedback & Quality Refinement Events (RLHF Event Stream)
CREATE TABLE IF NOT EXISTS series_feedback_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id      TEXT    NOT NULL,
  chapter_number TEXT    NOT NULL,
  panel_index    INTEGER,
  feedback_type  TEXT    NOT NULL,
  user_comment   TEXT,
  applied_fix    TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);


-- =============================================================================
-- SECTION 7: PLATFORM GOVERNANCE, SETTINGS & SYSTEM DIAGNOSTICS
-- =============================================================================

-- 26. Platform Settings (Dynamic Configuration Flags)
CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 27. System Runtime Logs (Structured Application Diagnostics)
-- Unified to canonical created_at (duplicate timestamp column removed).
CREATE TABLE IF NOT EXISTS system_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  message         TEXT    NOT NULL,
  level           TEXT    NOT NULL,                     -- "INFO" | "WARN" | "ERROR"
  module          TEXT    NOT NULL,                     -- "Scraper", "AI", "Video", "Auth"
  details         TEXT,                                 -- Serialized JSON diagnostic context
  correlation_id  TEXT,
  user_id         TEXT,
  snapshot        TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 28. Content Moderation Audit Logs
CREATE TABLE IF NOT EXISTS content_moderation_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id       TEXT,
  chapter_id      TEXT,
  admin_id        TEXT    NOT NULL,
  action          TEXT    NOT NULL,
  reason          TEXT    NOT NULL,
  previous_state  TEXT,
  new_state       TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 29. System Announcements (Platform Banner Notifications)
CREATE TABLE IF NOT EXISTS system_announcements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'info',
  status      TEXT    NOT NULL DEFAULT 'active',
  target_role TEXT    NOT NULL DEFAULT 'all',
  starts_at   TEXT,
  expires_at  TEXT,
  created_by  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);


-- =============================================================================
-- SECTION 8: PERFORMANCE LOOKUP & CHRONOLOGICAL DATE INDEXES
-- =============================================================================

-- Core Foreign Key & Slug Indexes
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug);
CREATE INDEX IF NOT EXISTS idx_panels_chapter_id ON panels(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scrape_url ON scrape_sessions(url);
CREATE INDEX IF NOT EXISTS idx_series_ch_cache_url ON series_chapters_cache(series_url);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_user ON user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_youtube_profiles_user ON youtube_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_publications_user ON youtube_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_yt_channels_user ON user_youtube_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_series_updated ON ai_series_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_logs_project_id ON token_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_user_id ON token_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_user ON ai_token_usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_module ON system_logs(module);

-- Universal High-Performance Date Sorting Indexes
CREATE INDEX IF NOT EXISTS idx_series_created_at ON series(created_at);
CREATE INDEX IF NOT EXISTS idx_series_updated_at ON series(updated_at);
CREATE INDEX IF NOT EXISTS idx_chapters_created_at ON chapters(created_at);
CREATE INDEX IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_created_at ON ai_token_usage_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_scraped_at ON scrape_sessions(scraped_at);
CREATE INDEX IF NOT EXISTS idx_youtube_pubs_published_at ON youtube_publications(published_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
