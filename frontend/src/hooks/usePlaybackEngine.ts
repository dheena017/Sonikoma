import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  autoPlayAudio: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
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
}: UsePlaybackEngineProps) {
  const [currentPanelIndex, setCurrentPanelIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [storyboardPlaying, setStoryboardPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);
  // ...
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
    (panelIdx: number, forcePlay: boolean = false) => {
      const activePanel = panels[panelIdx];
      if (!activePanel) return;

      // Stop any currently playing audio track
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      // Stop browser speech synthesis if active
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // If autoplay is off and we are NOT forcing it (e.g. not manually clicking "Play"), do not play
      if (!autoPlayAudio && !forcePlay) {
        console.debug(
          `[Playback] Skipped panel ${panelIdx} audio because autoPlayAudio is disabled.`
        );
        return;
      }

      const shouldPlayAudio = !!activePanel.audio_url && !isMuted;
      const shouldSpeak = !isMuted || !activePanel.audio_url;
      const shouldPlaySfx = !!activePanel.sfx && !isMuted && sfxEnabled;

      if (shouldPlayAudio) {
        const audio = new Audio(activePanel.audio_url as string);
        audio.volume = volume / 100;
        activeAudioRef.current = audio;
        audio.play().catch((err) => {
          console.error(
            "[Playback] Failed playing pre-generated panel audio, falling back to speech synthesis:",
            err
          );
          speakDialogue(activePanel.speech_text, activePanel.duration);
        });
      } else if (shouldSpeak) {
        speakDialogue(activePanel.speech_text, activePanel.duration);
      } else {
        console.debug(
          `[Playback] No speech or audio played for panel ${panelIdx} (muted or no audio available).`
        );
      }

      if (activePanel.sfx && !isMuted && sfxEnabled) {
        playComicSoundEffect(activePanel.sfx, sfxVolume / 100);
      } else if (activePanel.sfx && !sfxEnabled) {
        console.debug(
          `[Playback] SFX disabled for panel ${panelIdx}; skipping ${activePanel.sfx}`
        );
      } else if (activePanel.sfx && isMuted) {
        console.debug(
          `[Playback] SFX skipped for panel ${panelIdx} because audio is muted.`
        );
      }
    },
    [
      panels,
      speakDialogue,
      isMuted,
      volume,
      autoPlayAudio,
      sfxEnabled,
      sfxVolume,
    ]
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
              playStoryboardAudio(nextIdx, true);
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

  const toggleStoryboardPlayback = useCallback(() => {
    if (panels.length === 0) return;
    console.log("[Playback] Toggling storyboard playback:", !storyboardPlaying);
    if (storyboardPlaying) {
      setStoryboardPlaying(false);
      if (window.speechSynthesis) window.speechSynthesis.pause();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    } else {
      setStoryboardPlaying(true);
      playStoryboardAudio(currentPanelIndex, true);
    }
  }, [
    panels.length,
    storyboardPlaying,
    playStoryboardAudio,
    currentPanelIndex,
  ]);

  const resetStoryboardPlayback = useCallback(() => {
    console.log("[Playback] Resetting storyboard playback");
    setStoryboardPlaying(false);
    setCurrentPanelIndex(0);
    setPlaybackTime(0);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    stopAmbientBackgroundMusic();
  }, []);

  return useMemo(
    () => ({
      currentPanelIndex,
      setCurrentPanelIndex,
      playbackTime,
      setPlaybackTime,
      storyboardPlaying,
      setStoryboardPlaying,
      toggleStoryboardPlayback,
      resetStoryboardPlayback,
      playStoryboardAudio,
    }),
    [
      currentPanelIndex,
      setCurrentPanelIndex,
      playbackTime,
      setPlaybackTime,
      storyboardPlaying,
      setStoryboardPlaying,
      toggleStoryboardPlayback,
      resetStoryboardPlayback,
      playStoryboardAudio,
    ]
  );
}
