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

function parseVoiceCharacteristics(voiceActor: string) {
  const actorLower = voiceActor.toLowerCase();

  // 1. Detect language prefix & full code
  let targetLangPrefix = "en";
  let targetFullLang = "en-US";

  if (actorLower.includes("korean") || actorLower.includes("ko-kr") || actorLower.includes("sunhi") || actorLower.includes("injoon")) {
    targetLangPrefix = "ko";
    targetFullLang = "ko-KR";
  } else if (actorLower.includes("japanese") || actorLower.includes("ja-jp") || actorLower.includes("nanami")) {
    targetLangPrefix = "ja";
    targetFullLang = "ja-JP";
  } else if (actorLower.includes("chinese") || actorLower.includes("mandarin") || actorLower.includes("zh-cn") || actorLower.includes("xiaoxiao")) {
    targetLangPrefix = "zh";
    targetFullLang = "zh-CN";
  } else if (actorLower.includes("tamil") || actorLower.includes("ta-in") || actorLower.includes("pallavi") || actorLower.includes("valluvar")) {
    targetLangPrefix = "ta";
    targetFullLang = "ta-IN";
  } else if (actorLower.includes("en-gb") || actorLower.includes("sonia") || actorLower.includes("ryan") || actorLower.includes("uk") || actorLower.includes("english (uk)")) {
    targetLangPrefix = "en";
    targetFullLang = "en-GB";
  } else if (actorLower.includes("en-au") || actorLower.includes("natasha") || actorLower.includes("australia") || actorLower.includes("english (au)")) {
    targetLangPrefix = "en";
    targetFullLang = "en-AU";
  } else if (actorLower.includes("en-us") || actorLower.includes("guy") || actorLower.includes("jenny") || actorLower.includes("aria") || actorLower.includes("jason") || actorLower.includes("tony") || actorLower.includes("narrator") || actorLower.includes("shonen") || actorLower.includes("sultry") || actorLower.includes("anti-hero")) {
    targetLangPrefix = "en";
    targetFullLang = "en-US";
  } else {
    // Check if there is an explicit standard format in the string (e.g. "ko-KR-something" or "ta-IN-something")
    const match = voiceActor.match(/([a-zA-Z]{2})-([a-zA-Z]{2})/);
    if (match) {
      targetLangPrefix = match[1].toLowerCase();
      targetFullLang = match[0];
    }
  }

  // 2. Detect gender
  let targetGender: "male" | "female" | "neutral" = "male"; // default to male
  if (
    actorLower.includes("female") ||
    actorLower.includes("sultry") ||
    actorLower.includes("jenny") ||
    actorLower.includes("aria") ||
    actorLower.includes("sonia") ||
    actorLower.includes("natasha") ||
    actorLower.includes("sunhi") ||
    actorLower.includes("nanami") ||
    actorLower.includes("xiaoxiao") ||
    actorLower.includes("pallavi")
  ) {
    targetGender = "female";
  } else if (
    actorLower.includes("male") ||
    actorLower.includes("guy") ||
    actorLower.includes("ryan") ||
    actorLower.includes("injoon") ||
    actorLower.includes("jason") ||
    actorLower.includes("tony") ||
    actorLower.includes("valluvar") ||
    actorLower.includes("shonen") ||
    actorLower.includes("narrator") ||
    actorLower.includes("anti-hero")
  ) {
    targetGender = "male";
  }

  return { targetLangPrefix, targetFullLang, targetGender };
}

