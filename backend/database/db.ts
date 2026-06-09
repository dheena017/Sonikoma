/**
 * backend/database/db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Local SQLite database singleton for Webtoon-to-Video.
 * Uses better-sqlite3 (synchronous, zero-config, file-based).
 *
 * The database file is stored at:  backend/database/webtoon_local.db
 * The schema is applied on first connection from: backend/database/schema.sql
 *
 * Usage:
 *   import { db } from './database/db';
 *   const rows = db.prepare('SELECT * FROM projects').all();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ── File paths ────────────────────────────────────────────────────────────────
// Use process.cwd() base so this works under both tsx (CJS shim) and ESM
const DB_DIR = path.resolve(process.cwd(), "backend", "database");
const DB_PATH = path.join(DB_DIR, "webtoon_local.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

// ── Create & open the database ────────────────────────────────────────────────
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  console.log(`[DB] Opening local SQLite database at: ${DB_PATH}`);
  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Apply schema on first run (idempotent — uses IF NOT EXISTS)
  if (fs.existsSync(SCHEMA_PATH)) {
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    _db.exec(schema);
    console.log("[DB] Schema applied successfully.");
  } else {
    console.warn("[DB] schema.sql not found — skipping schema apply.");
  }

  console.log("[DB] SQLite database ready ✓");
  return _db;
}

// Convenience singleton export
export const db = getDb();

// ── Typed helpers ─────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  project_id: string;
  url: string;
  title: string;
  genre: string;
  episode: string;
  status: "pending" | "processing" | "completed" | "failed";
  panels_count: number;
  video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Panel {
  id: number;
  project_id: string;
  panel_index: number;
  image_url: string;
  original_url: string | null;
  speech_text: string;
  sfx: string;
  duration: number;
  motion_type: string;
  visual_description: string | null;
  brightness: number | null;
  contrast: number | null;
  saturation: number | null;
  grayscale: number;
  filter_preset: string | null;
  bubble_method: string | null;
  bubble_sensitivity: number | null;
  bubble_dilation: number | null;
  inpaint_radius: number | null;
  detection_style: string | null;
  created_at: string;
}

export interface ScrapeSession {
  id: number;
  url: string;
  image_urls: string; // JSON string — parse with JSON.parse()
  panel_count: number;
  scraped_at: string;
}

export interface EditHistoryEntry {
  id: number;
  edited_url: string;
  original_url: string;
  edit_type: string;
  created_at: string;
}

// ── DB Query Helpers ──────────────────────────────────────────────────────────

/** Insert a new project row. Returns the inserted row's id. */
export function insertProject(
  data: Omit<Project, "id" | "created_at" | "updated_at">
): number {
  const stmt = db.prepare(`
    INSERT INTO projects (project_id, url, title, genre, episode, status, panels_count, video_url)
    VALUES (@project_id, @url, @title, @genre, @episode, @status, @panels_count, @video_url)
  `);
  const result = stmt.run(data);
  return result.lastInsertRowid as number;
}

/** Get all projects ordered by most recent first. */
export function getAllProjects(): Project[] {
  return db
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as Project[];
}

/** Get a single project by its project_id. */
export function getProject(project_id: string): Project | undefined {
  return db
    .prepare("SELECT * FROM projects WHERE project_id = ?")
    .get(project_id) as Project | undefined;
}

/** Update a project's status and panels_count. */
export function updateProject(
  project_id: string,
  updates: Partial<Pick<Project, "status" | "panels_count" | "video_url">>
): void {
  db.prepare(
    `
    UPDATE projects
    SET status = COALESCE(@status, status),
        panels_count = COALESCE(@panels_count, panels_count),
        video_url = COALESCE(@video_url, video_url),
        updated_at = datetime('now')
    WHERE project_id = @project_id
  `
  ).run({ project_id, ...updates });
}

/** Delete a project and all its panels (CASCADE). */
export function deleteProject(project_id: string): void {
  db.prepare("DELETE FROM projects WHERE project_id = ?").run(project_id);
}

/** Insert a panel for a project. */
export function insertPanel(data: Omit<Panel, "id" | "created_at">): number {
  const stmt = db.prepare(`
    INSERT INTO panels (
      project_id, panel_index, image_url, original_url, speech_text, sfx,
      duration, motion_type, visual_description, brightness, contrast, saturation,
      grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
      inpaint_radius, detection_style
    ) VALUES (
      @project_id, @panel_index, @image_url, @original_url, @speech_text, @sfx,
      @duration, @motion_type, @visual_description, @brightness, @contrast, @saturation,
      @grayscale, @filter_preset, @bubble_method, @bubble_sensitivity, @bubble_dilation,
      @inpaint_radius, @detection_style
    )
  `);
  const result = stmt.run(data);
  return result.lastInsertRowid as number;
}

/** Get all panels for a project, ordered by panel_index. */
export function getPanels(project_id: string): Panel[] {
  return db
    .prepare(
      "SELECT * FROM panels WHERE project_id = ? ORDER BY panel_index ASC"
    )
    .all(project_id) as Panel[];
}

/** Save a scrape session result. */
export function saveScrapeSession(url: string, imageUrls: string[]): number {
  const stmt = db.prepare(`
    INSERT INTO scrape_sessions (url, image_urls, panel_count)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(url, JSON.stringify(imageUrls), imageUrls.length);
  return result.lastInsertRowid as number;
}

/** Get the latest scrape session for a URL (for cache re-use). */
export function getLatestScrapeSession(url: string): ScrapeSession | undefined {
  return db
    .prepare(
      `
    SELECT * FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1
  `
    )
    .get(url) as ScrapeSession | undefined;
}

/** Persist an edit history entry (for undo support across restarts). */
export function saveEditHistory(
  editedUrl: string,
  originalUrl: string,
  editType = "crop"
): void {
  db.prepare(
    `
    INSERT OR REPLACE INTO edit_history (edited_url, original_url, edit_type)
    VALUES (?, ?, ?)
  `
  ).run(editedUrl, originalUrl, editType);
}

/** Get the previous URL before an edit (for undo). */
export function getEditHistory(
  editedUrl: string
): EditHistoryEntry | undefined {
  return db
    .prepare("SELECT * FROM edit_history WHERE edited_url = ?")
    .get(editedUrl) as EditHistoryEntry | undefined;
}

/** Get database statistics for the health check endpoint. */
export function getDbStats(): {
  projects: number;
  panels: number;
  sessions: number;
} {
  const projects = (
    db.prepare("SELECT COUNT(*) as c FROM projects").get() as any
  ).c;
  const panels = (db.prepare("SELECT COUNT(*) as c FROM panels").get() as any)
    .c;
  const sessions = (
    db.prepare("SELECT COUNT(*) as c FROM scrape_sessions").get() as any
  ).c;
  return { projects, panels, sessions };
}
