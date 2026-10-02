/**
 * Frontend API client for AI Generated Series (/api/v1/ai-series).
 * Provides clean, fully-typed endpoints for projects, sessions, chapters,
 * interactive speech bubbles, character vaults, narrative director, and exports.
 */

import { fetchWithInterceptor } from "@/shared/api/client/fetchWithInterceptor";

export interface CharacterDNA {
  id?: string;
  character_id?: string;
  name: string;
  role: string;
  visual_summary?: string;
  visual_prompt?: string;
  hair_color?: string;
  eye_color?: string;
  clothing_palette?: string;
  signature_traits: string[];
  voice_id?: string;
  gender?: string;
  reference_image_url?: string;
}

export interface InteractivePoint {
  x: number;
  y: number;
}

export interface InteractiveSpeechBubble {
  id?: string;
  bubble_id?: string;
  panel_id?: string;
  speaker_name?: string;
  character_id?: string;
  text: string;
  translated_texts?: Record<string, string>;
  bubble_type?: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  font_family: string;
  font_size: number;
  bg_color: string;
  text_color: string;
  border_color: string;
  border_width?: number;
  tail_tip?: InteractivePoint;
  audio_url?: string;
  duration_seconds?: number;
}

export interface AISeriesPanel {
  id?: string;
  panel_id?: string;
  panel_index: number;
  order_index?: number;
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  camera_angle?: string;
  motion_prompt?: string;
  motion_model?: string;
  video_url?: string;
  audio_url?: string;
  speech_text?: string;
  sound_effects?: string;
  duration?: number;
  speech_bubbles: InteractiveSpeechBubble[];
}

export interface ChapterSession {
  id?: string;
  chapter_id?: string;
  session_number: number;
  chapter_number: number;
  title: string;
  summary?: string;
  pacing_role?: string;
  status: string;
  progress_percent?: number;
  panels: AISeriesPanel[];
  is_series_finale?: boolean;
  guaranteed_resolution_notes?: string;
}

export interface SeriesSession {
  id?: string;
  session_number: number;
  title: string;
  summary?: string;
  total_chapters: number;
  chapters: ChapterSession[];
  status: string;
}

export interface AISeriesProject {
  id?: string;
  series_id: string;
  title: string;
  synopsis?: string;
  logline?: string;
  genre: string;
  format_type: "manhwa" | "comic_manga" | "anime" | string;
  art_style: string;
  cast: CharacterDNA[];
  world_bible: Record<string, any>;
  total_sessions: number;
  chapters_per_session: number;
  panels_per_chapter?: number;
  total_episodes: number;
  pacing: string;
  image_model?: string;
  storyboard_model?: string;
  voice_model?: string;
  sessions: SeriesSession[];
  cover_image_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAISeriesPayload {
  title: string;
  synopsis?: string;
  logline?: string;
  genre?: string;
  format_type: "manhwa" | "comic_manga" | "anime" | string;
  art_style: string;
  image_model?: string;
  storyboard_model?: string;
  voice_model?: string;
  total_sessions: number;
  chapters_per_session: number;
  panels_per_chapter?: number;
  pacing?: string;
  dialogue_density?: string;
  generation_priority?: string;
}

const BASE_URL = "/api/v1/ai-series";

export const aiSeriesApi = {
  // ── Project CRUD ──────────────────────────────────────────
  async listSeries(formatType?: string): Promise<AISeriesProject[]> {
    const url = formatType ? `${BASE_URL}/?format_type=${formatType}` : `${BASE_URL}/`;
    const res = await fetchWithInterceptor(url);
    if (!res.ok) throw new Error("Failed to load AI Generated Series");
    return res.json();
  },

  async createSeries(payload: CreateAISeriesPayload): Promise<AISeriesProject> {
    const res = await fetchWithInterceptor(`${BASE_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let detail = "Failed to create AI Generated Series";
      try {
        const errJson = await res.json();
        if (errJson?.detail) detail = errJson.detail;
      } catch {
        if (res.statusText) detail = `${detail} (${res.status} ${res.statusText})`;
      }
      throw new Error(detail);
    }
    return res.json();
  },

  async getSeries(seriesId: string): Promise<AISeriesProject> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}`);
    if (!res.ok) throw new Error(`Failed to load AI Series ${seriesId}`);
    return res.json();
  },

  async deleteSeries(seriesId: string): Promise<{ status: string; message: string }> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete AI Series");
    return res.json();
  },

