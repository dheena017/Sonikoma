-- =============================================================================
-- Webtoon-to-Video — Local SQLite Database Schema
-- =============================================================================
-- This file defines all tables for the local SQLite database.
-- Applied automatically on first run by backend/database/db.ts
-- =============================================================================

-- Stores each webtoon processing project
CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  TEXT    NOT NULL UNIQUE,          -- e.g. "proj_a1b2c3d4"
  url         TEXT    NOT NULL,                 -- original webtoon URL
  title       TEXT    NOT NULL DEFAULT '',      -- parsed comic title
  genre       TEXT    NOT NULL DEFAULT 'general',
  episode     TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  panels_count INTEGER NOT NULL DEFAULT 0,
  video_url   TEXT,                             -- final background video URL
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Stores each individual panel within a project
CREATE TABLE IF NOT EXISTS panels (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id       TEXT    NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  panel_index      INTEGER NOT NULL,            -- position in the storyboard (0-based)
  image_url        TEXT    NOT NULL,            -- cached panel URL
  original_url     TEXT,                        -- original URL before edits
  speech_text      TEXT    NOT NULL DEFAULT '', -- AI-generated subtitle/caption
  sfx              TEXT    NOT NULL DEFAULT '', -- sound effect label e.g. "[Crash]"
  duration         REAL    NOT NULL DEFAULT 4.5,
  motion_type      TEXT    NOT NULL DEFAULT 'zoom_in',
  visual_description TEXT,
  brightness       REAL,
  contrast         REAL,
  saturation       REAL,
  grayscale        INTEGER NOT NULL DEFAULT 0,  -- 0 = false, 1 = true
  filter_preset    TEXT,
  bubble_method    TEXT,
  bubble_sensitivity REAL,
  bubble_dilation  REAL,
  inpaint_radius   INTEGER,
  detection_style  TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stores scraping sessions for history and cache re-use
CREATE TABLE IF NOT EXISTS scrape_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT    NOT NULL,
  image_urls  TEXT    NOT NULL,                 -- JSON array of scraped image URLs
  panel_count INTEGER NOT NULL DEFAULT 0,
  scraped_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Stores edit history for undo operations (persisted across restarts)
CREATE TABLE IF NOT EXISTS edit_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  edited_url   TEXT NOT NULL UNIQUE,            -- the new cached URL after edit
  original_url TEXT NOT NULL,                   -- the URL before the edit
  edit_type    TEXT NOT NULL DEFAULT 'crop',    -- crop | bubble_removal | smart_crop
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_panels_project_id ON panels(project_id);
CREATE INDEX IF NOT EXISTS idx_scrape_url ON scrape_sessions(url);
CREATE INDEX IF NOT EXISTS idx_edit_history_url ON edit_history(edited_url);
