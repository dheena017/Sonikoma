import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { GeneratedPanel } from "@/types";
import {
  setEngineVolume,
  startAmbientBackgroundMusic,
  stopAmbientBackgroundMusic,
  playComicSoundEffect,
} from "@/shared/utils/audio";
import { matchVoice, parseVoiceCharacteristics } from "@/shared/utils/voiceMatcher";

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export interface UsePlaybackEngineProps {
  panels: GeneratedPanel[];
  volume: number;
  isMuted: boolean;
  musicTheme: string;
  voiceActor: string;
  autoPlayAudio: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  bgmVolume?: number;
  audioDucking?: boolean;
  activePreviewTab?: "video" | "timeline";
  videoPlayerRef?: React.RefObject<HTMLVideoElement | null>;
}

export function usePlaybackEngine({
  panels,
  volume,
  isMuted,
  musicTheme,
  voiceActor,
  autoPlayAudio,
  sfxEnabled,
  sfxVolume,
  bgmVolume = 50,
  audioDucking = true,
  activePreviewTab = "timeline",
}: UsePlaybackEngineProps) {
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  const speakDialogue = useCallback(
    (text?: string, panelDuration?: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis || isMuted || !text?.trim()) {
        return;
      }
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
        const selectedVoice = matchVoice(voices, voiceActor);

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          const { targetFullLang } = parseVoiceCharacteristics(voiceActor);
          utterance.lang = targetFullLang;
        }
        utterance.volume = volume / 100;

        if (panelDuration && panelDuration > 0) {
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          let targetRate = (words / 2.2) / panelDuration;
          utterance.rate = Math.max(0.6, Math.min(targetRate, 2.2));
        } else {
          utterance.rate = 0.95;
        }

        window.speechSynthesis.speak(utterance);
      }, 0);
    },
    [isMuted, voiceActor, volume]
  );

  const playStoryboardAudio = useCallback(
    (panelIdx: number, forcePlay = false) => {
      const activePanel = panels[panelIdx];
      if (!activePanel) return;

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (!autoPlayAudio && !forcePlay) return;

      const shouldPlayAudio = Boolean(activePanel.audio_url) && !isMuted;
      const shouldSpeak = !isMuted || !activePanel.audio_url;

      if (shouldPlayAudio && activePanel.audio_url) {
        const audio = new Audio(activePanel.audio_url);
        audio.volume = volume / 100;
        activeAudioRef.current = audio;
        audio.play().catch(() => {
          speakDialogue(activePanel.speech_text, activePanel.duration);
        });
      } else if (shouldSpeak && activePanel.speech_text) {
        speakDialogue(activePanel.speech_text, activePanel.duration);
      }

      if (activePanel.sfx && !isMuted && sfxEnabled) {
        playComicSoundEffect(activePanel.sfx, sfxVolume / 100);
      }
    },
    [panels, speakDialogue, isMuted, volume, autoPlayAudio, sfxEnabled, sfxVolume]
  );

  useEffect(() => {
    setEngineVolume(volume, isMuted);
  }, [volume, isMuted]);

  useEffect(() => {
    if (storyboardPlaying) {
      startAmbientBackgroundMusic(musicTheme, volume, isMuted, bgmVolume, audioDucking);
    } else {
      stopAmbientBackgroundMusic();
    }
    return () => {
      stopAmbientBackgroundMusic();
    };
  }, [storyboardPlaying, musicTheme, volume, bgmVolume, audioDucking, isMuted]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("storyboard-time-update", { detail: playbackTime }));
    }
  }, [playbackTime]);

  useEffect(() => {
    if (storyboardPlaying && panels.length > 0 && activePreviewTab !== "video") {
      const activePanel = panels[currentPanelIndex];
      const duration = activePanel?.duration || 3.0;

      playTimerRef.current = setTimeout(() => {
        setPlaybackTime((prev) => {
          const nextTime = parseFloat((prev + 0.1).toFixed(1));
          if (nextTime >= duration) {
            if (currentPanelIndex < panels.length - 1) {
              const nextIdx = currentPanelIndex + 1;
              setCurrentPanelIndex(nextIdx);
              playStoryboardAudio(nextIdx, true);
              return 0;
            } else {
              setStoryboardPlaying(false);
              return 0;
            }
          }
          return nextTime;
        });
      }, 100);
    }

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, [storyboardPlaying, currentPanelIndex, panels, activePreviewTab, playStoryboardAudio]);

  const toggleStoryboardPlayback = useCallback(() => {
    setStoryboardPlaying((prev) => {
      const next = !prev;
      if (next) {
        playStoryboardAudio(currentPanelIndex, true);
      } else {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
        }
      }
      return next;
    });
  }, [currentPanelIndex, playStoryboardAudio]);

  const resetStoryboardPlayback = useCallback(() => {
    setStoryboardPlaying(false);
    setCurrentPanelIndex(0);
    setPlaybackTime(0);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
  }, []);

  return {
    currentPanelIndex,
    setCurrentPanelIndex,
    playbackTime,
    setPlaybackTime,
    storyboardPlaying,
    setStoryboardPlaying,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    playStoryboardAudio,
  };
}
