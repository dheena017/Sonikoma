import React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
  Subtitles,
  Settings,
  Tv,
  Maximize2,
  Minimize2,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { GeneratedPanel } from "@/shared/types";

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

interface HoverProgress {
  percent: number;
  time: number;
  clientX: number;
  isHovering: boolean;
}

export interface VideoPreviewBottomControlsProps {
  visible: boolean;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  handleProgressBarInteraction: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressBarMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressBarMouseLeave: () => void;
  hoverProgress: HoverProgress;
  activePanelForHover: GeneratedPanel | null;
  chapters: Chapter[];
  activeChapter?: Chapter | null;
  totalDuration: number;
  currentTime: number;
  formatTime: (sec: number) => string;
  getActiveChapter?: (time: number) => Chapter | null;
  handleSkipBackward: () => void;
  handleSkipForward: () => void;
  togglePlay: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  showChaptersMenu: boolean;
  setShowChaptersMenu: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  showSubtitles: boolean;
  setShowSubtitles: (val: boolean) => void;
  togglePictureInPicture: () => void;
  variant?: "floating" | "theater" | "embedded";
  isTheaterMode: boolean;
  setIsTheaterMode: (val: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  addNotification?: (msg: string, type: any) => void;
}

export const VideoPreviewBottomControls: React.FC<
  VideoPreviewBottomControlsProps
> = ({
  visible,
  progressBarRef,
  handleProgressBarInteraction,
  handleProgressBarMouseMove,
  handleProgressBarMouseLeave,
  hoverProgress,
  activePanelForHover,
  chapters,
  activeChapter,
  totalDuration,
  currentTime,
  formatTime,
  getActiveChapter,
  handleSkipBackward,
  handleSkipForward,
  togglePlay,
  isPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  showChaptersMenu,
  setShowChaptersMenu,
  showSettings,
  setShowSettings,
  isLooping,
  setIsLooping,
  showSubtitles,
  setShowSubtitles,
  togglePictureInPicture,
  variant,
  isTheaterMode,
  setIsTheaterMode,
  toggleFullscreen,
  isFullscreen,
  addNotification,
}) => {
  return (
    <div
      className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-12 pb-6 px-6 z-30 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* PROGRESS SCRUBBER ROW WITH HOVER TIMELINE MARKS & CHIPS */}
      <div className="relative group/scrub mb-4">
        {/* FLOATING PRECISE SEEKING POPUP CONTAINER */}
        {hoverProgress.isHovering && (
          <div
            className="absolute bottom-6 flex flex-col items-center z-45 transition-all duration-75 pointer-events-none w-48"
            style={{
              left: `${Math.max(10, Math.min(90, hoverProgress.percent * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="bg-neutral-900/95 border border-neutral-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col gap-1.5 w-full overflow-hidden">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-950 flex items-center justify-center">
                {activePanelForHover ? (
                  activePanelForHover.layers ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {activePanelForHover.layers.background_url && (
                        <img
                          src={activePanelForHover.layers.background_url}
                          className="absolute inset-0 w-full h-full object-cover"
                          alt="Seeking Thumbnail BG"
                        />
                      )}
                      {activePanelForHover.layers.character_url && (
                        <img
                          src={activePanelForHover.layers.character_url}
                          className="absolute inset-0 w-full h-full object-contain z-10"
                          alt="Seeking Thumbnail Char"
                        />
                      )}
                      {activePanelForHover.layers.text_url && (
                        <img
                          src={activePanelForHover.layers.text_url}
                          className="absolute inset-0 w-full h-full object-contain z-20"
                          alt="Seeking Thumbnail Text"
                        />
                      )}
                    </div>
                  ) : (
                    <img
                      src={
                        activePanelForHover.image_url ||
                        (activePanelForHover as any).imageUrl ||
                        (activePanelForHover as any).img_url ||
                        (activePanelForHover as any).panel_url ||
                        (activePanelForHover as any).url ||
                        ""
                      }
                      className="w-full h-full object-cover"
                      alt="Seeking Panel"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="h-6 w-6 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                      <Sliders className="h-3.5 w-3.5 text-[#3B82F6]" />
                    </div>
                  </div>
                )}

                {/* Floating timestamp badge directly on preview image */}
                <div className="absolute bottom-1.5 left-1.5 z-30 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-white shadow">
                  {formatTime(hoverProgress.time)}
                </div>
              </div>

              <div className="px-1 py-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-[#3B82F6] font-semibold tabular-nums">
                    {formatTime(hoverProgress.time)} / {formatTime(totalDuration)}
                  </span>
                  {getActiveChapter?.(hoverProgress.time)?.title && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-950/80 rounded border border-neutral-800 text-neutral-300 uppercase truncate max-w-[80px]">
                      {getActiveChapter(hoverProgress.time)!.title}
                    </span>
                  )}
                </div>
                {activePanelForHover?.speech_text && (
                  <p className="text-[9px] text-neutral-300 italic truncate leading-snug font-sans mt-1">
                    "{activePanelForHover.speech_text}"
                  </p>
                )}
              </div>
            </div>

            {/* DIRECTLY CENTERED POINTER ARROW */}
            <div className="w-2.5 h-2.5 bg-neutral-900 border-r border-b border-neutral-700/80 -mt-1.5 rotate-45 shadow-md relative z-10" />
          </div>
        )}

        {/* SENSITIVE INTERACTION TRACK BAR */}
        <div
          ref={progressBarRef}
          onMouseDown={handleProgressBarInteraction}
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={handleProgressBarMouseLeave}
          className="relative h-1.5 group-hover/scrub:h-2 bg-neutral-800/90 rounded-full cursor-pointer transition-all duration-200 flex items-center"
        >
          {chapters.map((chapter, idx) => {
            if (idx === 0) return null;
            const markerPercent =
              totalDuration > 0 ? (chapter.startTime / totalDuration) * 100 : 0;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5 bg-black/80 z-20"
                style={{ left: `${markerPercent}%` }}
              />
            );
          })}

          {/* HOVER PREVIEW TRACK EXTENSION */}
          {hoverProgress.isHovering && (
            <div
              className="absolute top-0 left-0 h-full bg-white/20 rounded-full z-[5] pointer-events-none transition-all duration-75"
              style={{
                width: `${Math.max(0, Math.min(100, hoverProgress.percent * 100))}%`,
              }}
            />
          )}

          {/* ACTIVE PLAYBACK PROGRESS FILL */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full z-10"
            style={{
              width: `${
                totalDuration > 0
                  ? Math.max(0, Math.min(100, (currentTime / totalDuration) * 100))
                  : 0
              }%`,
            }}
          />

          {/* HOVER PREVIEW SEEK CIRCLE */}
          {hoverProgress.isHovering && (
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full aspect-square bg-white/90 border border-[#3B82F6] shadow-sm pointer-events-none z-25 transition-transform duration-75"
              style={{
                left: `${Math.max(0, Math.min(100, hoverProgress.percent * 100))}%`,
              }}
            />
          )}

          {/* CURRENT PLAYHEAD CIRCLE */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full aspect-square bg-white border-2 border-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.7)] group-hover/scrub:scale-125 pointer-events-none transition-transform duration-150 z-30"
            style={{
              left: `${
                totalDuration > 0
                  ? Math.max(0, Math.min(100, (currentTime / totalDuration) * 100))
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* BUTTON CONTROLS LINE */}
      <div className="flex items-center justify-between gap-4 px-2 py-1">
        {/* LEFT COMMANDS */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSkipBackward}
            className="h-8 w-8 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip backward 10s"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] border border-blue-400/40 shadow-md shadow-blue-500/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white translate-x-px" />
            )}
          </button>

          <button
            onClick={handleSkipForward}
            className="h-8 w-8 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip forward 10s"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* VOLUME BUTTON & SLIDER */}
          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center overflow-hidden transition-all duration-200 max-w-0 opacity-0 group-hover/volume:max-w-44 group-hover/volume:opacity-100">
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
                className="w-24 accent-purple-500 bg-neutral-800 rounded-full h-1 cursor-pointer"
              />
            </div>
          </div>

          {/* TIMERS INDICATORS */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-mono font-medium text-neutral-200 tabular-nums select-none">
              {formatTime(currentTime)}{" "}
              <span className="text-neutral-600">/</span>{" "}
              {formatTime(totalDuration)}
            </span>
          </div>

          {/* CHAPTER DROPDOWN SELECTION */}
          {chapters && chapters.length > 1 && activeChapter && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowChaptersMenu(!showChaptersMenu);
                  setShowSettings(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl border border-white/10 text-[11px] font-mono text-neutral-300 transition-all cursor-pointer"
              >
                <span className="font-bold text-[#3B82F6] capitalize">
                  {activeChapter.title}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COMMANDS */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsLooping(!isLooping);
              if (addNotification)
                addNotification(
                  isLooping
                    ? "Loop Playback Disabled"
                    : "Loop Playback Enabled",
                  "info"
                );
            }}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              isLooping
                ? "bg-[#2A2A2A] border-[#3B82F6]/50 text-[#60A5FA]"
                : "hover:bg-neutral-800/80 text-neutral-400 hover:text-white border-transparent"
            }`}
            title="Loop Playback (L)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setShowSubtitles(!showSubtitles);
              if (addNotification)
                addNotification(
                  showSubtitles ? "Subtitles Disabled" : "Subtitles Enabled",
                  "info"
                );
            }}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              showSubtitles
                ? "bg-[#2A2A2A] border-[#3B82F6]/50 text-[#60A5FA]"
                : "hover:bg-neutral-800/80 text-neutral-400 hover:text-white border-transparent"
            }`}
            title="Toggle Subtitles"
          >
            <Subtitles className="h-4 w-4" />
          </button>

          <button
            onClick={togglePictureInPicture}
            className="h-8 w-8 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Picture-in-Picture Mode (P)"
          >
            <Tv className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowChaptersMenu(false);
            }}
            className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
              showSettings
                ? "bg-[#2A2A2A] border-[#3B82F6]/50 text-[#60A5FA]"
                : "hover:bg-neutral-800/80 text-neutral-400 hover:text-white border-transparent"
            }`}
            title="Playback Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {variant !== "floating" && (
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                isTheaterMode
                  ? "bg-[#2A2A2A] border-[#3B82F6]/50 text-[#60A5FA]"
                  : "hover:bg-neutral-800/80 text-neutral-400 hover:text-white border-transparent"
              }`}
              title="Toggle Theater Mode (T)"
            >
              <Sliders className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
