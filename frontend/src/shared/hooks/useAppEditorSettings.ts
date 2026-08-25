import { useState, useEffect } from "react";
import {
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
} from "@/features/editor_studio/types/settings";

export function useAppEditorSettings() {
  const [voiceActor, setVoiceActor] = useState<string>(
    () => localStorage.getItem("ai_comic_voice") || DEFAULT_AUDIO_SETTINGS.voiceActor || "en_narrator_1"
  );
  const [musicTheme, setMusicTheme] = useState<string>(
    () => localStorage.getItem("ai_comic_music") || DEFAULT_AUDIO_SETTINGS.musicTheme || "cinematic_action"
  );
  const [aspectRatio, setAspectRatio] = useState<"auto" | "9:16" | "16:9">(
    () =>
      (localStorage.getItem("ai_comic_aspectRatio") as "auto" | "9:16" | "16:9") ||
      (DEFAULT_VIDEO_SETTINGS.aspectRatio as any) ||
      "16:9"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem("ai_comic_model") || "gemini-3.7-flash"
  );
  const [selectedSource, setSelectedSource] = useState<string>(
    () => localStorage.getItem("ai_comic_source") || "webtoons"
  );
  const [frameRate, setFrameRate] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_fps") || String(DEFAULT_VIDEO_SETTINGS.frameRate || 30), 10)
  );
  const [volume, setVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_volume") || String(DEFAULT_AUDIO_SETTINGS.volume || 80), 10)
  );
  const [isMuted, setIsMuted] = useState<boolean>(
    () => localStorage.getItem("ai_comic_muted") === "true"
  );
  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_sfx_volume") || String(DEFAULT_AUDIO_SETTINGS.sfxVolume || 70), 10)
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(
    () => localStorage.getItem("ai_comic_sfx_enabled") !== "false"
  );
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(
    () => localStorage.getItem("app-autoplay-audio") === "true"
  );
  const [narrationVolume, setNarrationVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_narration_volume") || String(DEFAULT_AUDIO_SETTINGS.narrationVolume || 100), 10)
  );
  const [bgmVolume, setBgmVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_bgm_volume") || String(DEFAULT_AUDIO_SETTINGS.bgmVolume || 35), 10)
  );
  const [audioDucking, setAudioDucking] = useState<boolean>(
    () => localStorage.getItem("ai_comic_audio_ducking") !== "false"
  );
  const [speechRate, setSpeechRate] = useState<number>(() =>
    parseFloat(localStorage.getItem("ai_comic_speech_rate") || String(DEFAULT_AUDIO_SETTINGS.speechRate || 1.0))
  );
  const [speechPitch, setSpeechPitch] = useState<number>(() =>
    parseFloat(localStorage.getItem("ai_comic_speech_pitch") || String(DEFAULT_AUDIO_SETTINGS.speechPitch || 1.0))
  );
  const [audioReactiveShake, setAudioReactiveShake] = useState<boolean>(() =>
    localStorage.getItem("ai_video_shake") !== null
      ? localStorage.getItem("ai_video_shake") === "true"
      : Boolean(DEFAULT_VIDEO_SETTINGS.audioReactiveShake)
  );
  const [shakeIntensity, setShakeIntensity] = useState<"low" | "medium" | "high" | "extreme">(
    () => (localStorage.getItem("ai_video_shake_intensity") as any) || "medium"
  );
  const [videoFormat, setVideoFormat] = useState<"mp4" | "webm" | "mkv">(
    () => (localStorage.getItem("ai_video_format") as any) || DEFAULT_VIDEO_SETTINGS.videoFormat || "mp4"
  );
  const [backgroundStyle, setBackgroundStyle] = useState<"black" | "white" | "transparent" | "blurred">(
    () => (localStorage.getItem("ai_video_bg_style") as any) || "black"
  );
  const [subtitlesStyle, setSubtitlesStyle] = useState<"none" | "burn-in" | "soft">(
    () => (localStorage.getItem("ai_video_subtitles_style") as any) || "burn-in"
  );
  const [narrationStyle, setNarrationStyle] = useState<string>(
    () => localStorage.getItem("ai_comic_narration_style") || "long"
  );
  const [smartSlice, setSmartSlice] = useState<boolean>(
    () => localStorage.getItem("ai_comic_smart_slice") !== "false"
  );

  return {
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    selectedSource,
    setSelectedSource,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    sfxVolume,
    setSfxVolume,
    sfxEnabled,
    setSfxEnabled,
    autoPlayAudio,
    setAutoPlayAudio,
    narrationVolume,
    setNarrationVolume,
    bgmVolume,
    setBgmVolume,
    audioDucking,
    setAudioDucking,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    audioReactiveShake,
    setAudioReactiveShake,
    shakeIntensity,
    setShakeIntensity,
    videoFormat,
    setVideoFormat,
    backgroundStyle,
    setBackgroundStyle,
    subtitlesStyle,
    setSubtitlesStyle,
    narrationStyle,
    setNarrationStyle,
    smartSlice,
    setSmartSlice,
  };
}
