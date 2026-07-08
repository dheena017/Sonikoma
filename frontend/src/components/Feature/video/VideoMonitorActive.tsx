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
  const activeStoryboardPanel = panels[currentPanelIndex] || null;

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

  return (
    <div
      id="video_monitor_outer_wrapper"
      className="relative bg-neutral-950/40 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center p-0 w-full h-full"
    >
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
