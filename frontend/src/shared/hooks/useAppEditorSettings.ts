import { useState, useEffect } from "react";
import {
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
} from "@/features/editor_studio/types/settings";

export function useAppEditorSettings() {
  const [voiceActor, setVoiceActor] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("global_audio_settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.voiceActor && parsed.voiceActor !== "en_narrator_1" && parsed.voiceActor !== "Epic Trailer Narrator") {
          return parsed.voiceActor;
        }
      }
    } catch {}
    const direct =
      localStorage.getItem("ai_comic_voice") ||
      localStorage.getItem("ai_comic_voice_actor") ||
      localStorage.getItem("ai_comic_narrator_voice");
    if (direct && direct !== "en_narrator_1" && direct !== "Epic Trailer Narrator") {
      return direct;
    }
    return DEFAULT_AUDIO_SETTINGS.voiceActor || "en-US-ChristopherNeural";
  });

  const [musicTheme, setMusicTheme] = useState<string>(
    () => localStorage.getItem("ai_comic_music") || DEFAULT_AUDIO_SETTINGS.musicTheme || ""
  );
  const [aspectRatio, setAspectRatio] = useState<"auto" | "9:16" | "16:9">(
    () =>
      (localStorage.getItem("ai_comic_aspectRatio") as "auto" | "9:16" | "16:9") ||
      (DEFAULT_VIDEO_SETTINGS.aspectRatio as any) ||
      "16:9"
  );
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const direct = localStorage.getItem("ai_comic_model");
    if (direct) return direct;
    try {
      const customRouting = localStorage.getItem("sonikoma_ai_routing_custom");
      if (customRouting) {
        const parsed = JSON.parse(customRouting);
        if (Array.isArray(parsed)) {
          const panelRoute = parsed.find((r: any) => r.task === "panel_analysis" || r.task === "storyboard_narrative");
          if (panelRoute?.primary_model) return panelRoute.primary_model;
        }
      }
    } catch {}
    return "gemini-2.0-flash";
  });

  useEffect(() => {
    const handleModelChanged = (e: any) => {
      if (e.detail?.model) {
        setSelectedModel(e.detail.model);
      }
    };
    window.addEventListener("ai-model-changed", handleModelChanged);
    return () => window.removeEventListener("ai-model-changed", handleModelChanged);
  }, []);
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
  const [enableDialogueAudio, setEnableDialogueAudio] = useState<boolean>(
    () => localStorage.getItem("ai_comic_enable_dialogue_audio") === "true" // Default: OFF
  );
  const [enableNarrativeAudio, setEnableNarrativeAudio] = useState<boolean>(
    () => localStorage.getItem("ai_comic_enable_narrative_audio") !== "false" // Default: ON (narratives one)
  );

  useEffect(() => {
    localStorage.setItem("ai_comic_enable_dialogue_audio", String(enableDialogueAudio));
  }, [enableDialogueAudio]);

  useEffect(() => {
    localStorage.setItem("ai_comic_enable_narrative_audio", String(enableNarrativeAudio));
  }, [enableNarrativeAudio]);
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

  // Auto-persist audio & speech configuration
  useEffect(() => {
    if (voiceActor) {
      localStorage.setItem("ai_comic_voice", voiceActor);
      localStorage.setItem("ai_comic_voice_actor", voiceActor);
      localStorage.setItem("ai_comic_narrator_voice", voiceActor);
      try {
        const raw = localStorage.getItem("global_audio_settings");
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.voiceActor = voiceActor;
        parsed.narratorVoice = voiceActor;
        localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
      } catch {}
    }
  }, [voiceActor]);

  useEffect(() => {
    if (musicTheme) {
      localStorage.setItem("ai_comic_music", musicTheme);
      try {
        const raw = localStorage.getItem("global_audio_settings");
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.musicTheme = musicTheme;
        localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
      } catch {}
    }
  }, [musicTheme]);

  useEffect(() => {
    localStorage.setItem("ai_comic_volume", String(volume));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.volume = volume;
      parsed.masterVolume = volume;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_narration_volume", String(narrationVolume));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.narrationVolume = narrationVolume;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [narrationVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_bgm_volume", String(bgmVolume));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.bgmVolume = bgmVolume;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [bgmVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_sfx_volume", String(sfxVolume));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.sfxVolume = sfxVolume;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [sfxVolume]);

  useEffect(() => {
    localStorage.setItem("ai_comic_speech_rate", String(speechRate));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.speechRate = speechRate;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem("ai_comic_speech_pitch", String(speechPitch));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.speechPitch = speechPitch;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [speechPitch]);

  useEffect(() => {
    localStorage.setItem("ai_comic_audio_ducking", String(audioDucking));
    try {
      const raw = localStorage.getItem("global_audio_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      parsed.audioDucking = audioDucking;
      localStorage.setItem("global_audio_settings", JSON.stringify(parsed));
    } catch {}
  }, [audioDucking]);

  useEffect(() => {
    localStorage.setItem("ai_comic_aspectRatio", aspectRatio);
  }, [aspectRatio]);

  useEffect(() => {
    localStorage.setItem("ai_comic_fps", String(frameRate));
  }, [frameRate]);

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
    enableDialogueAudio,
    setEnableDialogueAudio,
    enableNarrativeAudio,
    setEnableNarrativeAudio,
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
