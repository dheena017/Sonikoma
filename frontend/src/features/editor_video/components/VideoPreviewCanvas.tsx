import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ChevronDown,
  Film,
  Sliders,
} from "lucide-react";

interface VideoPreviewCanvasProps {
  panels?: any[];
  videoUrl?: string | null;
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  storyboardPlaying?: boolean;
  toggleStoryboardPlayback?: () => void;
  aspectRatio?: string;
  setAspectRatio?: (ratio: string) => void;
}

const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  panels = [],
  videoUrl = null,
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  storyboardPlaying = false,
  toggleStoryboardPlayback,
  aspectRatio = "16:9",
  setAspectRatio,
}) => {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const isPlaying = storyboardPlaying || internalPlaying;

  const currentPanel = panels[currentPanelIndex];
  const activeImage =
    currentPanel?.img_url ||
    currentPanel?.image_url ||
    currentPanel?.panel_url ||
    currentPanel?.src ||
    currentPanel?.layers?.background_url ||
    null;

  const activeText =
    currentPanel?.text_narration ||
    currentPanel?.dialogue ||
    currentPanel?.speech_text ||
    null;

  // Reset image error state when active panel index or activeImage changes
  useEffect(() => {
    setImageError(false);
  }, [currentPanelIndex, activeImage]);

  const handlePlayToggle = () => {
    if (toggleStoryboardPlayback) {
      toggleStoryboardPlayback();
    } else {
      setInternalPlaying(!internalPlaying);
    }
  };

  const handlePrevFrame = () => {
    if (setCurrentPanelIndex && currentPanelIndex > 0) {
      setCurrentPanelIndex(currentPanelIndex - 1);
    }
  };

  const handleNextFrame = () => {
    if (setCurrentPanelIndex && currentPanelIndex < panels.length - 1) {
      setCurrentPanelIndex(currentPanelIndex + 1);
    }
  };

  return (
    <div className="flex-1 bg-[#09090e] border-r border-neutral-800/80 flex flex-col h-full min-w-0 select-none overflow-hidden">
      {/* Top Monitor Header */}
      <div className="h-10 px-4 border-b border-neutral-800/70 flex items-center justify-between shrink-0 bg-[#0b0b10]">
        <div className="flex items-center gap-2.5">
          <h2 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-white">
            VIDEO PREVIEW
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            LIVE
          </span>
          {panels.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-300 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800 cursor-pointer ml-1">
              <span>Scene {currentPanelIndex + 1} / {panels.length}</span>
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {videoUrl && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
              MP4 Live
            </span>
          )}
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="flex-1 relative bg-black flex items-center justify-center p-4 min-h-0 overflow-hidden group">
        <div
          className={`relative max-h-full max-w-full rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.9)] border border-neutral-800/80 group flex items-center justify-center bg-[#060608] ${
            aspectRatio === "9:16"
              ? "aspect-[9/16] h-full"
              : aspectRatio === "1:1"
              ? "aspect-square h-full"
              : "aspect-video w-full"
          }`}
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              controls={false}
              autoPlay
              loop
            />
          ) : activeImage && !imageError ? (
            <>
              <img
                src={activeImage}
                alt="Video Preview"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />

              {/* Futuristic Text Overlay */}
              {showSubtitles && activeText && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none px-4 max-w-lg">
                    <span className="text-xl sm:text-2xl font-black text-purple-300 tracking-wider font-sans drop-shadow-[0_0_16px_rgba(168,85,247,0.9)] uppercase">
                      {activeText}
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 w-full h-full bg-[#060608]">
              <div className="relative w-48 h-28 bg-neutral-900/50 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center mb-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 to-transparent animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-2">
                  <Sliders className="h-5 w-5 text-purple-400 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                  Simulated Cinematic Track
                </span>
              </div>
              <h3 className="text-base font-black font-sans text-neutral-100 tracking-tight mb-1">
                Adaptation Cinema Studio
              </h3>
              <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed font-mono">
                No direct MP4 compilation or panel image found. Seamlessly playing back interactive storyboard timeline cuts and speech assets live.
              </p>
            </div>
          )}

          {/* Canvas Play Overlay Button */}
          <button
            onClick={handlePlayToggle}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-purple-600/40 hover:bg-purple-600/70 backdrop-blur-md border border-purple-400/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 cursor-pointer shadow-[0_0_24px_rgba(168,85,247,0.6)]"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 fill-white" />
            ) : (
              <Play className="h-7 w-7 fill-white ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="h-12 px-4 border-t border-neutral-800/70 flex items-center justify-between shrink-0 bg-[#0b0b10] text-xs font-mono">
        {/* Timecode readout */}
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold">
            00:00:{currentPanelIndex < 9 ? `0${currentPanelIndex + 1}` : currentPanelIndex + 1}:00
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">
            00:00:{panels.length < 9 ? `0${panels.length}` : panels.length}:00
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPanelIndex?.(0)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="First Panel"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handlePrevFrame}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Previous Frame"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handlePlayToggle}
            className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95"
            title={isPlaying ? "Pause Playback" : "Start Playback"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white ml-0.5" />
            )}
          </button>
          <button
            onClick={handleNextFrame}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Next Frame"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCurrentPanelIndex?.(panels.length - 1)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Last Panel"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Aspect Ratio & Fullscreen */}
        <div className="flex items-center gap-3">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio?.(e.target.value)}
            className="bg-neutral-900 text-neutral-200 border border-neutral-800 rounded px-2 py-1 text-xs cursor-pointer outline-none focus:border-purple-500 font-mono"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait / Reels)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Standard)</option>
          </select>
          <button className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoPreviewCanvas);
