-- =============================================================================
-- SONIKOMA AI STUDIO — FINAL POLISHED DATABASE SCHEMA
-- =============================================================================
-- Clean naming convention: domain + entity, with short and readable names.
-- Examples:
--   auth_users
--   workspace_chapters
--   platform_jobs
--   intelligence_ledger
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_settings (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_announcements (
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

CREATE TABLE IF NOT EXISTS admin_moderation_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id       TEXT,
  chapter_id      TEXT,
  admin_id        TEXT    NOT NULL,
  action          TEXT    NOT NULL,
  reason          TEXT    NOT NULL,
  previous_state  TEXT,
  new_state       TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_users (
  id                  TEXT    PRIMARY KEY,
  username            TEXT    NOT NULL UNIQUE,
  email               TEXT    NOT NULL UNIQUE,
  password_hash       TEXT    NOT NULL,
  creator_role        TEXT    NOT NULL DEFAULT 'creator',
  full_name           TEXT,
  avatar_url          TEXT,
  bio                 TEXT    NOT NULL DEFAULT '',
  location            TEXT    NOT NULL DEFAULT '',
  website             TEXT    NOT NULL DEFAULT '',
  timezone            TEXT    NOT NULL DEFAULT 'UTC',
  language            TEXT    NOT NULL DEFAULT 'en',
  credits             INTEGER NOT NULL DEFAULT 840,
  credit_balance      INTEGER NOT NULL DEFAULT 840,
  last_claimed_date   TEXT,
  unlocked_rewards    TEXT    NOT NULL DEFAULT '[]',
  preferences         TEXT    NOT NULL DEFAULT '{}',
  google_id           TEXT,
  google_access_token TEXT,
  social_connections  TEXT    NOT NULL DEFAULT '{"google":true,"github":false,"discord":false}',
  newsletter          INTEGER NOT NULL DEFAULT 0,
  portfolio_links     TEXT    NOT NULL DEFAULT '[]',
  mfa_enabled         INTEGER NOT NULL DEFAULT 0,
  is_locked           INTEGER NOT NULL DEFAULT 0,
  is_banned           INTEGER NOT NULL DEFAULT 0,
  ban_reason          TEXT,
  last_login_at       TEXT,
  last_login_ip       TEXT,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  browser     TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  location    TEXT    NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT    NOT NULL,
  event       TEXT    NOT NULL,
  ip          TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspace_chapters (
  id                TEXT    PRIMARY KEY,
  series_id         TEXT    NOT NULL,
  episode_number    TEXT    NOT NULL,
  slug              TEXT    UNIQUE,
  original_url      TEXT,
  status            TEXT    NOT NULL DEFAULT 'pending',
  panels_count      INTEGER NOT NULL DEFAULT 0,
  video_url         TEXT,
  job_id            TEXT,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  audio_settings    TEXT,
  project_type      TEXT    NOT NULL DEFAULT 'permanent',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (series_id) REFERENCES platform_series(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_panels (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id         TEXT    NOT NULL,
  panel_index        INTEGER NOT NULL,
  image_url          TEXT    NOT NULL,
  original_url       TEXT,
  speech_text        TEXT    NOT NULL DEFAULT '',
  sfx                TEXT    NOT NULL DEFAULT '',
  duration           REAL,
  motion_type        TEXT,
  visual_description TEXT,
  narrative          TEXT,
  brightness         REAL,
  contrast           REAL,
  saturation         REAL,
  grayscale          INTEGER DEFAULT 0,
  filter_preset      TEXT,
  bubble_method      TEXT,
  detection_style    TEXT,
  bubble_sensitivity REAL    DEFAULT 0.5,
  bubble_dilation    INTEGER DEFAULT 2,
  inpaint_radius     INTEGER DEFAULT 5,
  audio_url          TEXT,
  smart_crop         INTEGER NOT NULL DEFAULT 0,
  crop_padding       INTEGER DEFAULT 0,
  is_sanitized       INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES workspace_chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_edit_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  edited_url   TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  edit_type    TEXT DEFAULT 'edit',
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS creative_youtube_channels (
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
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_youtube_unlinked_channels (
  user_id     TEXT NOT NULL,
  channel_id  TEXT NOT NULL,
  unlinked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_youtube_tokens (
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
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_youtube_profiles (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id              TEXT    NOT NULL,
  name                 TEXT    NOT NULL,
  title_template       TEXT    NOT NULL,
  description_template TEXT    NOT NULL,
  tags                 TEXT    NOT NULL,
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
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS creative_youtube_publications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT    NOT NULL,
  chapter_id      TEXT,
  youtube_url     TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  privacy_status  TEXT    NOT NULL DEFAULT 'unlisted',
  published_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES workspace_chapters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_youtube_credentials (
  user_id         TEXT    PRIMARY KEY,
  client_id       TEXT    NOT NULL,
  client_secret   TEXT    NOT NULL,
  project_id      TEXT    NOT NULL,
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_style_profiles (
  creator_id                TEXT PRIMARY KEY,
  preferred_art_styles      TEXT DEFAULT '[]',
  pacing_bias               TEXT DEFAULT 'balanced',
  dialogue_density_bias     TEXT DEFAULT 'medium',
  favorite_genres           TEXT DEFAULT '[]',
  negative_prompt_additions TEXT DEFAULT '',
  created_at                TEXT DEFAULT (datetime('now')),
  updated_at                TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS creative_agent_runs (
  run_id            TEXT PRIMARY KEY,
  user_id           TEXT,
  status            TEXT NOT NULL,
  progress          INTEGER NOT NULL DEFAULT 0,
  current_action    TEXT NOT NULL DEFAULT '',
  scraped_title     TEXT,
  series_title      TEXT,
  chapter_title     TEXT,
  source_url        TEXT,
  video_format      TEXT DEFAULT 'shorts',
  language          TEXT DEFAULT 'en',
  voice             TEXT DEFAULT 'alloy',
  cover_image       TEXT,
  duration          REAL,
  raw_images_count  INTEGER DEFAULT 0,
  video_filename    TEXT,
  video_url         TEXT,
  youtube_metadata  TEXT DEFAULT '{}',
  youtube_url       TEXT,
  error             TEXT,
  logs              TEXT DEFAULT '[]',
  panels            TEXT DEFAULT '[]',
  created_at        REAL NOT NULL,
  updated_at        REAL NOT NULL
);


CREATE TABLE IF NOT EXISTS platform_series (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  slug        TEXT    UNIQUE,
  author      TEXT    NOT NULL,
  cover_image TEXT,
  genre       TEXT    NOT NULL DEFAULT 'general',
  synopsis    TEXT,
  status      TEXT    NOT NULL DEFAULT 'ready',
  is_flagged  INTEGER NOT NULL DEFAULT 0,
  flag_reason TEXT,
  flagged_by  TEXT,
  flagged_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_jobs (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  project_id    TEXT,
  chapter_id    TEXT,
  type          TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'QUEUED',
  progress      REAL    NOT NULL DEFAULT 0.0,
  stage         TEXT    NOT NULL DEFAULT 'QUEUED',
  result        TEXT,
  error         TEXT,
  metadata      TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  started_at    TEXT,
  completed_at  TEXT,
  cancelled_at  TEXT,
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS platform_scrape_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT    NOT NULL,
  image_urls  TEXT    NOT NULL,
  panel_count INTEGER NOT NULL DEFAULT 0,
  scraped_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_series_cache (
  series_url     TEXT    PRIMARY KEY,
  title          TEXT,
  data_json      TEXT    NOT NULL,
  total_chapters INTEGER DEFAULT 0,
  updated_at     REAL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_system_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  message         TEXT    NOT NULL,
  level           TEXT    NOT NULL,
  module          TEXT    NOT NULL,
  timestamp       TEXT,
  details         TEXT,
  correlation_id  TEXT,
  user_id         TEXT,
  snapshot        TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profile_api_keys (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id      TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  api_key     TEXT    NOT NULL UNIQUE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_invoices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id  TEXT    NOT NULL UNIQUE,
  user_id     TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_credit_transactions (
  id                TEXT    PRIMARY KEY,
  user_id           TEXT    NOT NULL,
  amount            INTEGER NOT NULL,
  feature_name      TEXT    NOT NULL,
  transaction_type  TEXT    DEFAULT 'grant',
  reference_id      TEXT,
  metadata          TEXT    DEFAULT '{}',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intelligence_projects (
  series_id   TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  format_type TEXT    NOT NULL,
  art_style   TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  data_json   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS intelligence_continuity_memory (
  series_id                TEXT PRIMARY KEY,
  active_characters        TEXT,
  world_rules              TEXT,
  lore_revelations         TEXT,
  unresolved_threads       TEXT,
  resolved_threads         TEXT,
  canonical_locations      TEXT,
  total_chapters_generated INTEGER DEFAULT 0,
  last_synced_at           TEXT,
  updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intelligence_feedback_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id    TEXT    UNIQUE,
  series_id      TEXT    NOT NULL,
  chapter_number TEXT,
  panel_index    INTEGER,
  feedback_type  TEXT    NOT NULL,
  user_comment   TEXT,
  applied_fix    TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intelligence_token_usage (
  id                  TEXT    PRIMARY KEY,
  user_id             TEXT,
  project_id          TEXT    NOT NULL,
  chapter_id          TEXT,
  job_id              TEXT,
  model_name          TEXT,
  provider            TEXT,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  REAL    NOT NULL DEFAULT 0.0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intelligence_ledger (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id          TEXT    UNIQUE,
  user_id             TEXT,
  provider            TEXT    NOT NULL,
  model               TEXT    NOT NULL,
  feature             TEXT    NOT NULL,
  prompt_tokens       INTEGER NOT NULL DEFAULT 0,
  completion_tokens   INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  latency_ms          REAL    NOT NULL DEFAULT 0.0,
  cost_estimate_usd   REAL    NOT NULL DEFAULT 0.0,
  status              TEXT    NOT NULL DEFAULT 'SUCCESS',
  created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_moderation_logs_admin_id
  ON admin_moderation_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
  ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id
  ON auth_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_chapters_series_id
  ON workspace_chapters(series_id);

CREATE INDEX IF NOT EXISTS idx_workspace_chapters_slug
  ON workspace_chapters(slug);

CREATE INDEX IF NOT EXISTS idx_image_panels_chapter_id
  ON image_panels(chapter_id);

CREATE INDEX IF NOT EXISTS idx_image_panels_panel_index
  ON image_panels(chapter_id, panel_index);

CREATE INDEX IF NOT EXISTS idx_creative_youtube_publications_user_id
  ON creative_youtube_publications(user_id);

CREATE INDEX IF NOT EXISTS idx_creative_youtube_unlinked_user_id
  ON creative_youtube_unlinked_channels(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_series_user_id
  ON platform_series(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_series_slug
  ON platform_series(slug);

CREATE INDEX IF NOT EXISTS idx_platform_series_status
  ON platform_series(status);

CREATE INDEX IF NOT EXISTS idx_platform_jobs_user_id
  ON platform_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_scrape_sessions_url
  ON platform_scrape_sessions(url);

CREATE INDEX IF NOT EXISTS idx_platform_series_cache_url
  ON platform_series_cache(series_url);

CREATE INDEX IF NOT EXISTS idx_profile_api_keys_user_id
  ON profile_api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_invoices_user_id
  ON profile_invoices(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_jobs_project_id ON platform_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_status ON platform_jobs(status);
CREATE INDEX IF NOT EXISTS idx_creative_youtube_profiles_user ON creative_youtube_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_youtube_publications_user ON creative_youtube_publications(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_youtube_channels_user ON creative_youtube_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_style_profiles_creator ON creative_style_profiles(creator_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_projects_updated ON intelligence_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_token_usage_project_id ON intelligence_token_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_token_usage_user_id ON intelligence_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_ledger_user ON intelligence_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_credit_transactions_user ON profile_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_system_logs_level ON platform_system_logs(level);
CREATE INDEX IF NOT EXISTS idx_platform_system_logs_module ON platform_system_logs(module);

CREATE INDEX IF NOT EXISTS idx_platform_series_created_at ON platform_series(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_series_updated_at ON platform_series(updated_at);
CREATE INDEX IF NOT EXISTS idx_workspace_chapters_created_at ON workspace_chapters(created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_chapters_updated_at ON workspace_chapters(updated_at);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_created_at ON platform_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_jobs_completed_at ON platform_jobs(completed_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_token_usage_created_at ON intelligence_token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_intelligence_ledger_created_at ON intelligence_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_scrape_sessions_scraped_at ON platform_scrape_sessions(scraped_at);
CREATE INDEX IF NOT EXISTS idx_creative_youtube_publications_published_at ON creative_youtube_publications(published_at);
CREATE INDEX IF NOT EXISTS idx_platform_system_logs_created_at ON platform_system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_creative_agent_runs_user_id ON creative_agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_creative_agent_runs_created_at ON creative_agent_runs(created_at DESC);

