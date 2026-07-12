import React from "react";
import { Film, RefreshCw } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { getPanelFilterStyle } from "@/utils";

interface VideoMonitorActiveProps {
  activePreviewTab: "video" | "timeline";
  videoUrl: string | null;
  panels: GeneratedPanel[];
  aspectRatio: "9:16" | "16:9";
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  currentPanelIndex: number;
  playbackTime: number;
  reprocessingPanelId: number | null;
  setCurrentPanelIndex: (idx: number) => void;
  setPlaybackTime: (time: number) => void;
  setStoryboardPlaying: (playing: boolean) => void;
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
  setCurrentPanelIndex,
  setPlaybackTime,
  setStoryboardPlaying,
}: VideoMonitorActiveProps) {
  const [videoCurrentTime, setVideoCurrentTime] = React.useState(0);
  const [bgDims, setBgDims] = React.useState<{ w: number; h: number } | null>(null);
  const activeStoryboardPanel = panels[currentPanelIndex] || null;
  const textLayerRef = React.useRef<HTMLImageElement>(null);
  const outerWrapperRef = React.useRef<HTMLDivElement>(null);
  const shakeTimeoutRef = React.useRef<any>(null);

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
            className="relative bg-neutral-950 border border-neutral-800/80 overflow-hidden rounded-xl flex flex-col justify-between transition-all duration-300 shadow w-full text-center"
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

            {/* Subtitles Overlay */}
            <div className="absolute bottom-4 left-3 right-3 z-10 text-center pointer-events-none">
              {activeStoryboardPanel.sfx && (
                <span className="hidden sm:inline-block transform -rotate-2 bg-yellow-500 text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-lg font-mono tracking-widest uppercase mb-1">
                  {activeStoryboardPanel.sfx}
                </span>
              )}
              {activeStoryboardPanel.speech_text?.trim() && (
                <p className="text-white font-bold text-xs leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-black/75 p-2.5 rounded-lg border border-white/5 backdrop-blur-xs text-center font-sans max-w-lg mx-auto">
                  {getSubtitleChunk(
                    activeStoryboardPanel.speech_text,
                    activeStoryboardPanel.duration || 4.5,
                    playbackTime
                  )}
                </p>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