const matchVoice = (voices: SpeechSynthesisVoice[], voiceActor: string) => {
  const { targetLangPrefix, targetFullLang, targetGender } = parseVoiceCharacteristics(voiceActor);

  // Filter voices by the target language prefix (e.g. "ko", "ja", "ta", "zh", "en")
  // We normalize the voice language tags to lowercase and replace underscores with hyphens
  const langFiltered = voices.filter((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang === targetFullLang.toLowerCase() || vLang.startsWith(targetLangPrefix + "-") || vLang === targetLangPrefix;
  });

  // Fallback: if absolutely no voice matches targetLangPrefix (e.g., Korean or Tamil voice is not installed),
  // then we fall back to any voice that matches the language code, but if none exist, then we fall back to the entire voice list
  // so we at least speak something.
  const candidateVoices = langFiltered.length > 0 ? langFiltered : voices;

  // Now, score each candidate voice
  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -1;

  for (const v of candidateVoices) {
    let score = 0;
    const vLang = v.lang.toLowerCase().replace("_", "-");
    const vName = v.name.toLowerCase();

    // 1. Language matching (max score: 100)
    if (vLang === targetFullLang.toLowerCase()) {
      score += 100; // Perfect full language & region match (e.g. ko-KR -> ko-KR)
    } else if (vLang.startsWith(targetLangPrefix)) {
      score += 50;  // Matching language prefix (e.g. en-GB -> en)
    }

    // 2. Gender matching (max score: 50)
    if (targetGender === "female") {
      const isFemaleKeyword =
        vName.includes("female") ||
        vName.includes("zira") ||
        vName.includes("samantha") ||
        vName.includes("hazel") ||
        vName.includes("karen") ||
        vName.includes("yuna") ||
        vName.includes("haruka") ||
        vName.includes("heera") ||
        vName.includes("sun-hi") ||
        vName.includes("nanami") ||
        vName.includes("xiaoxiao") ||
        vName.includes("pallavi");
      const isMaleKeyword =
        vName.includes("male") ||
        vName.includes("david") ||
        vName.includes("george") ||
        vName.includes("injoon") ||
        vName.includes("valluvar") ||
        vName.includes("ryan") ||
        vName.includes("guy");

      if (isFemaleKeyword) {
        score += 50;
      } else if (!isMaleKeyword) {
        score += 20; // fallback if gender is not explicitly male
      }
    } else if (targetGender === "male") {
      const isMaleKeyword =
        vName.includes("male") ||
        vName.includes("david") ||
        vName.includes("george") ||
        vName.includes("injoon") ||
        vName.includes("valluvar") ||
        vName.includes("ryan") ||
        vName.includes("guy") ||
        vName.includes("jason") ||
        vName.includes("tony");
      const isFemaleKeyword =
        vName.includes("female") ||
        vName.includes("zira") ||
        vName.includes("samantha") ||
        vName.includes("hazel") ||
        vName.includes("karen") ||
        vName.includes("yuna") ||
        vName.includes("haruka") ||
        vName.includes("heera") ||
        vName.includes("sun-hi") ||
        vName.includes("nanami") ||
        vName.includes("xiaoxiao") ||
        vName.includes("pallavi");

      if (isMaleKeyword) {
        score += 50;
      } else if (!isFemaleKeyword) {
        score += 20; // fallback if gender is not explicitly female
      }
    }

    // 3. Exact voice actor name matching (extra bonus 10)
    const voiceActorPart = voiceActor.split(/[-—]/).pop()?.trim().toLowerCase() || "";
    if (voiceActorPart && vName.includes(voiceActorPart)) {
      score += 10;
    }

    // Keep track of the highest score
    if (score > highestScore) {
      highestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice;
};

interface UsePlaybackEngineProps {
  panels: GeneratedPanel[];
  volume: number;
  isMuted: boolean;
  musicTheme: string;
  voiceActor: string;
  autoPlayAudio: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
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
  activePreviewTab = "timeline",
  videoPlayerRef,
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

        const selectedVoice = matchVoice(voices, voiceActor);

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          // If no specific voice is returned, try to set lang from parsed characteristics
          const { targetFullLang } = parseVoiceCharacteristics(voiceActor);
          utterance.lang = targetFullLang;
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
    window.dispatchEvent(new CustomEvent("storyboard-time-update", { detail: playbackTime }));
  }, [playbackTime]);

  useEffect(() => {
    if (storyboardPlaying && panels.length > 0 && activePreviewTab !== "video") {
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
    activePreviewTab,
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
      if (activePreviewTab === "video" && videoPlayerRef?.current) {
        videoPlayerRef.current.pause();
      }
    } else {
      setStoryboardPlaying(true);
      if (activePreviewTab === "video" && videoPlayerRef?.current) {
        videoPlayerRef.current.play().catch((err) => {
          console.error("[Playback] Failed to play video element:", err);
        });
      } else {
        playStoryboardAudio(currentPanelIndex, true);
      }
    }
  }, [
    panels.length,
    storyboardPlaying,
    playStoryboardAudio,
    currentPanelIndex,
    activePreviewTab,
    videoPlayerRef,
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
    if (activePreviewTab === "video" && videoPlayerRef?.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.pause();
    }
    stopAmbientBackgroundMusic();
  }, [activePreviewTab, videoPlayerRef]);

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
