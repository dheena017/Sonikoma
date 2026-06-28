export const SKILL_ENDPOINTS = {
  TRANSLATE: "/api/skills/translate",
  DRAMATIZE: "/api/skills/dramatize",
  SEO: "/api/skills/seo",
  CLIFFHANGER: "/api/skills/cliffhanger",
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
  OUTRO_CTA: "/api/skills/outro-cta",
  COMMENT_REPLY: "/api/skills/comment-reply",
};

export const runSkill = async (
  fetchWithInterceptor: any,
  endpoint: string,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });

  return res.json();
};

export const getVoices = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/audio/voices");
  return res.json();
};

export const generateAudio = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/audio/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
};

// Dedicated skill functions to avoid hardcoded paths in components
export const runBgmVibeSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.BGM_VIBE, data);
export const runSfxMixSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SFX_MIX, data);
export const runCopyrightScrubBatchSkill = (
  fetchWithInterceptor: any,
  data: any
) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COPYRIGHT_SCRUB_BATCH, data);
export const runThumbnailVisualSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_VISUAL, data);
export const runThumbnailLayoutSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL_LAYOUT, data);
export const runThumbnailSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.THUMBNAIL, data);
export const runDramatizeSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.DRAMATIZE, data);
export const runVoiceCastSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.VOICE_CAST, data);
export const runCliffhangerSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.CLIFFHANGER, data);
export const runOutroCtaSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.OUTRO_CTA, data);
export const runCommentReplySkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COMMENT_REPLY, data);
export const runSeoSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SEO, data);
export const runShortsScriptSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_SCRIPT, data);
export const runShortsHookSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SHORTS_HOOK, data);
export const runCharacterBioSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.CHARACTER_BIO, data);
export const runTitleAbSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TITLE_AB, data);
export const runTranslateSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TRANSLATE, data);
export const runCopyrightScrubSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.COPYRIGHT_SCRUB, data);
export const runSfxAudioSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SFX_AUDIO, data);
export const runPacingSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.PACING, data);
export const runTransitionSpeedSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.TRANSITION_SPEED, data);
export const runCameraShakeSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.CAMERA_SHAKE, data);
export const runSceneCompositionSkill = (
  fetchWithInterceptor: any,
  data: any
) => runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SCENE_COMPOSITION, data);
export const runSubtitleStylerSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.SUBTITLE_STYLER, data);
export const runMidrollsSkill = (fetchWithInterceptor: any, data: any) =>
  runSkill(fetchWithInterceptor, SKILL_ENDPOINTS.MIDROLLS, data);
