import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export const SKILL_ENDPOINTS = {
  TRANSLATE: "/api/v1/ai/skills/translate",
  DRAMATIZE: "/api/v1/ai/skills/dramatize",
  SEO: "/api/v1/ai/skills/seo",
  VOICE_CAST: "/api/v1/ai/skills/voice-cast",
  COPYRIGHT_SCRUB: "/api/v1/ai/skills/copyright-scrub",
  BGM_VIBE: "/api/v1/ai/skills/bgm-vibe",
  SFX_MIX: "/api/v1/ai/skills/sfx-mix",
  SFX_AUDIO: "/api/v1/ai/skills/sfx-audio",
  THUMBNAIL_VISUAL: "/api/v1/ai/skills/thumbnail-visual",
  THUMBNAIL_LAYOUT: "/api/v1/ai/skills/thumbnail-layout",
  THUMBNAIL: "/api/v1/ai/skills/thumbnail",
  MIDROLLS: "/api/v1/ai/skills/midrolls",
  SHORTS_SCRIPT: "/api/v1/ai/skills/shorts-script",
  SHORTS_HOOK: "/api/v1/ai/skills/shorts-hook",
};

export const runSkill = async (
  fetchWithInterceptor: FetchClient,
  endpoint: string,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });
};

const truncateText = (text: string, maxLength = 160) => {
  if (typeof text !== "string") return text;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}… [${text.length} chars]`;
};

const summarizeAudioValue = (value: any, depth = 0): any => {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    if (value.startsWith("data:audio/") || value.includes("audio_base64")) {
      return `[audio payload: ${value.length} chars]`;
    }
    return truncateText(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const nextItems = value.slice(0, 5).map((item) => summarizeAudioValue(item, depth + 1));
    return value.length > 5 ? { length: value.length, preview: nextItems } : nextItems;
  }

  if (typeof value === "object") {
    const summary: Record<string, any> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "audio_base64" || key === "base64") {
        summary[key] = `[audio payload: ${String(nestedValue).length} chars]`;
        continue;
      }

      if (key === "audio_url" || key === "narrative_audio_url") {
        const url = typeof nestedValue === "string" ? nestedValue : "";
        summary[key] = url ? `${url.slice(0, 90)}${url.length > 90 ? "…" : ""}` : null;
        continue;
      }

      if (key === "text" || key === "dialogue" || key === "script" || key === "prompt") {
        summary[key] = truncateText(String(nestedValue));
        continue;
      }

      if (key === "panels" && Array.isArray(nestedValue)) {
        summary[key] = {
          count: nestedValue.length,
          preview: nestedValue.slice(0, 3).map((panel) => summarizeAudioValue(panel, depth + 1)),
        };
        continue;
      }

      if (key === "results" && Array.isArray(nestedValue)) {
        summary[key] = {
          count: nestedValue.length,
          preview: nestedValue.slice(0, 3).map((result) => summarizeAudioValue(result, depth + 1)),
        };
        continue;
      }

      if (depth > 2) {
        continue;
      }

      summary[key] = summarizeAudioValue(nestedValue, depth + 1);
    }

    return summary;
  }

  return value;
};

const buildAudioLogSummary = (label: string, payload: any) => {
  const summary = summarizeAudioValue(payload);

  if (!summary || typeof summary !== "object") {
    return { [label]: summary };
  }

  const derived: Record<string, any> = {};

  if (Array.isArray(summary)) {
    derived[label] = summary;
    return derived;
  }

  const keys = Object.keys(summary);
  if (keys.includes("voice") || keys.includes("panel_id") || keys.includes("id") || keys.includes("panels") || keys.includes("results")) {
    derived[label] = summary;
    return derived;
  }

  derived[label] = summary;
  return derived;
};

export const logAudioEndpoint = (
  method: string,
  endpoint: string,
  input: any,
  output?: any,
  startedAt?: number,
  error?: unknown
) => {
  const elapsed = startedAt ? ` (${Math.round(performance.now() - startedAt)}ms)` : "";
  const prefix = `[Audio Endpoint] ${method} ${endpoint}`;

  if (error) {
    console.error(`${prefix} error${elapsed}:`, {
      request: buildAudioLogSummary("input", input),
      error,
    });
    return;
  }

  console.log(`${prefix} input:`, buildAudioLogSummary("input", input));
  console.log(`${prefix} output${elapsed}:`, buildAudioLogSummary("output", output));
};

export const alignDialogue = async (
  fetchWithInterceptor: FetchClient,
  panelId: string,
  data: any
): Promise<ApiResponse<any>> => {
  const endpoint = `/api/v1/audio/synchronize-dialogue/${panelId}`;
  const startedAt = performance.now();
  try {
    const response = await apiRequest(fetchWithInterceptor, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    logAudioEndpoint("POST", endpoint, data, response, startedAt);
    return response;
  } catch (error) {
    logAudioEndpoint("POST", endpoint, data, undefined, startedAt, error);
    throw error;
  }
};

export const getVoices = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  const endpoint = "/api/v1/audio/list-tts-voices";
  const startedAt = performance.now();
  try {
    const response = await apiRequest(fetchWithInterceptor, endpoint);
    logAudioEndpoint("GET", endpoint, null, response, startedAt);
    return response;
  } catch (error) {
    logAudioEndpoint("GET", endpoint, null, undefined, startedAt, error);
    throw error;
  }
};

export const generateAudio = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  const endpoint = "/api/v1/audio/synthesize-panel-audio";
  const startedAt = performance.now();
  try {
    const response = await apiRequest(fetchWithInterceptor, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    logAudioEndpoint("POST", endpoint, data, response, startedAt);
    return response;
  } catch (error) {
    logAudioEndpoint("POST", endpoint, data, undefined, startedAt, error);
    throw error;
  }
};

export const batchGenerateAudio = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const endpoint = "/api/v1/audio/synthesize-all-panel-audio";
  const startedAt = performance.now();
  try {
    const response = await apiRequest(fetchWithInterceptor, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    logAudioEndpoint("POST", endpoint, data, response, startedAt);
    return response;
  } catch (error) {
    logAudioEndpoint("POST", endpoint, data, undefined, startedAt, error);
    throw error;
  }
};

// Dedicated skill functions to avoid hardcoded paths in components
export const runBgmVibeSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.BGM_VIBE, data);
export const runSfxMixSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SFX_MIX, data);
export const runThumbnailVisualSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_VISUAL, data);
export const runThumbnailLayoutSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_LAYOUT, data);
export const runThumbnailSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL, data);
export const runDramatizeSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.DRAMATIZE, data);
export const runVoiceCastSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.VOICE_CAST, data);
export const runSeoSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SEO, data);
export const runShortsScriptSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_SCRIPT, data);
export const runShortsHookSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_HOOK, data);
export const runTranslateSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TRANSLATE, data);
export const runCopyrightScrubSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COPYRIGHT_SCRUB, data);
export const runSfxAudioSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SFX_AUDIO, data);
export const runMidrollsSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.MIDROLLS, data);
