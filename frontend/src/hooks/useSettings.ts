import { useState, useEffect } from "react";
import { AI_MODELS } from "../models";

export function useSettings() {
  const [targetUrl, setTargetUrl] = useState<string>(() => localStorage.getItem('ai_comic_url') || "");
  const [voiceActor, setVoiceActor] = useState<string>(() => localStorage.getItem('ai_comic_voice') || "Standard Comic Narrator (Male)");
  const [musicTheme, setMusicTheme] = useState<string>(() => localStorage.getItem('ai_comic_music') || "Orchestral Battle Theme");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">(() => (localStorage.getItem('ai_comic_aspectRatio') as "9:16" | "16:9") || "9:16");
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ai_comic_model') || AI_MODELS[0].id);
  const [frameRate, setFrameRate] = useState<number>(() => parseInt(localStorage.getItem('ai_comic_fps') || '24'));
  const [volume, setVolume] = useState<number>(() => parseInt(localStorage.getItem('ai_comic_volume') || '80'));
  const [isMuted, setIsMuted] = useState<boolean>(() => localStorage.getItem('ai_comic_muted') === 'true');

  useEffect(() => {
    localStorage.setItem('ai_comic_url', targetUrl);
    localStorage.setItem('ai_comic_voice', voiceActor);
    localStorage.setItem('ai_comic_music', musicTheme);
    localStorage.setItem('ai_comic_aspectRatio', aspectRatio);
    localStorage.setItem('ai_comic_model', selectedModel);
    localStorage.setItem('ai_comic_fps', frameRate.toString());
    localStorage.setItem('ai_comic_volume', volume.toString());
    localStorage.setItem('ai_comic_muted', isMuted.toString());
  }, [targetUrl, voiceActor, musicTheme, aspectRatio, selectedModel, frameRate, volume, isMuted]);

  return {
    targetUrl,
    setTargetUrl,
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  };
}
