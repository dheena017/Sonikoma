import { useState, useRef, useEffect, useCallback } from "react";
import { GeneratedPanel } from "../types";
import {
  setEngineVolume,
  startAmbientBackgroundMusic,
  stopAmbientBackgroundMusic,
  playComicSoundEffect,
} from "../audio";

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

interface UsePlaybackEngineProps {
  panels: GeneratedPanel[];
  volume: number;
  isMuted: boolean;
  musicTheme: string;
  voiceActor: string;
}

export function usePlaybackEngine({
  panels,
  volume,
  isMuted,
  musicTheme,
  voiceActor,
}: UsePlaybackEngineProps) {
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<any>(null);

  const speakDialogue = useCallback(
    (text: string, panelDuration?: number) => {
      if (!window.speechSynthesis || isMuted) return;
      window.speechSynthesis.cancel();

      if (!text || !text.trim()) return;

      // Wrap voice querying and speech trigger in a non-blocking timeout
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices =
          cachedVoices.length > 0
            ? cachedVoices
            : window.speechSynthesis.getVoices();

        let selectedVoice = null;
        if (
          voiceActor.toLowerCase().includes("sultry") ||
          voiceActor.toLowerCase().includes("female")
        ) {
          selectedVoice = voices.find(
            (v) =>
              v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("samantha")
          );
        } else {
          selectedVoice = voices.find(
            (v) =>
              v.name.toLowerCase().includes("male") ||
              v.name.toLowerCase().includes("david") ||
              v.name.toLowerCase().includes("premium")
          );
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.volume = volume / 100;

        // Dynamic Speech Rate matching Timing (sec)
        if (panelDuration && panelDuration > 0) {
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          // Normal speaking rate is about 2.2 words per second.
          const naturalDuration = words / 2.2;
          // If card duration is shorter/longer, adjust playback speed
          let targetRate = naturalDuration / panelDuration;

          // Clamp to a natural sounding range (0.6 to 2.2) to keep voice intelligible
          if (targetRate < 0.6) targetRate = 0.6;
          if (targetRate > 2.2) targetRate = 2.2;
          utterance.rate = targetRate;
        } else {
          utterance.rate = 0.95;
        }

        window.speechSynthesis.speak(utterance);
      }, 0);
    },
    [isMuted, voiceActor, volume]
  );

  const playStoryboardAudio = useCallback(
    (panelIdx: number) => {
      const activePanel = panels[panelIdx];
      if (!activePanel) return;

      speakDialogue(activePanel.speech_text, activePanel.duration);

      if (activePanel.sfx && !isMuted) {
        playComicSoundEffect(activePanel.sfx);
      }
    },
    [panels, speakDialogue, isMuted]
  );

  useEffect(() => {
    setEngineVolume(volume, isMuted);
  }, [volume, isMuted]);

  useEffect(() => {
    if (storyboardPlaying) {
      startAmbientBackgroundMusic(musicTheme, volume, isMuted);
    } else {
      stopAmbientBackgroundMusic();
    }
    return () => {
      stopAmbientBackgroundMusic();
    };
  }, [storyboardPlaying, musicTheme, volume, isMuted]);

  useEffect(() => {
    if (storyboardPlaying && panels.length > 0) {
      const activePanel = panels[currentPanelIndex];
      const stepMs = 100;

      playTimerRef.current = setTimeout(() => {
        setPlaybackTime((prev) => {
          const nextTime = parseFloat((prev + 0.1).toFixed(1));
          if (nextTime >= activePanel.duration) {
            if (currentPanelIndex < panels.length - 1) {
              const nextIdx = currentPanelIndex + 1;
              setCurrentPanelIndex(nextIdx);
              playStoryboardAudio(nextIdx);
              return 0;
            } else {
              setStoryboardPlaying(false);
              return 0;
            }
          }
          return nextTime;
        });
      }, stepMs);
    } else {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [
    storyboardPlaying,
    currentPanelIndex,
    panels,
    playStoryboardAudio,
    playbackTime,
  ]);

  const toggleStoryboardPlayback = () => {
    if (panels.length === 0) return;
    console.log("[Playback] Toggling storyboard playback:", !storyboardPlaying);
    if (storyboardPlaying) {
      setStoryboardPlaying(false);
      if (window.speechSynthesis) window.speechSynthesis.pause();
    } else {
      setStoryboardPlaying(true);
      playStoryboardAudio(currentPanelIndex);
    }
  };

  const resetStoryboardPlayback = () => {
    console.log("[Playback] Resetting storyboard playback");
    setStoryboardPlaying(false);
    setCurrentPanelIndex(0);
    setPlaybackTime(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopAmbientBackgroundMusic();
  };

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
