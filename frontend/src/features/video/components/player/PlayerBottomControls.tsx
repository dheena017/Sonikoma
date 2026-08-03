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
import { GeneratedPanel } from "@/types";

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

interface PlayerBottomControlsProps {
  visible: boolean;
  progressBarRef: React.RefObject<HTMLDivElement>;
  handleProgressBarInteraction: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressBarMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleProgressBarMouseLeave: () => void;
  hoverProgress: HoverProgress;
  activePanelForHover: GeneratedPanel | null;
  chapters: Chapter[];
  activeChapter: Chapter;
  totalDuration: number;
  currentTime: number;
  formatTime: (sec: number) => string;
  getActiveChapter: (time: number) => Chapter;
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
  variant?: "floating" | "theater";
  isTheaterMode: boolean;
  setIsTheaterMode: (val: boolean) => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  addNotification?: (msg: string, type: any) => void;
}

export const PlayerBottomControls: React.FC<PlayerBottomControlsProps> = ({
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
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      {/* PROGRESS SCRUBBER ROW WITH HOVER TIMELINE MARKS & CHIPS */}
      <div className="relative group/scrub mb-4">
        {/* FLOATING PRECISE SEEKING POPUP CONTAINER */}
        {hoverProgress.isHovering && (
          <div
            className="absolute bottom-6 flex flex-col items-center z-45 transition-all duration-75 pointer-events-none w-[150px]"
            style={{
              left: `clamp(0px, calc(${hoverProgress.percent * 100}% - 75px), calc(100% - 150px))`,
            }}
          >
            <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-full overflow-hidden">
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
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="h-5 w-5 rounded bg-purple-500/10 flex items-center justify-center">
                      <Sliders className="h-3 w-3 text-purple-400" />
                    </div>
                  </div>
                )}
              </div>

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
            <div
              className="w-2.5 h-2.5 bg-neutral-900 border-r border-b border-neutral-800/80 -mt-1 shadow-md relative z-10"
              style={{
                transform: `translateX(clamp(-63px, calc(${hoverProgress.percent * 100}% - clamp(75px, ${hoverProgress.percent * 100}%, calc(100% - 75px))), 63px)) rotate(45deg)`,
              }}
            />
          </div>
        )}

        {/* SENSITIVE INTERACTION TRACK BAR */}
        <div
          ref={progressBarRef}
          onClick={handleProgressBarInteraction}
          onMouseMove={handleProgressBarMouseMove}
          onMouseLeave={handleProgressBarMouseLeave}
          className="relative h-1 bg-neutral-700 rounded-full cursor-pointer transition-all duration-200 flex items-center group/scrub"
        >
          {chapters.map((chapter, idx) => {
            if (idx === 0) return null;
            const markerPercent = totalDuration > 0 ? (chapter.startTime / totalDuration) * 100 : 0;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-20"
                style={{ left: `${markerPercent}%` }}
              />
            );
          })}

          <div
            className="absolute top-0 left-0 h-full bg-purple-600 rounded-full z-10"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />

          <div
            className="absolute top-1/2 -translate-y-1/2 h-0 w-0 bg-purple-600 rounded-full opacity-0 group-hover/scrub:opacity-100 group-hover/scrub:h-3.5 group-hover/scrub:w-3.5 pointer-events-none transition-all duration-200 z-30"
            style={{
              left: `calc(${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}% - 7px)`,
              boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 0 16px rgba(168,85,247,0.25)",
            }}
          />
        </div>
      </div>

      {/* BUTTON CONTROLS LINE */}
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        {/* LEFT COMMANDS */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleSkipBackward}
            className="h-8 w-8 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip backward 10s"
          >
            <SkipBack className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-950/20"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white translate-x-px" />}
          </button>

          <button
            onClick={handleSkipForward}
            className="h-8 w-8 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Skip forward 10s"
          >
            <SkipForward className="h-4.5 w-4.5" />
          </button>

          {/* VOLUME BUTTON & SLIDER */}
          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-300 tabular-nums select-none">
              {formatTime(currentTime)} <span className="text-neutral-600">/</span> {formatTime(totalDuration)}
            </span>
          </div>

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
          </div>
        </div>

        {/* RIGHT COMMANDS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLooping(!isLooping);
              if (addNotification) addNotification(isLooping ? "Loop Playback Disabled" : "Loop Playback Enabled", "info");
            }}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isLooping
                ? "bg-purple-900/25 border-purple-800/40 text-purple-400 hover:text-purple-300"
                : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
            }`}
            title="Loop Playback (L)"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => {
              setShowSubtitles(!showSubtitles);
              if (addNotification) addNotification(showSubtitles ? "Subtitles Disabled" : "Subtitles Enabled", "info");
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

          <button
            onClick={togglePictureInPicture}
            className="h-9 w-9 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Picture-in-Picture Mode (P)"
          >
            <Tv className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowChaptersMenu(false);
            }}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              showSettings
                ? "bg-purple-900/25 border-purple-800/40 text-purple-400 hover:text-purple-300"
                : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
            }`}
            title="Playback Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          {variant !== "floating" && (
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                isTheaterMode
                  ? "bg-purple-900/25 border-purple-800/40 text-purple-400 hover:text-purple-300"
                  : "hover:bg-neutral-800 text-neutral-400 hover:text-white border-transparent"
              }`}
              title="Toggle Theater Mode (T)"
            >
              <Sliders className="h-4.5 w-4.5" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="h-9 w-9 rounded-full hover:bg-neutral-800 border border-transparent hover:border-white/5 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
