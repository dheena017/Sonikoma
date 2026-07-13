import React from "react";
import { Film, RefreshCw, Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, Volume2, VolumeX } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { getPanelFilterStyle } from "@/utils";

interface VideoMonitorActiveProps {
  activePreviewTab: "video" | "timeline";
  videoUrl: string | null;
  panels: GeneratedPanel[];
  aspectRatio: "auto" | "9:16" | "16:9";
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  currentPanelIndex: number;
  playbackTime: number;
  reprocessingPanelId: number | null;
  storyboardPlaying: boolean;
  isMuted?: boolean;
  setCurrentPanelIndex: (idx: number) => void;
  setPlaybackTime: (time: number) => void;
  setStoryboardPlaying: (playing: boolean) => void;
  setIsMuted?: (muted: boolean) => void;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
}

export function VideoMonitorActive({
  activePreviewTab,
  videoUrl,
  panels,
  aspectRatio,
  videoPlayerRef,
  currentPanelIndex,
  playbackTime,
  reprocessingPanelId,
  storyboardPlaying,
  isMuted = false,
  setCurrentPanelIndex,
  setPlaybackTime,
  setStoryboardPlaying,
  setIsMuted,
  toggleStoryboardPlayback,
  resetStoryboardPlayback,
}: VideoMonitorActiveProps) {
  const [videoCurrentTime, setVideoCurrentTime] = React.useState(0);
  const [bgDims, setBgDims] = React.useState<{ w: number; h: number } | null>(null);
  const activeStoryboardPanel = panels[currentPanelIndex] || null;
  const textLayerRef = React.useRef<HTMLImageElement>(null);
  const outerWrapperRef = React.useRef<HTMLDivElement>(null);
  const shakeTimeoutRef = React.useRef<any>(null);

  // Precise seeking state parameters
  const [hoverProgress, setHoverProgress] = React.useState<{
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

  // Fast-forward hold and HUD guide state parameters
  const [isFastForwarding, setIsFastForwarding] = React.useState(false);
  const [showHudHelp, setShowHudHelp] = React.useState(false);
  const spaceTimerRef = React.useRef<any>(null);
  const baseSpeedRef = React.useRef(1.0);

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const dur = activeStoryboardPanel?.duration || 4.5;
    const targetTime = percentage * dur;

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

  // Image preloading effect to prevent visual flashing during scrubbing
  React.useEffect(() => {
    if (panels.length === 0) return;
    const indices = [currentPanelIndex - 1, currentPanelIndex + 1];
    indices.forEach(idx => {
      if (idx >= 0 && idx < panels.length) {
        const p = panels[idx];
        if (p.image_url) {
          const img = new Image();
          img.src = p.image_url;
        }
        if (p.layers) {
          if (p.layers.background_url) {
            const bg = new Image();
            bg.src = p.layers.background_url;
          }
          if (p.layers.character_url) {
            const char = new Image();
            char.src = p.layers.character_url;
          }
        }
      }
    });
  }, [currentPanelIndex, panels]);

  // Keydown event listener for comma/period frame stepping & spacebar hold-to-2x fast-forward & HUD
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePreviewTab !== "timeline" || !activeStoryboardPanel) return;

      // Don't trigger if user is typing in form inputs
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "," || e.key === "<") {
        // Step back 1 frame (0.1 seconds)
        e.preventDefault();
        setPlaybackTime(Math.max(0, parseFloat((playbackTime - 0.1).toFixed(1))));
      } else if (e.key === "." || e.key === ">") {
        // Step forward 1 frame (0.1 seconds)
        e.preventDefault();
        const dur = activeStoryboardPanel.duration || 4.5;
        setPlaybackTime(Math.min(dur, parseFloat((playbackTime + 0.1).toFixed(1))));
      } else if (e.key === "?" || e.key === "/") {
        setShowHudHelp(true);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (!spaceTimerRef.current) {
          spaceTimerRef.current = setTimeout(() => {
            // Hold detected: enter fast-forward mode
            setIsFastForwarding(true);
            if (videoPlayerRef.current) {
              videoPlayerRef.current.playbackRate = 2.0;
            }
          }, 450);
        }
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
          if (videoPlayerRef.current) {
            videoPlayerRef.current.playbackRate = baseSpeedRef.current;
          }
        } else {
          // Short press: trigger standard play/pause
          toggleStoryboardPlayback();
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
  }, [activePreviewTab, playbackTime, activeStoryboardPanel, isFastForwarding]);

  React.useEffect(() => {
    setBgDims(null);
  }, [currentPanelIndex]);

  // Helper to split and chunk long subtitle dialogues
  const getSubtitleChunk = (
    text: string,
    duration: number,
    currentTime: number
  ): string => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= 8) return text;

    // Group words into segments of ~7 words
    const maxWords = 7;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(" "));
    }

    const progress = Math.max(0, Math.min(0.999, currentTime / duration));
    const chunkIndex = Math.floor(progress * chunks.length);
    return chunks[chunkIndex] || "";
  };

  React.useEffect(() => {
    setVideoCurrentTime(0);
  }, [videoUrl, activePreviewTab]);

  // Find active panel and relative time during video playback
  let activeVideoPanel: GeneratedPanel | null = null;
  let relativeVideoTime = 0;

  if (activePreviewTab === "video" && videoUrl) {
    let accumulatedTime = 0;
    for (const panel of panels) {
      const pDur = panel.duration || 4.5;
      if (
        videoCurrentTime >= accumulatedTime &&
        videoCurrentTime < accumulatedTime + pDur
      ) {
        activeVideoPanel = panel;
        relativeVideoTime = videoCurrentTime - accumulatedTime;
        break;
      }
      accumulatedTime += pDur;
    }
    if (
      !activeVideoPanel &&
      panels.length > 0 &&
      videoCurrentTime >= accumulatedTime
    ) {
      activeVideoPanel = panels[panels.length - 1];
      relativeVideoTime = (activeVideoPanel.duration || 4.5) - 0.01;
    }
  }

  const activePanelForCurrentTab = activePreviewTab === "video" ? activeVideoPanel : activeStoryboardPanel;
  const currentTimeForCurrentTab = activePreviewTab === "video" ? relativeVideoTime : playbackTime;

  React.useEffect(() => {
    const handleTimeUpdate = (e: Event) => {
      const time = (e as CustomEvent).detail;
      if (!activePanelForCurrentTab) return;

      // Real-time camera shake visual rendering
      if (activePanelForCurrentTab.audio_reactive_shake && outerWrapperRef.current) {
        const frameIdx = Math.floor(time * 10.0);
        const peaks = activePanelForCurrentTab.syncMap?.audio_peaks;
        const peakVal = peaks ? peaks[frameIdx] : 0.0;

        if (peakVal > 0.85) {
          if (!outerWrapperRef.current.classList.contains("camera-shake-active")) {
            outerWrapperRef.current.classList.add("camera-shake-active");
            if (shakeTimeoutRef.current) {
              clearTimeout(shakeTimeoutRef.current);
            }
            shakeTimeoutRef.current = setTimeout(() => {
              outerWrapperRef.current?.classList.remove("camera-shake-active");
            }, 200);
          }
        }
      }

      if (!textLayerRef.current || !activePanelForCurrentTab.layers) return;

      if (activePanelForCurrentTab.layers.text_visible === false) {
        textLayerRef.current.style.opacity = "0";
        return;
      }

      const dialogueMap = activePanelForCurrentTab.syncMap?.dialogue_map;
      if (!dialogueMap || dialogueMap.length === 0) {
        textLayerRef.current.style.opacity = "1";
        return;
      }

      const isAnyBubbleActive = dialogueMap.some(
        (seg) => time >= seg.start_time && time <= seg.end_time
      );

      textLayerRef.current.style.opacity = isAnyBubbleActive ? "1" : "0";
    };

    window.addEventListener("storyboard-time-update", handleTimeUpdate);
    return () => {
      window.removeEventListener("storyboard-time-update", handleTimeUpdate);
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, [activePreviewTab, activePanelForCurrentTab]);

  const getInitialTextOpacity = (panel: GeneratedPanel | null, time: number): number => {
    if (!panel || !panel.layers) return 1;
    if (panel.layers.text_visible === false) return 0;
    const dialogueMap = panel.syncMap?.dialogue_map;
    if (!dialogueMap || dialogueMap.length === 0) return 1;
    const isAnyActive = dialogueMap.some(seg => time >= seg.start_time && time <= seg.end_time);
    return isAnyActive ? 1 : 0;
  };

  return (
    <div
      ref={outerWrapperRef}
      id="video_monitor_outer_wrapper"
      className="relative bg-neutral-950/40 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center p-0 w-full h-full"
    >
      {/* Dynamic style tag for high-performance monitor camera shake keyframes */}
      <style>{`
        @keyframes monitorShake {
          0% { transform: translate(2px, 2px) rotate(0deg); }
          10% { transform: translate(-2px, -3px) rotate(-1deg); }
          20% { transform: translate(-4px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 3px) rotate(0deg); }
          40% { transform: translate(2px, -2px) rotate(1deg); }
          50% { transform: translate(-2px, 3px) rotate(-1deg); }
          60% { transform: translate(-4px, 2px) rotate(0deg); }
          70% { transform: translate(3px, 2px) rotate(-1deg); }
          80% { transform: translate(-2px, -2px) rotate(1deg); }
          90% { transform: translate(3px, 3px) rotate(0deg); }
          100% { transform: translate(2px, -3px) rotate(-1deg); }
        }
        .camera-shake-active {
          animation: monitorShake 0.12s infinite;
        }
      `}</style>
      {/* Ambient Background Glow */}
      <div className="absolute h-56 w-56 rounded-full bg-purple-600/10 blur-3xl" />

      {/* IF NO VIDEO GENERATED YET -> SHOW ILLUSTRATIVE EMPTY STATE */}
      {!videoUrl && panels.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
            <Film className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-neutral-300 font-sans">
              Preview Screen Unallocated
            </p>
            <p className="text-[11px] text-neutral-500 max-w-[240px] leading-relaxed">
              Paste your target webtoon viewer URL on the left and click
              "Generate Video" to create your final video.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: HTML5 PREVIEWING MP4 PLAYER */}
      {videoUrl && activePreviewTab === "video" && (
        <div
          className="relative bg-black border border-neutral-800 overflow-hidden rounded-xl flex flex-col justify-between transition-all duration-300 shadow w-full"
          style={
            aspectRatio === "9:16"
              ? { maxWidth: "270px", aspectRatio: "9/16" }
              : { maxWidth: "100%", aspectRatio: "16/9" }
          }
        >
          <video
            ref={videoPlayerRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain bg-black"
            onPlay={() => setStoryboardPlaying(true)}
            onPause={() => setStoryboardPlaying(false)}
            onTimeUpdate={(e) => {
              const curTime = e.currentTarget.currentTime;
              setVideoCurrentTime(curTime);
              
              // Find matching panel and relative time to keep timeline in sync
              let accumulatedTime = 0;
              let panelIdx = 0;
              let relativeTime = curTime;
              for (let i = 0; i < panels.length; i++) {
                const pDur = panels[i].duration || 4.5;
                if (curTime >= accumulatedTime && curTime < accumulatedTime + pDur) {
                  panelIdx = i;
                  relativeTime = curTime - accumulatedTime;
                  break;
                }
                accumulatedTime += pDur;
              }
              if (curTime >= accumulatedTime && panels.length > 0) {
                panelIdx = panels.length - 1;
                relativeTime = (panels[panelIdx].duration || 4.5) - 0.01;
              }
              
              setCurrentPanelIndex(panelIdx);
              setPlaybackTime(relativeTime);
            }}
          />
        </div>
      )}

      {/* TAB 2: INTERACTIVE TIMELINE PREVIEW */}
      {panels.length > 0 &&
        activePreviewTab === "timeline" &&
        activeStoryboardPanel && (
          <div
            className="group relative bg-neutral-950 border border-neutral-800/80 overflow-hidden rounded-xl flex flex-col justify-between transition-all duration-300 shadow w-full text-center"
            style={
              aspectRatio === "9:16"
                ? { maxWidth: "270px", aspectRatio: "9/16" }
                : { maxWidth: "100%", aspectRatio: "16/9" }
            }
          >
            {/* Image under cinematic pan animations */}
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
              {activeStoryboardPanel.layers ? (
                <div 
                  className="relative flex items-center justify-center"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: bgDims ? `${bgDims.w} / ${bgDims.h}` : "auto",
                      width: bgDims ? (aspectRatio === "9:16" ? (bgDims.w / bgDims.h > 9 / 16 ? "100%" : "auto") : (bgDims.w / bgDims.h > 16 / 9 ? "100%" : "auto")) : "100%",
                      height: bgDims ? (aspectRatio === "9:16" ? (bgDims.w / bgDims.h > 9 / 16 ? "auto" : "100%") : (bgDims.w / bgDims.h > 16 / 9 ? "auto" : "100%")) : "100%",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  >
                    {/* Background Layer */}
                    {activeStoryboardPanel.layers.bg_visible !== false && (
                      <img
                        src={activeStoryboardPanel.layers.background_url}
                        alt="Background Layer"
                        className="absolute w-full h-full z-10"
                        referrerPolicy="no-referrer"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setBgDims({ w: img.naturalWidth, h: img.naturalHeight });
                        }}
                        style={{
                          objectFit: "fill",
                          transform:
                            activeStoryboardPanel.motion_type === "zoom_in"
                              ? `scale(${1 + playbackTime * 0.015})`
                              : activeStoryboardPanel.motion_type === "zoom_out"
                              ? `scale(${1.1 - playbackTime * 0.015})`
                              : activeStoryboardPanel.motion_type === "pan_right"
                              ? `translateX(${playbackTime * 3}px)`
                              : activeStoryboardPanel.motion_type === "pan_left"
                              ? `translateX(${-playbackTime * 3}px)`
                              : activeStoryboardPanel.motion_type === "pan_down"
                              ? `translateY(${playbackTime * 3}px)`
                              : "",
                          transition: "transform 100ms linear",
                          filter: getPanelFilterStyle(activeStoryboardPanel),
                        }}
                      />
                    )}

                    {/* Character Layer */}
                    {activeStoryboardPanel.layers.char_visible !== false && (
                      <img
                        src={activeStoryboardPanel.layers.character_url}
                        alt="Character Layer"
                        className="absolute z-20 pointer-events-none"
                        referrerPolicy="no-referrer"
                        style={{
                          left: activeStoryboardPanel.layers.char_x !== undefined && bgDims
                            ? `${(activeStoryboardPanel.layers.char_x / bgDims.w) * 100}%`
                            : "0%",
                          top: activeStoryboardPanel.layers.char_y !== undefined && bgDims
                            ? `${(activeStoryboardPanel.layers.char_y / bgDims.h) * 100}%`
                            : "0%",
                          width: activeStoryboardPanel.layers.char_scale_x !== undefined
                            ? `${activeStoryboardPanel.layers.char_scale_x * 100}%`
                            : "100%",
                          height: activeStoryboardPanel.layers.char_scale_y !== undefined
                            ? `${activeStoryboardPanel.layers.char_scale_y * 100}%`
                            : "100%",
                          objectFit: "fill",
                          transform:
                            activeStoryboardPanel.motion_type === "zoom_in"
                              ? `scale(${1 + playbackTime * 0.035})`
                              : activeStoryboardPanel.motion_type === "zoom_out"
                              ? `scale(${1.25 - playbackTime * 0.035})`
                              : activeStoryboardPanel.motion_type === "pan_right"
                              ? `translateX(${playbackTime * 6}px)`
                              : activeStoryboardPanel.motion_type === "pan_left"
                              ? `translateX(${-playbackTime * 6}px)`
                              : activeStoryboardPanel.motion_type === "pan_down"
                              ? `translateY(${playbackTime * 6}px)`
                              : "",
                          transition: "transform 100ms linear",
                          filter: getPanelFilterStyle(activeStoryboardPanel),
                        }}
                      />
                    )}

                    {/* Text Bubbles Layer */}
                    <img
                      ref={textLayerRef}
                      src={activeStoryboardPanel.layers.text_url}
                      alt="Text Bubbles Layer"
                      className="absolute z-30 pointer-events-none transition-opacity duration-150"
                      referrerPolicy="no-referrer"
                      style={{
                        left: activeStoryboardPanel.layers.text_x !== undefined && bgDims
                          ? `${(activeStoryboardPanel.layers.text_x / bgDims.w) * 100}%`
                          : "0%",
                        top: activeStoryboardPanel.layers.text_y !== undefined && bgDims
                          ? `${(activeStoryboardPanel.layers.text_y / bgDims.h) * 100}%`
                          : "0%",
                        width: activeStoryboardPanel.layers.text_scale_x !== undefined
                          ? `${activeStoryboardPanel.layers.text_scale_x * 100}%`
                          : "100%",
                        height: activeStoryboardPanel.layers.text_scale_y !== undefined
                          ? `${activeStoryboardPanel.layers.text_scale_y * 100}%`
                          : "100%",
                        objectFit: "fill",
                        opacity: getInitialTextOpacity(activeStoryboardPanel, playbackTime),
                        filter: getPanelFilterStyle(activeStoryboardPanel),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <img
                  src={activeStoryboardPanel.image_url}
                  alt="Active Frame"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  style={{
                    transform:
                      activeStoryboardPanel.motion_type === "zoom_in"
                        ? `scale(${1 + playbackTime * 0.02})`
                        : activeStoryboardPanel.motion_type === "zoom_out"
                        ? `scale(${1.15 - playbackTime * 0.02})`
                        : activeStoryboardPanel.motion_type === "pan_right"
                        ? `translateX(${playbackTime * 4}px)`
                        : activeStoryboardPanel.motion_type === "pan_left"
                        ? `translateX(${-playbackTime * 4}px)`
                        : activeStoryboardPanel.motion_type === "pan_down"
                        ? `translateY(${playbackTime * 4}px)`
                        : "",
                    transition: "transform 100ms linear",
                    filter: getPanelFilterStyle(activeStoryboardPanel),
                  }}
                />
              )}
            </div>

            {/* Visual HUD help overlay */}
            {showHudHelp && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-40 animate-fade-in p-6">
                <div className="h-10 w-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-1">
                  <Sliders className="h-5 w-5 text-purple-400 animate-pulse" />
                </div>
                <h4 className="text-xs font-mono text-purple-300 font-bold uppercase tracking-widest">
                  Keyboard HUD Shortcuts
                </h4>
                <div className="grid grid-cols-2 gap-4 max-w-md text-left text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">Space</span>
                    <span>Play/Pause / Hold to 2x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">,</span>
                    <span>Step Frame Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">.</span>
                    <span>Step Frame Forward</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">Shift</span>
                    <span>Snap to Panel Ends</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">?</span>
                    <span>Show This HUD</span>
                  </div>
                </div>
              </div>
            )}

            {/* Reprocessing OCR/CV Recalculation overlay */}
            {reprocessingPanelId === activeStoryboardPanel.id && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-30">
                <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
                <p className="text-xs font-mono text-purple-300 font-semibold tracking-wider">
                  Recalculating Crop Area...
                </p>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Updating boundaries live
                </p>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

            {/* Subtitle badge inside storyboard preview */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-neutral-300 select-none">
              <span className="bg-black/80 px-2 py-1 rounded border border-neutral-800/50">
                FRAME #{activeStoryboardPanel.id}
              </span>
              <span className="bg-purple-950/85 text-purple-400 px-2 py-0.5 rounded border border-purple-800/40">
                TIMELINE PREVIEW
              </span>
            </div>

            {/* Playback Controls — YouTube-style bar always at bottom */}
            <div
              className="absolute inset-x-0 bottom-0 z-20"
              style={{ pointerEvents: "auto" }}
            >
              {/* Scrubber row */}
              <div className="px-2 pt-2 group/scrub relative">
                {/* Precise Seeking Preview popup on hover */}
                {hoverProgress.isHovering && activeStoryboardPanel && (
                  <div
                    className="absolute bottom-6 flex flex-col items-center z-40 transition-all duration-75 pointer-events-none"
                    style={{
                      left: `calc(${hoverProgress.percent * 100}% - 65px)`,
                    }}
                  >
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-1 shadow-2xl backdrop-blur-md flex flex-col gap-0.5 w-[130px] overflow-hidden">
                      {/* Mini Thumbnail */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center border border-neutral-900">
                        {activeStoryboardPanel.layers ? (
                          <>
                            <img
                              src={activeStoryboardPanel.layers.background_url}
                              className="absolute inset-0 w-full h-full object-cover"
                              alt="Background Mini"
                            />
                            <img
                              src={activeStoryboardPanel.layers.character_url}
                              className="absolute inset-0 w-full h-full object-contain z-10"
                              alt="Character Mini"
                            />
                          </>
                        ) : (
                          <img
                            src={activeStoryboardPanel.image_url}
                            className="w-full h-full object-cover"
                            alt="Frame Mini"
                          />
                        )}
                      </div>
                      <div className="px-1 flex items-center justify-between text-[9px] font-mono text-neutral-300">
                        <span className="font-bold text-purple-400">
                          {hoverProgress.time.toFixed(1)}s
                        </span>
                        <span className="text-[8px] bg-neutral-900 border border-neutral-800 px-1 rounded text-neutral-400 font-bold uppercase">
                          STORY
                        </span>
                      </div>
                    </div>
                    {/* Tooltip triangle indicator */}
                    <div className="w-1.5 h-1.5 bg-neutral-950 border-r border-b border-neutral-800 rotate-45 -mt-0.5" />
                  </div>
                )}

                <div
                  className="relative h-2 bg-white/10 rounded-full overflow-visible cursor-pointer transition-all duration-150 flex items-center"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const dur = activeStoryboardPanel?.duration || 4.5;
                    let targetTime = pct * dur;

                    // Shift-key boundary snapping to 0 or panel end
                    if (e.shiftKey) {
                      if (targetTime < dur / 2) {
                        targetTime = 0;
                      } else {
                        targetTime = dur;
                      }
                    }

                    setPlaybackTime(parseFloat(targetTime.toFixed(1)));
                  }}
                  onMouseMove={handleProgressBarMouseMove}
                  onMouseLeave={handleProgressBarMouseLeave}
                >
                  {/* Faint Audio Peaks Waveform in scrubber background */}
                  {activeStoryboardPanel?.syncMap?.audio_peaks && (
                    <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none opacity-30">
                      {activeStoryboardPanel.syncMap.audio_peaks.filter((_, i) => i % 2 === 0).map((peak, idx) => (
                        <div
                          key={idx}
                          className="w-[1.5px] bg-[#b249f8]/45 rounded-full"
                          style={{
                            height: `${Math.max(15, peak * 100)}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Played fill - Styled with exact brilliant purple matching the screenshot */}
                  <div
                    className="absolute top-0 left-0 h-full bg-[#b249f8] rounded-full transition-all duration-100"
                    style={{
                      width: activeStoryboardPanel
                        ? `${Math.min((playbackTime / (activeStoryboardPanel.duration || 4.5)) * 100, 100)}%`
                        : "0%",
                    }}
                  />
                  {/* Scrubber knob */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 bg-[#b249f8] rounded-full shadow-lg opacity-0 group-hover/scrub:opacity-100 transition-opacity duration-100 pointer-events-none"
                    style={{
                      left: activeStoryboardPanel
                        ? `${Math.min((playbackTime / (activeStoryboardPanel.duration || 4.5)) * 100, 100)}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Control row */}
              <div
                className="flex items-center justify-between px-2.5 py-2.5 gap-2 bg-[#060608]/90"
              >
                {/* LEFT: Play + Prev/Next + Mute + Time + [SFX Description] */}
                <div className="flex items-center gap-3">
                  {/* Play / Pause */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStoryboardPlayback(); }}
                    className="flex items-center justify-center text-white hover:text-purple-400 active:scale-90 transition-all duration-100 cursor-pointer"
                    title={storyboardPlaying ? "Pause" : "Play"}
                  >
                    {storyboardPlaying
                      ? <Pause className="h-4.5 w-4.5 fill-white text-white" />
                      : <Play className="h-4.5 w-4.5 fill-white text-white translate-x-px" />}
                  </button>

                  {/* Skip Back */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (currentPanelIndex > 0) { setCurrentPanelIndex(currentPanelIndex - 1); setPlaybackTime(0); } }}
                    disabled={currentPanelIndex === 0}
                    className="flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all duration-100 cursor-pointer"
                    title="Previous Panel"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (currentPanelIndex < panels.length - 1) { setCurrentPanelIndex(currentPanelIndex + 1); setPlaybackTime(0); } }}
                    disabled={currentPanelIndex >= panels.length - 1}
                    className="flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all duration-100 cursor-pointer"
                    title="Next Panel"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  {/* Mute / Unmute */}
                  {setIsMuted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                      className="flex items-center justify-center text-neutral-400 hover:text-white active:scale-90 transition-all duration-100 cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted
                        ? <VolumeX className="h-4 w-4" />
                        : <Volume2 className="h-4 w-4" />}
                    </button>
                  )}

                  {/* Time display: matches 3s / 3s - [SFX] */}
                  <span className="text-[10px] font-mono text-neutral-300 tabular-nums select-none flex items-center gap-1">
                    <span>{Math.floor(playbackTime)}s</span>
                    <span className="text-neutral-500">/</span>
                    <span>{Math.floor(activeStoryboardPanel?.duration || 4.5)}s</span>
                    {activeStoryboardPanel?.sfx && (
                      <span className="text-neutral-400 font-sans ml-1 text-[9px] truncate max-w-[150px]">
                        - [{activeStoryboardPanel.sfx}]
                      </span>
                    )}
                  </span>
                </div>

                {/* RIGHT: Panel Index + Fast Double Chevrons */}
                <div className="flex items-center gap-2.5">
                  {/* Counter badge: e.g., 3/26 */}
                  <span className="text-[10px] font-mono text-neutral-400 tabular-nums select-none">
                    {currentPanelIndex + 1}/{panels.length}
                  </span>

                  {/* Double chevron left (Fast rewind) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); resetStoryboardPlayback(); }}
                    className="flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all duration-100 cursor-pointer"
                    title="Restart"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  {/* Double chevron right (Fast skip to end) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (panels.length > 0) { setCurrentPanelIndex(panels.length - 1); setPlaybackTime(0); } }}
                    disabled={currentPanelIndex >= panels.length - 1}
                    className="flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-100 cursor-pointer"
                    title="Last Panel"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtitles Overlay — premium pill-shaped black box with white uppercase text */}
            <div className="absolute bottom-16 left-3 right-3 z-10 text-center pointer-events-none">
              {activeStoryboardPanel.speech_text?.trim() && (
                <div className="inline-block bg-black/90 px-5 py-2.5 rounded-full border border-white/5 backdrop-blur-sm max-w-lg mx-auto shadow-2xl">
                  <p className="text-white font-sans font-black text-[10px] tracking-wider text-center uppercase">
                    {getSubtitleChunk(
                      activeStoryboardPanel.speech_text,
                      activeStoryboardPanel.duration || 4.5,
                      playbackTime
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
