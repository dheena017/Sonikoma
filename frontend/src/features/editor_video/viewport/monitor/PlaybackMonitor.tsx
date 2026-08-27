import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  ChevronRight,
  Sliders,
  RotateCcw,
  Tv,
  Film,
  Sparkles,
  Wand2,
  Layers,
  Video,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { VideoPreviewHudHelp } from "../player/HudHelp";
import { VideoPreviewSettingsMenu } from "../player/SettingsMenu";
import { VideoPreviewChaptersMenu } from "../player/ChaptersMenu";
import { VideoPreviewTopBar } from "../player/TopBar";
import { VideoPreviewBottomControls } from "../player/BottomControls";
import VideoPreviewQuickActionOverlay from "../overlays/QuickActionOverlay";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
} from "@/features/editor_imported_images/components/ImportedImagesSidebar";
import {
  startAmbientBackgroundMusic,
  stopAmbientBackgroundMusic,
  duckAmbientBackgroundMusic,
  playComicSoundEffect,
} from "@/shared/utils/audio";

interface PlayerPageProps {
  panels: GeneratedPanel[];
  videoUrl: string | null;
  currentPanelIndex?: number;
  seriesSlug: string | null;
  chapterSlug: string | null;
  navigateTo: (path: string) => void;
  addNotification?: (msg: string, type: any) => void;
  variant?: "floating" | "theater" | "embedded";
  onCloseFloating?: () => void;
  mode?: "timeline" | "video" | "editor" | string;
}

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

