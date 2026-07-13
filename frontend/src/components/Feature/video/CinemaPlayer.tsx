import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  X,
  ChevronRight,
  List,
  Monitor,
  Maximize2,
  Minimize2,
  Sliders,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { GeneratedPanel } from "../../../types.js";

interface PlayerPageProps {
  panels: GeneratedPanel[];
  videoUrl: string | null;
  seriesSlug: string | null;
  chapterSlug: string | null;
  navigateTo: (path: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

interface Chapter {
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export default function CinemaPlayer({
  panels = [],
  videoUrl,
  seriesSlug,
  chapterSlug,
  navigateTo,
  addNotification,
}: PlayerPageProps) {
  // Use either actual panels/video duration or fallback to high-fidelity mock duration (16:38 = 998 seconds)
  const isMock = !videoUrl && panels.length === 0;
  const totalDuration = isMock
    ? 998 // 16 minutes 38 seconds
    : panels.reduce((acc, p) => acc + (p.duration || 4.5), 0);

  // Define Chapters
  const chapters: Chapter[] = React.useMemo(() => {
    if (isMock) {
      return [
        { title: "Intro", startTime: 0, endTime: 90 },
        { title: "Story", startTime: 90, endTime: 765 },
        { title: "Climax", startTime: 765, endTime: 998 },
      ];
    } else {
      // Divide panels into 3 chapters
      const part1 = Math.floor(panels.length * 0.15) || 1;
      const part2 = Math.floor(panels.length * 0.75) || 2;

      let t1 = 0;
      let t2 = 0;
      let acc = 0;

      panels.forEach((p, idx) => {
        if (idx === part1) t1 = acc;
        if (idx === part2) t2 = acc;
        acc += p.duration || 4.5;
      });

      return [
        { title: "Intro", startTime: 0, endTime: t1 || acc * 0.15 },
        { title: "Story", startTime: t1 || acc * 0.15, endTime: t2 || acc * 0.75 },
        { title: "Climax", startTime: t2 || acc * 0.75, endTime: acc },
      ];
    }
  }, [isMock, panels]);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Speed, Quality, Subtitles style configs
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoQuality, setVideoQuality] = useState("1080p");
  const [subtitlesStyle, setSubtitlesStyle] = useState("classic");

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

  // Auto-close overlay timers
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastActiveRef = useRef<number>(Date.now());

  // Mouse activity tracker for auto-hiding player control overlay
  useEffect(() => {
    const handleMouseMove = () => {
      setControlsVisible(true);
      lastActiveRef.current = Date.now();
    };

    const interval = setInterval(() => {
      if (Date.now() - lastActiveRef.current > 3000 && isPlaying) {
        setControlsVisible(false);
        setShowSettings(false);
        setShowChaptersMenu(false);
      }
    }, 1000);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [isPlaying]);

  // Handle play/pause toggle
  const togglePlay = () => {
    if (isMock) {
      setIsPlaying(!isPlaying);
    } else {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch((err) => {
            console.error("Playback start error:", err);
          });
        }
      }
    }
  };

  // Sync state if HTML5 Video is used
  useEffect(() => {
    if (isMock) {
      if (isPlaying) {
        playbackIntervalRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + playbackSpeed * 0.1;
            if (next >= totalDuration) {
              setIsPlaying(false);
              clearInterval(playbackIntervalRef.current);
              return 0;
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
        if (isPlaying) {
          v.play().catch(() => {});
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
  }, [isPlaying, isMock, playbackSpeed, totalDuration]);

  // Sync real HTML5 video state to React state
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isMock) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(v.currentTime);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [videoUrl, isMock]);

  // Mute controls
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  // Find active chapter by current time
  const getActiveChapter = (time: number): Chapter => {
    const active = chapters.find((c) => time >= c.startTime && time <= c.endTime);
    return active || chapters[0];
  };

  const activeChapter = getActiveChapter(currentTime);

  // Format second timestamps to MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
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
  const handleProgressBarInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * totalDuration;

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, totalDuration, isMuted, isTheaterMode]);

  // Fullscreen toggle API
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
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
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Fetch the active panel matching a given timestamp for thumbnail rendering
  const getPanelAtTime = (time: number): GeneratedPanel | null => {
    if (panels.length === 0) return null;
    let accumulatedTime = 0;
    for (const panel of panels) {
      const duration = panel.duration || 4.5;
      if (time >= accumulatedTime && time < accumulatedTime + duration) {
        return panel;
      }
      accumulatedTime += duration;
    }
    return panels[panels.length - 1];
  };

  const activePanelForHover = getPanelAtTime(hoverProgress.time);
  const activePanelNow = getPanelAtTime(currentTime);

  // Back Navigation handler
  const handleClose = () => {
    if (seriesSlug && chapterSlug) {
      navigateTo(`/workspace/editor/series/${seriesSlug}/chapters/${chapterSlug}`);
    } else {
      navigateTo("/dashboard");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col justify-center items-center bg-black overflow-hidden transition-all duration-300 ${
        isTheaterMode ? "w-full h-[85vh] lg:h-[90vh]" : "fixed inset-0 z-50 w-screen h-screen"
      }`}
    >
      {/* BACKGROUND GRAPHIC COMIC STYLED OVERLAYS */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-950/20 via-black to-black opacity-95 pointer-events-none z-0" />

      {/* RENDER ACTIVE SCREEN CANVAS CONTENT */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain max-h-full"
            playsInline
            onClick={togglePlay}
          />
        ) : (
          /* High Fidelity Animated Canvas preview if no raw video is compiled */
          <div className="relative w-full h-full flex items-center justify-center bg-[#060608]">
            {activePanelNow ? (
              <div className="relative max-w-full max-h-[85%] aspect-video overflow-hidden border border-neutral-900 rounded-3xl shadow-2xl flex items-center justify-center bg-neutral-950">
                {activePanelNow.layers ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Stacks custom background and separate character elements for deep immersion */}
                    <img
                      src={activePanelNow.layers.background_url}
                      className="absolute max-w-full max-h-full object-contain"
                      alt="Background"
                    />
                    <img
                      src={activePanelNow.layers.character_url}
                      className="absolute max-w-full max-h-full object-contain z-10 transition-transform duration-300"
                      style={{
                        transform: isPlaying ? "scale(1.05) translateY(-4px)" : "scale(1)",
                      }}
                      alt="Character"
                    />
                    {showSubtitles && activePanelNow.layers.text_url && (
                      <img
                        src={activePanelNow.layers.text_url}
                        className="absolute max-w-full max-h-full object-contain z-20"
                        alt="Subtitles Layer"
                      />
                    )}
                  </div>
                ) : (
                  <img
                    src={activePanelNow.image_url}
                    className="max-w-full max-h-full object-contain"
                    alt="Current Panel"
                  />
                )}
              </div>
            ) : (
              /* Simulated High Fidelity Cinematic Video Mock Screen */
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="relative w-64 h-36 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center mb-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 to-transparent animate-pulse" />
                  <div className="h-10 w-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-3">
                    <Sliders className="h-5 w-5 text-purple-400 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                    Simulated Cinematic Track
                  </span>
                </div>
                <h2 className="text-xl font-black font-sans text-neutral-100 tracking-tight mb-2">
                  Adaptation Cinema Studio
                </h2>
                <p className="text-xs text-neutral-500 max-w-sm leading-relaxed font-mono">
                  No direct MP4 compilation was found. Seamlessly playing back interactive storyboard timeline cuts and speech assets live.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SUBTITLES CAPTIONS OVERLAY (classic / karaoke styles) */}
        {showSubtitles && activePanelNow && activePanelNow.speech_text && (
          <div className="absolute bottom-28 left-4 right-4 z-20 text-center pointer-events-none animate-fade-in">
            <span
              className={`inline-block font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,1)] text-center text-sm md:text-base ${
                subtitlesStyle === "karaoke"
                  ? "bg-purple-600/95 text-white font-black border-2 border-white uppercase tracking-wide px-4 py-2 rounded-xl"
                  : "bg-black/80 text-white font-bold px-3.5 py-1.5 rounded-lg border border-neutral-800"
              }`}
            >
              {activePanelNow.speech_text}
            </span>
          </div>
        )}
      </div>

      {/* TOP BAR OVERLAYS (Chapter Title + Close button) */}
      <div
        className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-30 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center">
            <Monitor className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-purple-400 uppercase font-black tracking-widest block">
              Adaptation Player
            </span>
            <span className="text-xs font-bold text-neutral-200">
              {activeChapter ? `${activeChapter.title} Segment` : "Preview Track"}
            </span>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="h-10 w-10 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
          title="Back to Studio Workspace"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* BOTTOM CONTROL AND TIMELINE OVERLAYS */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-6 px-6 z-30 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* PROGRESS SCRUBBER ROW WITH HOVER TIMELINE MARKS & CHIPS */}
        <div className="relative group/scrub mb-4">

          {/* FLOATING PRECISE SEEKING POPUP CONTAINER */}
          {hoverProgress.isHovering && (
            <div
              className="absolute bottom-6 flex flex-col items-center z-40 transition-all duration-75 pointer-events-none"
              style={{
                left: `calc(${hoverProgress.percent * 100}% - 75px)`, // Center floating preview over mouse coordinate
              }}
            >
              <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-[150px] overflow-hidden">
                {/* Micro Thumbnail inside Seeking Box */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-950 flex items-center justify-center">
                  {activePanelForHover ? (
                    activePanelForHover.layers ? (
                      <>
                        <img
                          src={activePanelForHover.layers.background_url}
                          className="absolute inset-0 w-full h-full object-cover"
                          alt="Seeking Thumbnail BG"
                        />
                        <img
                          src={activePanelForHover.layers.character_url}
                          className="absolute inset-0 w-full h-full object-contain z-10"
                          alt="Seeking Thumbnail Char"
                        />
                      </>
                    ) : (
                      <img
                        src={activePanelForHover.image_url}
                        className="w-full h-full object-cover"
                        alt="Seeking Panel"
                      />
                    )
                  ) : (
                    /* High fidelity fallback vector */
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center">
                        <Sliders className="h-3 w-3 text-purple-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Micro text inside Seeking popup */}
                <div className="px-1 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono text-purple-400 tabular-nums">
                      {formatTime(hoverProgress.time)}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-950/60 rounded border border-neutral-800 text-neutral-400 uppercase">
                      {getActiveChapter(hoverProgress.time).title}
                    </span>
                  </div>
                  {activePanelForHover?.speech_text && (
                    <p className="text-[8px] text-neutral-500 truncate leading-normal font-sans mt-0.5">
                      "{activePanelForHover.speech_text}"
                    </p>
                  )}
                </div>
              </div>

              {/* Triangle pointer */}
              <div className="w-2.5 h-2.5 bg-neutral-900 border-r border-b border-neutral-800/80 rotate-45 -mt-1 shadow-md" />
            </div>
          )}

          {/* SENSITIVE INTERACTION TRACK BAR */}
          <div
            ref={progressBarRef}
            onClick={handleProgressBarInteraction}
            onMouseMove={handleProgressBarMouseMove}
            onMouseLeave={handleProgressBarMouseLeave}
            className="relative h-1.5 group-hover/scrub:h-2.5 bg-neutral-850 rounded-full cursor-pointer transition-all duration-150 flex items-center"
          >
            {/* Visual Chapter Markers */}
            {chapters.map((chapter, idx) => {
              if (idx === 0) return null;
              const markerPercent = (chapter.startTime / totalDuration) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-20"
                  style={{ left: `${markerPercent}%` }}
                />
              );
            })}

            {/* Playing progress bar */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-violet-400 rounded-full z-10"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />

            {/* Sliding cursor knob */}
            <div
              className="absolute h-3.5 w-3.5 bg-white border border-neutral-300 rounded-full shadow-lg opacity-0 group-hover/scrub:opacity-100 pointer-events-none transition-opacity duration-150 z-30"
              style={{
                left: `calc(${(currentTime / totalDuration) * 100}% - 7px)`,
              }}
            />
          </div>
        </div>

        {/* BUTTON CONTROLS LINE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* LEFT COMMANDS (Play, volume, timers, chapters label) */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={togglePlay}
              className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-950/20"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white translate-x-px" />}
            </button>

            {/* VOLUME BUTTON & SLIDER */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0) setIsMuted(false);
                }}
                className="w-16 accent-purple-500 bg-neutral-800 rounded-full h-1 cursor-pointer"
              />
            </div>

            {/* TIMERS INDICATORS */}
            <span className="text-[11px] font-mono text-neutral-300 tabular-nums select-none">
              {formatTime(currentTime)} <span className="text-neutral-600">/</span> {formatTime(totalDuration)}
            </span>

            {/* CHAPTER DROPDOWN SELECTION */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowChaptersMenu(!showChaptersMenu);
                  setShowSettings(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-850 rounded-xl border border-white/5 hover:border-white/10 text-[10px] font-mono text-neutral-300 transition-all cursor-pointer"
              >
                <span className="font-bold text-purple-400 capitalize">{activeChapter.title}</span>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </button>

              {/* FLOATING CHAPTERS DROPDOWN */}
              {showChaptersMenu && (
                <div className="absolute bottom-11 left-0 bg-neutral-900/95 border border-neutral-800/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md w-48 overflow-hidden flex flex-col gap-1 z-40 animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-neutral-800/60 mb-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black block">
                      Video Chapters
                    </span>
                  </div>
                  {chapters.map((chapter, idx) => {
                    const isActive = activeChapter.title === chapter.title;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentTime(chapter.startTime);
                          if (videoRef.current) videoRef.current.currentTime = chapter.startTime;
                          setShowChaptersMenu(false);
                        }}
                        className={`flex items-center justify-between px-3.5 py-2 text-left rounded-xl transition-all cursor-pointer text-xs ${
                          isActive
                            ? "bg-purple-950/30 border border-purple-900/40 text-purple-400 font-bold"
                            : "hover:bg-neutral-800/40 border border-transparent text-neutral-300"
                        }`}
                      >
                        <span>{chapter.title}</span>
                        <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                          {formatTime(chapter.startTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COMMANDS (Subtitles, speed, settings, theater, fullscreen) */}
          <div className="flex items-center gap-2">

            {/* SUBTITLES CAPTIONS TOGGLER */}
            <button
              onClick={() => {
                setShowSubtitles(!showSubtitles);
                if (addNotification) {
                  addNotification(
                    showSubtitles ? "Subtitles Hidden" : "Subtitles Visible",
                    "info"
                  );
                }
              }}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                showSubtitles
                  ? "bg-purple-900/25 border-purple-800/40 text-purple-400 hover:text-purple-300"
                  : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
              }`}
              title="Toggle Subtitles"
            >
              <Subtitles className="h-4.5 w-4.5" />
            </button>