  // ── Sessions & Chapters ───────────────────────────────────
  async listSessions(seriesId: string): Promise<SeriesSession[]> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/sessions`);
    if (!res.ok) throw new Error("Failed to load sessions");
    return res.json();
  },

  async getChapter(seriesId: string, sessionNumber: number, chapterNumber: number): Promise<ChapterSession> {
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/sessions/${sessionNumber}/chapters/${chapterNumber}`
    );
    if (!res.ok) throw new Error("Failed to load chapter");
    return res.json();
  },

  async synthesizeChapter(
    seriesId: string,
    sessionNumber: number,
    chapterNumber: number,
    panelCount: number = 8,
    imageModel?: string
  ): Promise<ChapterSession> {
    const modelParam = imageModel ? `&image_model=${encodeURIComponent(imageModel)}` : "";
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/sessions/${sessionNumber}/chapters/${chapterNumber}/synthesize?panel_count=${panelCount}${modelParam}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Failed to generate chapter");
    return res.json();
  },

  // ── Speech Bubbles ────────────────────────────────────────
  async updateSpeechBubble(
    seriesId: string,
    chapterId: string,
    panelId: string,
    bubble: InteractiveSpeechBubble
  ): Promise<any> {
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/chapters/${chapterId}/panels/${panelId}/bubbles`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bubble }),
      }
    );
    if (!res.ok) throw new Error("Failed to update speech bubble");
    return res.json();
  },

  async translateSpeechBubbles(
    seriesId: string,
    chapterId: string,
    panelId: string,
    targetLanguage: string,
    bubbles: InteractiveSpeechBubble[]
  ): Promise<{ target_language: string; translated_bubbles: InteractiveSpeechBubble[] }> {
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/chapters/${chapterId}/panels/${panelId}/bubbles/translate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_language: targetLanguage, bubbles }),
      }
    );
    if (!res.ok) throw new Error("Failed to translate speech bubbles");
    return res.json();
  },

  // ── Character Vault ───────────────────────────────────────
  async getCharacters(seriesId: string): Promise<CharacterDNA[]> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/characters`);
    if (!res.ok) throw new Error("Failed to load character cast");
    return res.json();
  },

  async updateCharacter(seriesId: string, characterId: string, char: CharacterDNA): Promise<CharacterDNA> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/characters/${characterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(char),
    });
    if (!res.ok) throw new Error("Failed to update character");
    return res.json();
  },

  // ── World Building ────────────────────────────────────────
  async getWorld(seriesId: string): Promise<Record<string, any>> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/world`);
    if (!res.ok) throw new Error("Failed to load world bible");
    return res.json();
  },

  async updateWorld(seriesId: string, worldBible: Record<string, any>): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/world`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ world_bible: worldBible }),
    });
    if (!res.ok) throw new Error("Failed to update world bible");
    return res.json();
  },

  // ── Narrative Arc & Epilogue Audit ────────────────────────
  async getTimeline(seriesId: string): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/timeline`);
    if (!res.ok) throw new Error("Failed to load story timeline");
    return res.json();
  },

  async getEpilogueAudit(seriesId: string): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/epilogue-audit`);
    if (!res.ok) throw new Error("Failed to load epilogue audit");
    return res.json();
  },

  // ── Audio Dubbing ─────────────────────────────────────────
  async listAvailableVoices(seriesId: string): Promise<any[]> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/dubbing/available-voices`);
    if (!res.ok) throw new Error("Failed to load voices");
    return res.json();
  },

  async synthesizeVoice(seriesId: string, payload: any): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/dubbing/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to synthesize voice track");
    return res.json();
  },

  async synthesizeChapterAudio(
    seriesId: string,
    sessionNumber: number,
    chapterNumber: number,
    voiceOverride?: string
  ): Promise<ChapterSession> {
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/chapters/${sessionNumber}/${chapterNumber}/synthesize-audio`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_override: voiceOverride || null }),
      }
    );
    if (!res.ok) throw new Error("Failed to synthesize chapter audio");
    return res.json();
  },

  // ── Image Rendering & Local Caching ───────────────────────
  async renderChapterImages(
    seriesId: string,
    sessionNumber: number,
    chapterNumber: number,
    imageModel: string = "flux-anime",
    force: boolean = false
  ): Promise<ChapterSession> {
    const q = new URLSearchParams({ image_model: imageModel, force: String(force) });
    const res = await fetchWithInterceptor(
      `${BASE_URL}/${seriesId}/sessions/${sessionNumber}/chapters/${chapterNumber}/render-images?${q.toString()}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Failed to batch render chapter images");
    return res.json();
  },

  async renderPanelImage(
    seriesId: string,
    panelId: string,
    payload: { prompt?: string; image_model?: string; session_number: number; chapter_number: number }
  ): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/panels/${panelId}/render-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel_id: panelId, ...payload }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || `Failed to render panel image (${res.status})`);
    }
    return res.json();
  },


  // ── Visual FX & Motion ────────────────────────────────────
  async listMotionPresets(): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/presets`);
    if (!res.ok) throw new Error("Failed to load motion presets");
    return res.json();
  },

  async generateMotion(seriesId: string, payload: any): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/vfx/generate-motion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate kinetic video motion");
    return res.json();
  },

  // ── Memory & Learning ─────────────────────────────────────
  async getCreatorStyle(): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/creator-style`);
    if (!res.ok) throw new Error("Failed to load creator style");
    return res.json();
  },

  async logFeedback(event: any): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return res.json();
  },

  // ── Export Master ─────────────────────────────────────────
  async exportChapter(seriesId: string, payload: any): Promise<any> {
    const res = await fetchWithInterceptor(`${BASE_URL}/${seriesId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to compile export deliverable");
    return res.json();
  },

  // ── AI Arc Director Skills ─────────────────────────────────
  async directSeriesArc(payload: {
    title: string;
    logline?: string;
    genre?: string;
    format_type?: string;
    art_style?: string;
    total_sessions?: number;
    chapters_per_session?: number;
    panels_per_chapter?: number;
    pacing?: string;
    dialogue_density?: string;
    model?: string;
  }): Promise<any> {
    const res = await fetchWithInterceptor("/api/v1/ai/skills/series-arc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to direct series arc with AI skill");
    return res.json();
  },
};