export default function VideoPreviewCinemaPlayer({
  panels = [],
  videoUrl,
  currentPanelIndex,
  seriesSlug,
  chapterSlug,
  navigateTo,
  addNotification,
  variant = "theater",
  onCloseFloating,
  mode = "timeline",
}: PlayerPageProps) {
  // Calculate total duration strictly from loaded video or panel track durations
  const isMock = !videoUrl && panels.length === 0;
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const totalDuration =
    videoUrl && videoDuration > 0
      ? videoDuration
      : panels.length > 0
        ? panels.reduce(
          (acc, p) => acc + (p.duration || (p as any).duration_sec || 3.0),
          0
        )
        : 0;

  // Define Chapters dynamically from scraped episode groups or scene panels
  const chapters: Chapter[] = useMemo(() => {
    const rawGroups =
      ((window as any).__scrapeEpisodeGroups as Array<{
        episodeLabel: string;
        startIndex: number;
        count: number;
      }>) || [];

    if (rawGroups.length > 0) {
      const sorted = getSortedEpisodeGroups(rawGroups);
      return sorted.map(({ grp }) => {
        const startIdx = Math.max(
          0,
          Math.min(grp.startIndex || 0, panels.length)
        );
        const count = grp.count || 0;
        const endIdx = Math.min(startIdx + count, panels.length);

        const startTime = panels
          .slice(0, startIdx)
          .reduce((acc, p) => acc + (p.duration ?? 0), 0);
        const episodeDuration = panels
          .slice(startIdx, endIdx)
          .reduce((acc, p) => acc + (p.duration ?? 0), 0);
        const endTime = startTime + episodeDuration;

        return {
          title: formatDisplayEpisodeLabel(grp.episodeLabel),
          startTime,
          endTime: endTime > startTime ? endTime : startTime + 10,
        };
      });
    }

    if (panels.length === 0) {
      return [
        { title: "Full Video", startTime: 0, endTime: totalDuration || 10 },
      ];
    }

    // Single episode / un-grouped panels: split into logical scene chapters (e.g. Scene 1, Scene 2...)
    const sceneChunkSize = Math.max(1, Math.ceil(panels.length / 3));
    const result: Chapter[] = [];
    let accTime = 0;

    for (let i = 0; i < panels.length; i += sceneChunkSize) {
      const chunk = panels.slice(i, i + sceneChunkSize);
      const chunkDuration = chunk.reduce(
        (acc, p) => acc + (p.duration ?? 0),
        0
      );
      const sceneNum = Math.floor(i / sceneChunkSize) + 1;

      result.push({
        title: `Scene ${sceneNum}`,
        startTime: accTime,
        endTime: accTime + chunkDuration,
      });

      accTime += chunkDuration;
    }

    return result;
  }, [panels, totalDuration]);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoHasError, setVideoHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);

  // Expanded configurations
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoQuality, setVideoQuality] = useState("1080p");
  const [subtitlesStyle, setSubtitlesStyle] = useState("classic");
  const [isLooping, setIsLooping] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState<
    "small" | "normal" | "large"
  >("normal");
  const [cinematicBars, setCinematicBars] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Fast-forward hold and HUD guide state parameters
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [showHudHelp, setShowHudHelp] = useState(false);
  const spaceTimerRef = useRef<any>(null);
  const baseSpeedRef = useRef(1.0);

  // Hover states for Precise Seeking
  const [hoverProgress, setHoverProgress] = useState<{
    percent: number;
    time: number;
    clientX: number;
    isHovering: boolean;
  }>({
    percent: 0,
    time: 0,
    clientX: 0,
    isHovering: false,
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const playbackIntervalRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenPanelIdRef = useRef<string | number | null>(null);

  // Audio & Settings Initialization
  const savedAudioSettings = useMemo(() => {
    try {
      const raw = localStorage.getItem("global_audio_settings");
      if (raw) {
        const p = JSON.parse(raw);
        return {
          voiceActor:
            p.voiceActor ||
            localStorage.getItem("ai_comic_voice_actor") ||
            localStorage.getItem("ai_comic_narrator_voice") ||
            "en-US-ChristopherNeural",
          speechRate:
            p.speechRate !== undefined
              ? p.speechRate
              : parseFloat(
                localStorage.getItem("ai_comic_speech_rate") || "1.0"
              ) || 1.0,
          speechPitch:
            p.speechPitch !== undefined
              ? p.speechPitch
              : parseFloat(
                localStorage.getItem("ai_comic_speech_pitch") || "1.0"
              ) || 1.0,
          bgmVolume: p.bgmVolume !== undefined ? p.bgmVolume : 50,
          audioDucking: p.audioDucking !== undefined ? p.audioDucking : true,
          musicTheme:
            p.musicTheme ||
            localStorage.getItem("ai_comic_music_theme") ||
            "Cinematic Tension",
        };
      }
    } catch (e) {
      console.warn(
        "[AdaptationPlayer] Error loading audio settings profile:",
        e
      );
    }
    return {
      voiceActor:
        localStorage.getItem("ai_comic_voice_actor") ||
        localStorage.getItem("ai_comic_narrator_voice") ||
        "en-US-ChristopherNeural",
      speechRate:
        parseFloat(localStorage.getItem("ai_comic_speech_rate") || "1.0") ||
        1.0,
      speechPitch:
        parseFloat(localStorage.getItem("ai_comic_speech_pitch") || "1.0") ||
        1.0,
      bgmVolume: 50,
      audioDucking: true,
      musicTheme: "Cinematic Tension",
    };
  }, []);

  // Unlock browser audio restrictions on user interaction
  const unlockAudioContext = React.useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          ctx
            .resume()
            .catch((err) =>
              console.warn(
                "[AdaptationPlayer] AudioContext resume warning:",
                err
              )
            );
        }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn("[AdaptationPlayer] unlockAudioContext exception:", err);
    }
  }, []);

  // SpeechSynthesis voice loader awaiting onvoiceschanged
  const getSpeechVoices = React.useCallback((): Promise<
    SpeechSynthesisVoice[]
  > => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        return resolve([]);
      }
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        return resolve(voices);
      }
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
      setTimeout(() => {
        resolve(window.speechSynthesis.getVoices());
      }, 400);
    });
  }, []);

  // Speak narration/dialogue via Web Speech API
  const speakPanelSpeech = React.useCallback(
    async (text: string) => {
      if (
        !text ||
        !text.trim() ||
        isMuted ||
        typeof window === "undefined" ||
        !window.speechSynthesis
      )
        return;

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const voices = await getSpeechVoices();
        const utt = new SpeechSynthesisUtterance(text);
        const activeVol = Math.max(0.5, volume);
        utt.volume = activeVol;
        utt.rate = savedAudioSettings.speechRate * playbackSpeed;
        utt.pitch = savedAudioSettings.speechPitch;

        if (voices.length > 0) {
          const targetVoiceName = savedAudioSettings.voiceActor.toLowerCase();
          const matched = voices.find(
            (v) =>
              v.name.toLowerCase().includes(targetVoiceName) ||
              v.lang.toLowerCase().includes(targetVoiceName)
          );
          if (matched) {
            utt.voice = matched;
          }
        }

        if (savedAudioSettings.audioDucking) {
          duckAmbientBackgroundMusic(true);
          utt.onend = () => duckAmbientBackgroundMusic(false);
          utt.onerror = (e) => {
            console.error(
              "[AdaptationPlayer] SpeechSynthesis utterance error:",
              e
            );
            duckAmbientBackgroundMusic(false);
          };
        } else {
          utt.onerror = (e) =>
            console.error(
              "[AdaptationPlayer] SpeechSynthesis utterance error:",
              e
            );
        }

        window.speechSynthesis.speak(utt);
      } catch (err) {
        console.error("[AdaptationPlayer] SpeechSynthesis failed:", err);
      }
    },
    [isMuted, volume, playbackSpeed, savedAudioSettings, getSpeechVoices]
  );

  // Auto-close overlay timers
  const [controlsVisible, setControlsVisible] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    setVideoHasError(false);
  }, [videoUrl, videoQuality]);

  useEffect(() => {
    if (currentPanelIndex !== undefined && panels && panels.length > 0) {
      const targetIdx = Math.min(
        Math.max(0, currentPanelIndex),
        panels.length - 1
      );
      const targetTime = panels
        .slice(0, targetIdx)
        .reduce((acc, p) => acc + (p.duration ?? 0), 0);
      setCurrentTime(targetTime);
      if (videoRef.current) {
        videoRef.current.currentTime = targetTime;
      }
    }
  }, [currentPanelIndex, panels]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 3000 && isPlaying) {
        setControlsVisible(false);
        setShowSettings(false);
        setShowChaptersMenu(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    unlockAudioContext();
    if (videoRef.current && !videoHasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => {
          console.error("[AdaptationPlayer] Playback start error:", err);
          setVideoHasError(true);
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Sync state if HTML5 Video is used
  useEffect(() => {
    if (!videoUrl || videoHasError || !videoRef.current) {
      if (isPlaying) {
        playbackIntervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + playbackSpeed * 0.1;
            if (next >= totalDuration) {
              if (isLooping) {
                return 0;
              } else {
                setIsPlaying(false);
                clearInterval(playbackIntervalRef.current);
                return 0;
              }
            }
            return next;
          });
        }, 100);
      } else {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      }
    } else {
      const v = videoRef.current;
      if (v) {
        v.loop = isLooping;
        v.playbackRate = playbackSpeed;
        if (isPlaying) {
          v.play().catch(() => { });
        } else {
          v.pause();
        }
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [
    isPlaying,
    videoUrl,
    videoHasError,
    playbackSpeed,
    totalDuration,
    isLooping,
  ]);

  // Sync real HTML5 video state to React state
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isMock) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoadedMetadata = () => setVideoDuration(v.duration);
    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
      }
    };

    if (v.duration) {
      setVideoDuration(v.duration);
    }

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoadedMetadata);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoadedMetadata);
      v.removeEventListener("ended", onEnded);
    };
  }, [videoUrl, isMock, isLooping]);

  // PiP API Listeners for Video Element
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isMock) return;

    const onEnterPiP = () => setIsPiPActive(true);
    const onLeavePiP = () => setIsPiPActive(false);

    v.addEventListener("enterpictureinpicture", onEnterPiP);
    v.addEventListener("leavepictureinpicture", onLeavePiP);

    return () => {
      v.removeEventListener("enterpictureinpicture", onEnterPiP);
      v.removeEventListener("leavepictureinpicture", onLeavePiP);
    };
  }, [videoUrl, isMock]);

  // Mute & Volume Controls
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = Math.max(0.5, volume);
    }
  }, [isMuted, volume]);

  const getPanelAtTime = React.useCallback(
    (time: number): GeneratedPanel | null => {
      if (!panels || panels.length === 0) return null;
      let accumulatedTime = 0;
      for (const panel of panels) {
        const duration = panel.duration || (panel as any).duration_sec || 3.0;
        if (time >= accumulatedTime && time < accumulatedTime + duration) {
          return panel;
        }
        accumulatedTime += duration;
      }
      return panels[panels.length - 1] || null;
    },
    [panels]
  );

  const getPanelIndexAtTime = React.useCallback(
    (time: number): number => {
      if (!panels || panels.length === 0) return 0;
      let accumulatedTime = 0;
      for (let i = 0; i < panels.length; i++) {
        const duration =
          panels[i].duration || (panels[i] as any).duration_sec || 3.0;
        if (time >= accumulatedTime && time < accumulatedTime + duration) {
          return i + 1;
        }
        accumulatedTime += duration;
      }
      return panels.length;
    },
    [panels]
  );
  // Synchronize playback timeline whenever a storyboard panel is selected / clicked
  useEffect(() => {
    if (
      currentPanelIndex !== undefined &&
      panels &&
      panels.length > 0 &&
      !isPlaying
    ) {
      const validIdx = Math.max(
        0,
        Math.min(currentPanelIndex, panels.length - 1)
      );
      let accTime = 0;
      for (let i = 0; i < validIdx; i++) {
        accTime += panels[i].duration || (panels[i] as any).duration_sec || 3.0;
      }
      setCurrentTime(accTime);
      if (videoRef.current) {
        videoRef.current.currentTime = accTime;
      }
    }
  }, [currentPanelIndex, panels, isPlaying]);

  const activePanelForHover = getPanelAtTime(hoverProgress.time);
  const activePanelNow = isPlaying
    ? getPanelAtTime(currentTime) ||
    (currentPanelIndex !== undefined && panels[currentPanelIndex]) ||
    panels[0] ||
    null
    : (currentPanelIndex !== undefined && panels[currentPanelIndex]) ||
    getPanelAtTime(currentTime) ||
    panels[0] ||
    null;

  const activePanelImg = useMemo(() => {
    if (!activePanelNow) return null;
    const raw =
      activePanelNow.image_url ||
      (activePanelNow as any).imageUrl ||
      (activePanelNow as any).img_url ||
      (activePanelNow as any).panel_url ||
      (activePanelNow as any).src ||
      (activePanelNow as any).url ||
      activePanelNow.layers?.background_url ||
      null;
    if (!raw) return null;
    if (
      raw.startsWith("data:") ||
      raw.startsWith("blob:") ||
      raw.startsWith("/api/")
    ) {
      return raw;
    }
    return `/api/proxy-image?url=${encodeURIComponent(raw)}`;
  }, [activePanelNow]);

  // BGM Background Music Engine for Adaptation Player
  useEffect(() => {
    if (isPlaying && (!videoUrl || videoHasError)) {
      startAmbientBackgroundMusic(
        savedAudioSettings.musicTheme,
        volume * 100,
        isMuted,
        savedAudioSettings.bgmVolume,
        savedAudioSettings.audioDucking
      );
    } else {
      stopAmbientBackgroundMusic();
    }
    return () => {
      stopAmbientBackgroundMusic();
    };
  }, [isPlaying, videoUrl, videoHasError, savedAudioSettings, volume, isMuted]);

  // Panel Speech & Narration Audio Trigger on Step
  useEffect(() => {
    if (!isPlaying || videoUrl) return;
    if (!activePanelNow) return;

    if (lastSpokenPanelIdRef.current === activePanelNow.id) return;
    lastSpokenPanelIdRef.current = activePanelNow.id;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const audioUrl =
      activePanelNow.audio_url || activePanelNow.speech_audio_url;
    if (audioUrl && !isMuted) {
      try {
        const audio = new Audio(audioUrl);
        const activeVol = Math.max(0.5, volume);
        audio.volume = activeVol;
        activeAudioRef.current = audio;

        if (savedAudioSettings.audioDucking) {
          duckAmbientBackgroundMusic(true);
          audio.onended = () => duckAmbientBackgroundMusic(false);
        }

        audio.play().catch((err) => {
          console.warn(
            "[AdaptationPlayer] Audio file blocked/failed, falling back to speech synthesis:",
            err
          );
          const speech = activePanelNow.speech_text || activePanelNow.narrative;
          if (speech) speakPanelSpeech(speech);
        });
      } catch (err) {
        console.error("[AdaptationPlayer] Audio creation exception:", err);
        const speech = activePanelNow.speech_text || activePanelNow.narrative;
        if (speech) speakPanelSpeech(speech);
      }
    } else {
      const speech = activePanelNow.speech_text || activePanelNow.narrative;
      if (speech && !isMuted) {
        speakPanelSpeech(speech);
      }
    }

    if (activePanelNow.sfx && !isMuted) {
      playComicSoundEffect(activePanelNow.sfx, Math.max(0.5, volume));
    }
  }, [
    isPlaying,
    videoUrl,
    activePanelNow,
    isMuted,
    volume,
    speakPanelSpeech,
    savedAudioSettings,
  ]);

  // Find active chapter by current time
  const getActiveChapter = (time: number): Chapter => {
    const active = chapters.find(
      (c) => time >= c.startTime && time <= c.endTime
    );
    return active || chapters[0];
  };

  const activeChapter = getActiveChapter(currentTime);

  // Format second timestamps to MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mStr = m.toString().padStart(2, "0");
    const sStr = s.toString().padStart(2, "0");

    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  };

  // Dragging and scrubbing progress click/drag handler
  const handleProgressBarInteraction = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    let targetTime = percentage * totalDuration;

    if (e.shiftKey) {
      const closestChapter = chapters.reduce((prev, curr) => {
        const prevDiffStart = Math.abs(prev.startTime - targetTime);
        const prevDiffEnd = Math.abs(prev.endTime - targetTime);
        const currDiffStart = Math.abs(curr.startTime - targetTime);
        const currDiffEnd = Math.abs(curr.endTime - targetTime);

        const minPrev = Math.min(prevDiffStart, prevDiffEnd);
        const minCurr = Math.min(currDiffStart, currDiffEnd);

        return minPrev < minCurr ? prev : curr;
      });

      const startDiff = Math.abs(closestChapter.startTime - targetTime);
      const endDiff = Math.abs(closestChapter.endTime - targetTime);
      targetTime =
        startDiff < endDiff ? closestChapter.startTime : closestChapter.endTime;
    }

    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  // Hover precise seeking calculations
  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const targetTime = percentage * totalDuration;

    setHoverProgress({
      percent: percentage,
      time: targetTime,
      clientX: e.clientX,
      isHovering: true,
    });
  };

  const handleProgressBarMouseLeave = () => {
    setHoverProgress((prev) => ({ ...prev, isHovering: false }));
  };

  // Skip Back / Skip Forward 10 seconds handlers
  const handleSkipBackward = () => {
    const prev = Math.max(0, currentTime - 10);
    setCurrentTime(prev);
    if (videoRef.current) videoRef.current.currentTime = prev;
    if (addNotification) addNotification("Skipped back 10 seconds", "info");
  };

  const handleSkipForward = () => {
    const next = Math.min(totalDuration, currentTime + 10);
    setCurrentTime(next);
    if (videoRef.current) videoRef.current.currentTime = next;
    if (addNotification) addNotification("Skipped forward 10 seconds", "info");
  };

  // Toggle Picture in Picture Mode
  const togglePictureInPicture = async () => {
    if (isMock) {
      setIsPiPActive((prev) => {
        const next = !prev;
        if (addNotification) {
          addNotification(
            next
              ? "Entered Picture-in-Picture (Simulated Preview)"
              : "Exited Picture-in-Picture Mode",
            "info"
          );
        }
        return next;
      });
      return;
    }

    const v = videoRef.current;
    if (!v) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        if (document.pictureInPictureEnabled) {
          await v.requestPictureInPicture();
          setIsPiPActive(true);
        } else {
          if (addNotification)
            addNotification(
              "Picture-in-Picture not supported on this browser.",
              "warning"
            );
        }
      }
    } catch (err: any) {
      console.error("PiP Toggle error:", err);
      if (addNotification)
        addNotification("Picture-in-Picture initiation failed.", "error");
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!spaceTimerRef.current) {
          spaceTimerRef.current = setTimeout(() => {
            setIsFastForwarding(true);
            setPlaybackSpeed(2.0);
            if (videoRef.current) {
              videoRef.current.playbackRate = 2.0;
            }
          }, 450);
        }
      } else if (e.code === "ArrowRight") {
        const next = Math.min(currentTime + 5, totalDuration);
        setCurrentTime(next);
        if (videoRef.current) videoRef.current.currentTime = next;
      } else if (e.code === "ArrowLeft") {
        const prev = Math.max(currentTime - 5, 0);
        setCurrentTime(prev);
        if (videoRef.current) videoRef.current.currentTime = prev;
      } else if (e.code === "KeyM") {
        setIsMuted(!isMuted);
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyT") {
        setIsTheaterMode(!isTheaterMode);
      } else if (e.code === "KeyL") {
        setIsLooping((prev) => {
          const next = !prev;
          if (addNotification)
            addNotification(
              next ? "Looping Enabled" : "Looping Disabled",
              "info"
            );
          return next;
        });
      } else if (e.code === "KeyP") {
        togglePictureInPicture();
      } else if (e.key >= "0" && e.key <= "9") {
        const digit = parseInt(e.key);
        const percent = digit / 10;
        const targetTime = percent * totalDuration;
        setCurrentTime(targetTime);
        if (videoRef.current) videoRef.current.currentTime = targetTime;
        if (addNotification)
          addNotification(`Jumped to ${digit * 10}%`, "info");
      } else if (e.key === "," || e.key === "<") {
        e.preventDefault();
        const prev = Math.max(0, parseFloat((currentTime - 0.1).toFixed(1)));
        setCurrentTime(prev);
        if (videoRef.current) videoRef.current.currentTime = prev;
      } else if (e.key === "." || e.key === ">") {
        e.preventDefault();
        const next = Math.min(
          totalDuration,
          parseFloat((currentTime + 0.1).toFixed(1))
        );
        setCurrentTime(next);
        if (videoRef.current) videoRef.current.currentTime = next;
      } else if (e.key === "?" || e.key === "/") {
        setShowHudHelp(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "?" || e.key === "/") {
        setShowHudHelp(false);
      } else if (e.code === "Space") {
        if (spaceTimerRef.current) {
          clearTimeout(spaceTimerRef.current);
          spaceTimerRef.current = null;
        }
        if (isFastForwarding) {
          setIsFastForwarding(false);
          setPlaybackSpeed(baseSpeedRef.current);
          if (videoRef.current) {
            videoRef.current.playbackRate = baseSpeedRef.current;
          }
        } else {
          togglePlay();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (spaceTimerRef.current) clearTimeout(spaceTimerRef.current);
    };
  }, [
    currentTime,
    totalDuration,
    isMuted,
    isTheaterMode,
    isFastForwarding,
    isLooping,
  ]);

  const getQualityVideoUrl = (url: string | null, quality: string) => {
    if (!url) return null;
    const extIdx = url.lastIndexOf(".");
    if (extIdx === -1) return url;
    const base = url.substring(0, extIdx);
    const ext = url.substring(extIdx);
    const qualityPattern = /_(1080p|720p|480p)$/;
    if (qualityPattern.test(base)) {
      return base.replace(qualityPattern, `_${quality}`) + ext;
    }
    if (quality !== "1080p" && (quality === "720p" || quality === "480p")) {
      return `${base}_${quality}${ext}`;
    }
    return url;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Fullscreen request failed:", err);
        });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const panelCounterText = useMemo(() => {
    if (panels.length === 0) {
      return "0 Panels";
    } else {
      const totalPanels = panels.length;
      const currentPanelIdx = getPanelIndexAtTime(currentTime);
      return `Panel ${currentPanelIdx} / ${totalPanels}`;
    }
  }, [panels.length, currentTime]);

  const handleClose = () => {
    if (seriesSlug && chapterSlug) {
      navigateTo(
        `/scraper/editor/series/${seriesSlug}/chapters/${chapterSlug}`
      );
    } else {
      navigateTo("/dashboard");
    }
  };

  const subtitleSizeClass = useMemo(() => {
    if (subtitleSize === "small") return "text-xs md:text-sm";
    if (subtitleSize === "large") return "text-lg md:text-2xl font-extrabold";
    return "text-sm md:text-lg";
  }, [subtitleSize]);

  const isIntroActive = useMemo(() => {
    if (variant === "floating") return false;
    const introChapter = chapters.find(
      (c) => c.title.toLowerCase() === "intro"
    );
    if (!introChapter) return false;
    return (
      currentTime >= introChapter.startTime &&
      currentTime < introChapter.endTime
    );
  }, [currentTime, chapters, variant]);

  const handleSkipIntro = () => {
    const introChapter = chapters.find(
      (c) => c.title.toLowerCase() === "intro"
    );
    if (introChapter) {
      const targetTime = introChapter.endTime;
      setCurrentTime(targetTime);
      if (videoRef.current) videoRef.current.currentTime = targetTime;
      if (addNotification) addNotification("Skipped Intro segment", "success");
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        setControlsVisible(true);
        lastActiveRef.current = Date.now();
      }}
      onMouseMove={() => {
        setControlsVisible(true);
        lastActiveRef.current = Date.now();
      }}
      onMouseLeave={() => {
        setControlsVisible(false);
        setShowSettings(false);
        setShowChaptersMenu(false);
      }}
      className={`relative select-none flex flex-col justify-center items-center bg-black overflow-hidden transition-all duration-300 ${variant === "floating" || variant === "embedded"
          ? "w-full h-full rounded-none"
          : isTheaterMode
            ? "w-full h-[85vh] lg:h-[90vh]"
            : "fixed inset-0 z-50 w-screen h-screen"
        }`}
    >
      {/* BACKGROUND OVERLAY */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-950/20 via-black to-black opacity-95 pointer-events-none z-0" />

      {/* CINEMATIC LETTERBOX BARS */}
      <div
        className={`absolute top-0 inset-x-0 bg-black z-40 transition-all duration-500 pointer-events-none ${cinematicBars ? "h-[10%] opacity-100" : "h-0 opacity-0"
          }`}
      />
      <div
        className={`absolute bottom-0 inset-x-0 bg-black z-40 transition-all duration-500 pointer-events-none ${cinematicBars ? "h-[10%] opacity-100" : "h-0 opacity-0"
          }`}
      />

      {/* SUB-COMPONENT: Keyboard HUD Shortcuts */}
      <VideoPreviewHudHelp show={showHudHelp} />

      {/* FAST-FORWARD 2X BADGE */}
      {isFastForwarding && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-purple-600/90 text-white font-mono text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl shadow-purple-950 animate-pulse border border-purple-400/30">
          <RotateCcw className="h-3.5 w-3.5 animate-spin" />
          <span>2x Fast-Forward Active</span>
        </div>
      )}

      {/* PIP PREVIEW WINDOW */}
      {isPiPActive && isMock && (
        <div className="fixed bottom-24 right-6 w-72 h-60 bg-neutral-900/95 border-2 border-purple-600 rounded-2xl shadow-2xl z-[80] flex flex-col overflow-hidden animate-fade-in pointer-events-auto">
          <div className="bg-neutral-950 px-3 py-1.5 flex items-center justify-between border-b border-neutral-800">
            <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Tv className="h-3 w-3" /> PiP Preview Mode
            </span>
            <button
              onClick={() => setIsPiPActive(false)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center bg-[#060608]">
            {activePanelNow ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {activePanelNow.layers ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={activePanelNow.layers.background_url}
                      className="absolute inset-0 w-full h-full object-cover player-content"
                      alt="PiP Background"
                    />
                    <img
                      src={activePanelNow.layers.character_url}
                      className="absolute max-w-full max-h-full object-fill z-10"
                      alt="PiP Character"
                    />
                  </div>
                ) : (
                  <img
                    src={activePanelNow.image_url}
                    className="w-full h-full object-cover"
                    alt="PiP Current Panel"
                  />
                )}
              </div>
            ) : (
              <span className="text-[10px] font-mono text-neutral-500">
                Preview Stream
              </span>
            )}
            <div className="absolute bottom-2 inset-x-2 bg-black/85 text-center py-1 rounded text-[8px] font-mono text-neutral-300">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
          </div>
        </div>
      )}

      {/* SKIP INTRO PILL */}
      {isIntroActive && (
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-28 right-6 z-50 bg-white hover:bg-neutral-100 text-neutral-950 hover:text-black font-sans font-extrabold text-xs tracking-wider px-5 py-3 rounded-full flex items-center gap-2 shadow-2xl active:scale-95 transition-all duration-300 hover:scale-105 border border-neutral-200 animate-bounce"
        >
          <span>Skip Intro</span>
          <ChevronRight className="h-4 w-4 stroke-[3px]" />
        </button>
      )}

      {/* MAIN SCREEN CANVAS */}
      <div className="relative w-full h-full flex items-center justify-center z-10 overflow-hidden bg-[#09090f] p-4">
        {/* Workspace dot grid pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative w-full h-full flex items-center justify-center bg-[#14141f] border border-purple-500/35 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] overflow-hidden">
          {mode === "video" ? (
            videoUrl && !videoHasError ? (
              <video
                ref={videoRef}
                src={getQualityVideoUrl(videoUrl, videoQuality) || undefined}
                onLoadedMetadata={(e) =>
                  setVideoDuration(e.currentTarget.duration)
                }
                onError={(e) => {
                  const vid = e.currentTarget;
                  if (
                    videoUrl &&
                    vid.src !== videoUrl &&
                    !vid.dataset.masterFallback
                  ) {
                    vid.dataset.masterFallback = "1";
                    vid.src = videoUrl;
                    return;
                  }
                  console.warn(
                    "[CinemaPlayer] Video failed to load, falling back to simulated mode."
                  );
                  setVideoHasError(true);
                }}
                className="w-auto h-auto max-w-full max-h-full object-contain player-panel-image border border-neutral-900 rounded-3xl shadow-2xl bg-neutral-950"
                style={{ width: "auto", height: "auto" }}
                playsInline
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 select-none my-auto">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Video className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                    No Compiled Video Yet
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-400 font-mono max-w-xs leading-relaxed">
                    Export your storyboard cut sequence above to generate the final rendered MP4 video file.
                  </p>
                </div>
              </div>
            )
          ) : activePanelNow &&
            (activePanelImg || activePanelNow.layers?.background_url) ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden border border-purple-500/35 rounded-2xl shadow-2xl bg-[#080811]">
              {/* Ambient Blurred Backdrop */}
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
                <img
                  src={activePanelNow.layers?.background_url || activePanelImg || ""}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover object-center filter blur-3xl opacity-30 scale-125 saturate-150 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40" />
              </div>

              {activePanelNow.layers ? (
                <div className="relative w-full h-full flex items-center justify-center z-10 p-2 sm:p-4">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={activePanelNow.layers.background_url}
                      className="absolute w-auto h-auto max-w-full max-h-full object-contain player-panel-image drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-lg"
                      style={{ width: "auto", height: "auto" }}
                      alt="Background"
                    />
                    <img
                      src={activePanelNow.layers.background_url}
                      className="absolute w-auto h-auto max-w-full max-h-full object-contain player-panel-image drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-lg"
                      style={{
                        width: "auto",
                        height: "auto",
                        transform: isPlaying
                          ? subtitlesStyle === "karaoke"
                            ? `scale(${1 + (currentTime % 4.5) * 0.015})`
                            : "scale(1.05) translateY(-2px)"
                          : "scale(1)",
                        transition: "transform 100ms linear",
                      }}
                      alt="Background"
                    />
                    <img
                      src={activePanelNow.layers.character_url}
                      className="absolute w-auto h-auto max-w-full max-h-full object-contain z-10 player-panel-image drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-lg"
                      style={{
                        width: "auto",
                        height: "auto",
                        transform: isPlaying
                          ? subtitlesStyle === "karaoke"
                            ? `scale(${1 + (currentTime % 4.5) * 0.035
                            }) translateY(-4px)`
                            : "scale(1.08) translateY(-6px)"
                          : "scale(1)",
                        transition: "transform 100ms linear",
                      }}
                      alt="Character"
                    />
                    {showSubtitles && activePanelNow.layers.text_url && (
                      <img
                        src={activePanelNow.layers.text_url}
                        className="absolute w-auto h-auto max-w-full max-h-full object-contain z-20 player-panel-image"
                        style={{ width: "auto", height: "auto" }}
                        alt="Subtitles Layer"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10 p-2 sm:p-4">
                  <img
                    src={activePanelImg}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.retried) return;
                      img.dataset.retried = "1";
                      const src = img.src;
                      if (
                        src &&
                        !src.includes("/api/proxy-image") &&
                        !src.includes("/api/image/")
                      ) {
                        img.src = `/api/proxy-image?url=${encodeURIComponent(
                          src
                        )}`;
                      }
                    }}
                    className="w-auto h-auto max-w-full max-h-full object-contain player-panel-image drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] rounded-lg"
                    style={{
                      width: "auto",
                      height: "auto",
                      transform: isPlaying
                        ? `scale(${1 + (currentTime % 4.5) * 0.02})`
                        : "scale(1)",
                      transition: "transform 100ms linear",
                    }}
                    alt={`Panel ${activePanelNow.id || ""}`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 select-none my-auto">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Film className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Cinema Monitor Standby
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 font-mono max-w-xs leading-relaxed">
                  {panels.length > 0
                    ? `Select any panel below to start playback · ${panels.length} cuts ready`
                    : "No storyboard panels yet · Add or crop panels below to preview"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Subtitles Overlay */}
        {showSubtitles &&
          activePanelNow &&
          (activePanelNow.speech_text || activePanelNow.narrative) && (
            <div className="absolute bottom-8 inset-x-0 flex flex-col items-center justify-center z-30 pointer-events-none px-4 select-none animate-in fade-in duration-200">
              <div className="flex flex-col gap-1.5 max-w-xl text-center">
                {activePanelNow.narrative && (
                  <p className="bg-black/80 text-neutral-200 text-[10px] md:text-xs font-sans px-3.5 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm tracking-wide leading-relaxed shadow-lg">
                    <span className="text-purple-400 font-mono text-[8.5px] uppercase tracking-wider block mb-0.5 font-black">
                      NARRATOR
                    </span>
                    {activePanelNow.narrative}
                  </p>
                )}
                {activePanelNow.speech_text && (
                  <p
                    className={`bg-black/90 text-white font-bold font-sans px-4 py-2 rounded-xl border border-purple-500/20 backdrop-blur-sm tracking-wide leading-relaxed shadow-lg ${subtitleSizeClass}`}
                  >
                    {activePanelNow.speech_text}
                  </p>
                )}
              </div>
            </div>
          )}
      </div>

      {/* SUB-COMPONENT: Top Bar Overlay */}
      {variant !== "floating" && variant !== "embedded" && (
        <VideoPreviewTopBar
          visible={controlsVisible}
          activeChapter={activeChapter}
          panelCounterText={panelCounterText}
          onClose={handleClose}
          videoUrl={videoUrl}
        />
      )}

      {/* SUB-COMPONENT: Floating Chapters Menu */}
      <VideoPreviewChaptersMenu
        show={showChaptersMenu && controlsVisible}
        chapters={chapters}
        activeChapter={activeChapter}
        onSelectChapter={(startTime) => {
          setCurrentTime(startTime);
          if (videoRef.current) videoRef.current.currentTime = startTime;
          setShowChaptersMenu(false);
        }}
        formatTime={formatTime}
      />

      {/* SUB-COMPONENT: Settings Menu */}
      <VideoPreviewSettingsMenu
        show={showSettings && controlsVisible}
        onClose={() => setShowSettings(false)}
        isLooping={isLooping}
        setIsLooping={setIsLooping}
        cinematicBars={cinematicBars}
        setCinematicBars={setCinematicBars}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        subtitleSize={subtitleSize}
        setSubtitleSize={setSubtitleSize}
        videoQuality={videoQuality}
        setVideoQuality={setVideoQuality}
        subtitlesStyle={subtitlesStyle}
        setSubtitlesStyle={setSubtitlesStyle}
        baseSpeedRef={baseSpeedRef}
      />

      {/* SUB-COMPONENT: Bottom Controls Bar */}
      <VideoPreviewBottomControls
        visible={controlsVisible}
        progressBarRef={progressBarRef}
        handleProgressBarInteraction={handleProgressBarInteraction}
        handleProgressBarMouseMove={handleProgressBarMouseMove}
        handleProgressBarMouseLeave={handleProgressBarMouseLeave}
        hoverProgress={hoverProgress}
        activePanelForHover={activePanelForHover}
        chapters={chapters}
        activeChapter={activeChapter}
        totalDuration={totalDuration}
        currentTime={currentTime}
        formatTime={formatTime}
        getActiveChapter={getActiveChapter}
        handleSkipBackward={handleSkipBackward}
        handleSkipForward={handleSkipForward}
        togglePlay={togglePlay}
        isPlaying={isPlaying}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        volume={volume}
        setVolume={setVolume}
        showChaptersMenu={showChaptersMenu}
        setShowChaptersMenu={setShowChaptersMenu}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        isLooping={isLooping}
        setIsLooping={setIsLooping}
        showSubtitles={showSubtitles}
        setShowSubtitles={setShowSubtitles}
        togglePictureInPicture={togglePictureInPicture}
        variant={variant}
        isTheaterMode={isTheaterMode}
        setIsTheaterMode={setIsTheaterMode}
        toggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        addNotification={addNotification}
      />
    </div>
  );
}

export { VideoPreviewCinemaPlayer };