            {/* SETTINGS GEAR TOGGLER */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowChaptersMenu(false);
                }}
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  showSettings
                    ? "bg-neutral-800 border-white/15 text-white"
                    : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
                }`}
                title="Playback Settings"
              >
                <Settings className={`h-4.5 w-4.5 ${showSettings ? "rotate-45" : ""} transition-transform duration-200`} />
              </button>

              {/* POPUP PLAYBACK SETTINGS MENU */}
              {showSettings && (
                <div className="absolute bottom-11 right-0 bg-neutral-900/95 border border-neutral-800/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md w-56 flex flex-col gap-3 z-40 animate-fade-in">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-black block mb-2 border-b border-neutral-800/60 pb-1.5">
                      Player Settings
                    </span>
                  </div>

                  {/* Speed tuner */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 block font-bold">Speed</label>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1.0">Normal</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2.0x</option>
                    </select>
                  </div>

                  {/* Quality Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 block font-bold">Quality</label>
                    <select
                      value={videoQuality}
                      onChange={(e) => setVideoQuality(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                    >
                      <option value="480p">480p (Mobile)</option>
                      <option value="720p">720p (Draft HD)</option>
                      <option value="1080p">1080p (Production Full HD)</option>
                    </select>
                  </div>

                  {/* Subtitle style Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 block font-bold">Subtitles Format</label>
                    <select
                      value={subtitlesStyle}
                      onChange={(e) => setSubtitlesStyle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
                    >
                      <option value="classic">Classic Captions</option>
                      <option value="karaoke">High-Retention Comic</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* THEATER MODE TOGGLER */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                isTheaterMode
                  ? "bg-purple-900/25 border-purple-800/40 text-purple-400 hover:text-purple-300"
                  : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
              }`}
              title="Theater Mode (T)"
            >
              <Monitor className="h-4.5 w-4.5" />
            </button>

            {/* FULLSCREEN TOGGLER */}
            <button
              onClick={toggleFullscreen}
              className="h-9 w-9 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all border border-transparent hover:border-white/5 cursor-pointer"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
