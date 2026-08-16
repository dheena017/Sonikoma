import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export const SKILL_ENDPOINTS = {
  TRANSLATE: "/api/skills/translate",
  DRAMATIZE: "/api/skills/dramatize",
  SEO: "/api/skills/seo",
  VOICE_CAST: "/api/skills/voice-cast",
  COPYRIGHT_SCRUB: "/api/skills/copyright-scrub",
  BGM_VIBE: "/api/skills/bgm-vibe",
  SFX_MIX: "/api/skills/sfx-mix",
  SFX_AUDIO: "/api/skills/sfx-audio",
  THUMBNAIL_VISUAL: "/api/skills/thumbnail-visual",
  THUMBNAIL_LAYOUT: "/api/skills/thumbnail-layout",
  THUMBNAIL: "/api/skills/thumbnail",
  MIDROLLS: "/api/skills/midrolls",
  SHORTS_SCRIPT: "/api/skills/shorts-script",
  SHORTS_HOOK: "/api/skills/shorts-hook",
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

export const alignDialogue = async (
  fetchWithInterceptor: FetchClient,
  panelId: string,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/audio/align-dialogue/${panelId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
};

export const getVoices = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/audio/voices");
};

export const generateAudio = async (
  fetchWithInterceptor: FetchClient,
  data: any
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/audio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
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
