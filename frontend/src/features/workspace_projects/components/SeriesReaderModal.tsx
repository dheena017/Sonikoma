import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  BookOpen,
} from "lucide-react";
import type { Project } from "../hooks/ProjectTypes";

interface SeriesReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  chapters: Project[];
}

export default function SeriesReaderModal({
  isOpen,
  onClose,
  seriesTitle,
  chapters,
}: SeriesReaderModalProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen || chapters.length === 0) return null;

  const currentChapter = chapters[currentChapterIdx] || chapters[0];

  const handlePrev = () => {
    if (currentChapterIdx > 0) {
      setCurrentChapterIdx((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentChapterIdx < chapters.length - 1) {
      setCurrentChapterIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in text-white select-none">
      {/* Top Controls Bar */}
      <div className="h-16 px-6 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">
              {seriesTitle}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              {currentChapter.title} ({currentChapterIdx + 1} of{" "}
              {chapters.length})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              isPlayingAudio
                ? "bg-purple-600/20 border-purple-500 text-purple-300 animate-pulse"
                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
            }`}
          >
            {isPlayingAudio ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {isPlayingAudio ? "Pause Audio" : "Play Narration"}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-all cursor-pointer"
            title="Exit Reader"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Canvas / Viewer */}
      <div className="flex-1 relative flex items-center justify-center p-6 bg-neutral-955 overflow-hidden">
        {/* Nav Left */}
        <button
          onClick={handlePrev}
          disabled={currentChapterIdx === 0}
          className="absolute left-6 z-20 p-3 rounded-full bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Comic Panel Preview */}
        <div className="max-w-4xl max-h-full flex flex-col items-center justify-center space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900 max-h-[75vh]">
            {currentChapter.cover_image ? (
              <img
                src={currentChapter.cover_image}
                alt={currentChapter.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            ) : (
              <div className="w-96 h-96 flex flex-col items-center justify-center gap-3 bg-neutral-900 text-neutral-500">
                <BookOpen className="w-12 h-12 text-purple-500/40" />
                <span className="text-xs font-mono">
                  No Panel Preview Available
                </span>
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white">
              {currentChapter.title}
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              {currentChapter.panels_count || 0} Panels · Status:{" "}
              {currentChapter.status || "Draft"}
            </p>
          </div>
        </div>

        {/* Nav Right */}
        <button
          onClick={handleNext}
          disabled={currentChapterIdx === chapters.length - 1}
          className="absolute right-6 z-20 p-3 rounded-full bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnails Strip */}
      <div className="h-20 border-t border-neutral-800 bg-neutral-950 px-6 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-thin">
        {chapters.map((chap, idx) => (
          <button
            key={chap.project_id}
            onClick={() => setCurrentChapterIdx(idx)}
            className={`h-14 min-w-[100px] rounded-xl border overflow-hidden transition-all cursor-pointer shrink-0 relative flex items-center justify-center ${
              idx === currentChapterIdx
                ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                : "border-neutral-800 opacity-60 hover:opacity-100"
            }`}
          >
            {chap.cover_image ? (
              <img
                src={chap.cover_image}
                alt={chap.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[10px] font-mono text-neutral-400">
                Ch. {idx + 1}
              </div>
            )}
            <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-white">
              #{idx + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
