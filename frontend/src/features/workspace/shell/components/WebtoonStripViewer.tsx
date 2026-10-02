import React, { useState, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Tv,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { GeneratedPanel } from "@/shared/types";

interface WebtoonStripViewerProps {
  panels: GeneratedPanel[];
  format?: string;
  seriesTitle?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  onSwitchToVideo: () => void;
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
}

export const WebtoonStripViewer: React.FC<WebtoonStripViewerProps> = ({
  panels,
  format = "manhwa",
  seriesTitle,
  chapterTitle,
  chapterNumber,
  onSwitchToVideo,
  playStoryboardAudio,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [playingAudioIdx, setPlayingAudioIdx] = useState<number | null>(null);
  const [showBubbleOverlays, setShowBubbleOverlays] = useState<boolean>(true);
  const [screentoneFilter, setScreentoneFilter] = useState<boolean>(format === "comic_manga");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isManga = format === "comic_manga";

  const handlePlayAudio = (idx: number, url?: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingAudioIdx === idx) {
      setPlayingAudioIdx(null);
      return;
    }
    if (!url) {
      if (playStoryboardAudio) {
        playStoryboardAudio(idx, true);
        setPlayingAudioIdx(idx);
      }
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioIdx(idx);
    audio.play().catch((err) => {
      console.warn("Audio playback error:", err);
      setPlayingAudioIdx(null);
    });
    audio.onended = () => setPlayingAudioIdx(null);
  };

  return (
    <div className="w-full rounded-2xl bg-[#09090E] border border-white/10 overflow-hidden shadow-2xl flex flex-col mb-4 animate-fade-in text-xs font-sans">
      {/* Top Floating Control Bar */}
      <div className="p-2.5 px-4 bg-[#12121A]/90 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-indigo-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isManga ? "Manga Grid Canvas" : "Webtoon Strip Canvas"}</span>
          </span>
          <span className="text-white font-bold truncate max-w-[200px]">
            {seriesTitle && ` ${seriesTitle}`}
            {chapterNumber && ` • Ch ${chapterNumber}`}
          </span>
          <span className="text-neutral-500 font-mono">({panels.length} Panels)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-neutral-300 px-1">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Toggle Bubble Overlays */}
          <button
            type="button"
            onClick={() => setShowBubbleOverlays(!showBubbleOverlays)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
              showBubbleOverlays
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                : "bg-white/5 text-neutral-400 border-white/5 hover:text-white"
            }`}
          >
            {showBubbleOverlays ? "Overlays: On" : "Overlays: Off"}
          </button>

          {/* Switch Back to Video Motion */}
          <button
            type="button"
            onClick={onSwitchToVideo}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Tv className="w-3 h-3" />
            <span>Video Motion Viewport</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="w-full max-h-[640px] overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-[#06060A] flex flex-col items-center select-none studio-visible-scrollbar">
        {panels.length === 0 ? (
          <div className="py-20 text-center space-y-2 text-neutral-400 font-mono">
            <Sparkles className="w-6 h-6 mx-auto text-indigo-400 animate-pulse" />
            <div>No panels generated for this chapter yet.</div>
            <div className="text-[11px] text-neutral-500">
              Click "Synthesize Chapter Visuals" above to render panels with AI.
            </div>
          </div>
        ) : isManga ? (
          /* Manga 2-Column Paginated Grid */
          <div
            style={{ width: `${zoomLevel}%`, maxWidth: "980px" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-200"
          >
            {panels.map((p, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-lg"
              >
                <img
                  src={p.image_url}
                  alt={`Panel ${idx + 1}`}
                  className={`w-full h-auto object-cover ${
                    screentoneFilter ? "contrast-125 grayscale" : ""
                  }`}
                />
                {/* Panel Index Pill */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-white border border-white/20">
                  #{idx + 1}
                </div>
                {/* Audio Dub Play Button */}
                <button
                  type="button"
                  onClick={() => handlePlayAudio(idx, p.audio_url || p.speech_audio_url)}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-indigo-600 text-white border border-white/20 transition-all cursor-pointer"
                  title="Play Character Voice Audio"
                >
                  {playingAudioIdx === idx ? (
                    <Pause className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                {/* Speech Bubble Overlay */}
                {showBubbleOverlays && p.speech_text && (
                  <div className="absolute bottom-2 left-2 right-12 p-2 rounded-xl bg-black/85 backdrop-blur-sm border border-white/20 text-[11px] text-white font-medium line-clamp-2">
                    {p.speech_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Webtoon Continuous Vertical Scroll */
          <div
            style={{ width: `${zoomLevel}%`, maxWidth: "720px" }}
            className="flex flex-col items-center space-y-1 shadow-2xl transition-all duration-200"
          >
            {panels.map((p, idx) => (
              <div key={idx} className="relative w-full group overflow-hidden bg-black/80">
                <img
                  src={p.image_url}
                  alt={`Panel ${idx + 1}`}
                  className="w-full h-auto block object-cover"
                />

                {/* Left Indicator */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  Panel #{idx + 1}
                </div>

                {/* Right Audio Play Button */}
                <button
                  type="button"
                  onClick={() => handlePlayAudio(idx, p.audio_url || p.speech_audio_url)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-indigo-600 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer opacity-70 group-hover:opacity-100 shadow-md"
                  title="Play Panel Voice Acting"
                >
                  {playingAudioIdx === idx ? (
                    <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Speech Bubble Text Box */}
                {showBubbleOverlays && p.speech_text && (
                  <div className="absolute bottom-4 inset-x-6 text-center pointer-events-none">
                    <span className="inline-block px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md text-xs sm:text-sm font-semibold text-white tracking-wide border border-white/20 shadow-2xl leading-relaxed">
                      {p.speaker_name && (
                        <span className="text-purple-400 font-bold mr-1.5">
                          {p.speaker_name}:
                        </span>
                      )}
                      {p.speech_text}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebtoonStripViewer;
