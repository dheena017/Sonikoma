import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Tv,
  BookOpen,
  Swords,
  Volume2,
  RefreshCw,
  Plus,
  ChevronDown,
  Film,
  Users,
  Globe,
  SlidersHorizontal,
  Headphones,
  Check,
} from "lucide-react";
import { AISeriesProject, ChapterSession } from "@/features/intelligence/series/api/aiSeries";

interface AISeriesStudioBarProps {
  seriesId: string;
  project: AISeriesProject | null;
  currentChapter: ChapterSession | null;
  selectedSessionNum: number;
  selectedChapterNum: number;
  onSelectChapter: (sessionNum: number, chapterNum: number) => void;
  onSynthesizeVisuals: () => Promise<void>;
  onSynthesizeAudio: () => Promise<void>;
  isSynthesizingVisuals: boolean;
  isSynthesizingAudio: boolean;
  viewportMode: "video" | "strip" | "grid";
  onSetViewportMode: (mode: "video" | "strip" | "grid") => void;
  onOpenCharacterVault?: () => void;
  onOpenWorldBible?: () => void;
  totalChapters?: number;
}

export const AISeriesStudioBar: React.FC<AISeriesStudioBarProps> = ({
  seriesId,
  project,
  currentChapter,
  selectedSessionNum,
  selectedChapterNum,
  onSelectChapter,
  onSynthesizeVisuals,
  onSynthesizeAudio,
  isSynthesizingVisuals,
  isSynthesizingAudio,
  viewportMode,
  onSetViewportMode,
  onOpenCharacterVault,
  onOpenWorldBible,
  totalChapters = 8,
}) => {
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

  const format = (project?.format_type || "manhwa").toLowerCase();
  const isManhwa = format === "manhwa";
  const isManga = format === "comic_manga";
  const isAnime = format === "anime";

  const getFormatBadge = () => {
    if (isAnime) {
      return {
        label: "Cinematic Anime (16:9)",
        badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: Tv,
      };
    }
    if (isManga) {
      return {
        label: "Japanese Manga (3:4 Inked)",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: Swords,
      };
    }
    return {
      label: "Korean Manhwa (2:3 Webtoon)",
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: BookOpen,
    };
  };

  const badge = getFormatBadge();
  const Icon = badge.icon;

  // Compute available chapters from active session or fallback list
  const activeSession = project?.sessions?.find(
    (s) => s.session_number === selectedSessionNum
  );
  const chapterList = activeSession?.chapters?.length
    ? activeSession.chapters
    : Array.from({ length: totalChapters }, (_, i) => ({
        chapter_number: i + 1,
        title: `Episode ${i + 1}`,
        status: i + 1 === selectedChapterNum ? "in_progress" : "planned",
        panels: [],
      }));

  return (
    <div className="w-full rounded-2xl bg-[#0D0D14]/95 border border-white/10 p-3 sm:p-4 shadow-xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-fade-in text-xs font-sans">
      {/* ── Left: Series Context & Chapter Switcher ── */}
      <div className="flex flex-wrap items-center gap-2.5 min-w-0">
        {/* Format Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 ${badge.badgeBg}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>

        {/* Series Title */}
        <div className="font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-[260px]">
          {project?.title || "AI Series"}
        </div>

        <span className="text-neutral-600 hidden sm:inline">•</span>

        {/* Season / Session Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white font-mono text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Season {selectedSessionNum}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          {isSessionDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-32 rounded-xl bg-[#161622] border border-white/15 shadow-2xl p-1 z-50 animate-fade-in font-mono text-xs">
              {[1, 2, 3].map((sessNum) => (
                <button
                  key={sessNum}
                  type="button"
                  onClick={() => {
                    setIsSessionDropdownOpen(false);
                    onSelectChapter(sessNum, 1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    selectedSessionNum === sessNum
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-neutral-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>Season {sessNum}</span>
                  {selectedSessionNum === sessNum && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapter / Episode Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsChapterDropdownOpen(!isChapterDropdownOpen)}
            className="px-3 py-1.5 rounded-xl bg-[#181826] hover:bg-[#202032] border border-indigo-500/40 text-white font-mono text-[11px] font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span className="text-indigo-400">CH {selectedChapterNum}:</span>
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {currentChapter?.title || `Episode ${selectedChapterNum}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {isChapterDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 max-h-72 overflow-y-auto rounded-2xl bg-[#141420] border border-white/15 shadow-2xl p-1.5 z-50 animate-fade-in font-mono text-xs">
              <div className="px-2.5 py-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider border-b border-white/5">
                Season {selectedSessionNum} Episodes
              </div>
              <div className="py-1 space-y-0.5">
                {chapterList.map((chap) => {
                  const isCur = chap.chapter_number === selectedChapterNum;
                  return (
                    <button
                      key={chap.chapter_number}
                      type="button"
                      onClick={() => {
                        setIsChapterDropdownOpen(false);
                        onSelectChapter(selectedSessionNum, chap.chapter_number);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                        isCur
                          ? "bg-indigo-600 text-white font-bold shadow-md"
                          : "text-neutral-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-neutral-400 mr-1.5">
                          #{chap.chapter_number}
                        </span>
                        <span>{chap.title}</span>
                      </div>
                      {isCur && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Viewport Mode Switcher & AI Actions ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Viewport Canvas Mode Toggle */}
        <div className="p-0.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onSetViewportMode("video")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewportMode === "video"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
            title="16:9 Theatrical Video Viewport"
          >
            <Tv className="w-3 h-3" />
            <span>Video Motion</span>
          </button>
          {!isAnime && (
            <button
              type="button"
              onClick={() => onSetViewportMode(isManga ? "grid" : "strip")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewportMode === "strip" || viewportMode === "grid"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
              title={
                isManga
                  ? "B&W Screentone Page Grid"
                  : "Continuous Vertical Webtoon Strip"
              }
            >
              <BookOpen className="w-3 h-3" />
              <span>{isManga ? "Manga Grid" : "Webtoon Strip"}</span>
            </button>
          )}
        </div>

        {/* AI Diffusion Visual Render */}
        <button
          type="button"
          onClick={onSynthesizeVisuals}
          disabled={isSynthesizingVisuals}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-[11px] shadow-md shadow-purple-950/40 border border-purple-400/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          title="Render high-fidelity diffusion visuals for all panels in this chapter"
        >
          <Sparkles
            className={`w-3.5 h-3.5 text-amber-300 ${
              isSynthesizingVisuals ? "animate-spin" : "animate-pulse"
            }`}
          />
          <span className="hidden sm:inline">
            {isSynthesizingVisuals ? "Synthesizing Panels..." : "Synthesize Chapter Visuals"}
          </span>
          <span className="sm:hidden">Visuals</span>
        </button>

        {/* Edge-TTS Dubbing */}
        <button
          type="button"
          onClick={onSynthesizeAudio}
          disabled={isSynthesizingAudio}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[11px] shadow-md shadow-emerald-950/40 border border-emerald-400/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          title="Synthesize Edge-TTS voice dubbing for dialogue and narration"
        >
          <Volume2
            className={`w-3.5 h-3.5 text-white ${
              isSynthesizingAudio ? "animate-bounce" : ""
            }`}
          />
          <span className="hidden sm:inline">
            {isSynthesizingAudio ? "Dubbing Audio..." : "Dub Audio (Edge-TTS)"}
          </span>
          <span className="sm:hidden">Dub</span>
        </button>
      </div>
    </div>
  );
};

export default AISeriesStudioBar;
