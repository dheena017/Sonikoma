import { apiRequest } from "./request";
import { FetchClient, ApiResponse } from "./types";

export const SKILL_ENDPOINTS = {
  TRANSLATE: "/api/skills/translate",
  DRAMATIZE: "/api/skills/dramatize",
  SEO: "/api/skills/seo",
  VOICE_CAST: "/api/skills/voice-cast",
  COPYRIGHT_SCRUB: "/api/skills/copyright-scrub",
  COPYRIGHT_SCRUB_BATCH: "/api/skills/copyright-scrub-batch",
  BGM_VIBE: "/api/skills/bgm-vibe",
  SFX_MIX: "/api/skills/sfx-mix",
  SFX_AUDIO: "/api/skills/sfx-audio",
  THUMBNAIL_VISUAL: "/api/skills/thumbnail-visual",
  THUMBNAIL_LAYOUT: "/api/skills/thumbnail-layout",
  THUMBNAIL: "/api/skills/thumbnail",
  PACING: "/api/skills/pacing",
  TRANSITION_SPEED: "/api/skills/transition-speed",
  CAMERA_SHAKE: "/api/skills/camera-shake",
  SCENE_COMPOSITION: "/api/skills/scene-composition",
  SUBTITLE_STYLER: "/api/skills/subtitle-styler",
  MIDROLLS: "/api/skills/midrolls",
  SHORTS_SCRIPT: "/api/skills/shorts-script",
  SHORTS_HOOK: "/api/skills/shorts-hook",
  CHARACTER_BIO: "/api/skills/character-bio",
  TITLE_AB: "/api/skills/title-ab",
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
  return apiRequest(fetchWithInterceptor, `/api/audio/align-dialogue/${panelId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
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
export const runCopyrightScrubBatchSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COPYRIGHT_SCRUB_BATCH, data);
export const runThumbnailVisualSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_VISUAL, data);
export const runThumbnailLayoutSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_LAYOUT, data);
export const runThumbnailSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL, data);
export const runDramatizeSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.DRAMATIZE, data);
export const runVoiceCastSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.VOICE_CAST, data);
export const runSeoSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SEO, data);
export const runShortsScriptSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_SCRIPT, data);
export const runShortsHookSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_HOOK, data);
export const runCharacterBioSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.CHARACTER_BIO, data);
export const runTitleAbSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TITLE_AB, data);
export const runTranslateSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TRANSLATE, data);
export const runCopyrightScrubSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COPYRIGHT_SCRUB, data);
export const runSfxAudioSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SFX_AUDIO, data);
export const runPacingSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.PACING, data);
export const runTransitionSpeedSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TRANSITION_SPEED, data);
export const runCameraShakeSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.CAMERA_SHAKE, data);
export const runSceneCompositionSkill = (
  fetchWithInterceptor: FetchClient,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SCENE_COMPOSITION, data);
export const runSubtitleStylerSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SUBTITLE_STYLER, data);
export const runMidrollsSkill = (fetchWithInterceptor: FetchClient, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.MIDROLLS, data);
