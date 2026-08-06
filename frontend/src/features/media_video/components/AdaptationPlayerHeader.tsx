import React from "react";
import { X, Film } from "lucide-react";
import OutputMetadataPanel from "@/features/media_video/components/OutputMetadataPanel";
import ProcessBar from "@/shared/ui/loading/ProcessBar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
} from "@/features/workspace_scraper/components/LiveScraperDeck";

interface AdaptationPlayerHeaderProps {
  videoUrl: string | null;
  musicTheme: string;
  voiceActor: string;
  navigateTo: (path: string) => void;
  seriesTitle: string;
  chapterNumber: string | number;
  chapterTitle: string;
  targetUrl: string;
  isRendering: boolean;
  renderProgress: number;
  handleRenderFinalVideo: () => void;
  progressStatus: any;
  hasEnoughCredits: boolean;
  onOpenVideoEditor: () => void;
  variant?: "floating" | "embedded";
}

const AdaptationPlayerHeader: React.FC<AdaptationPlayerHeaderProps> = ({
  videoUrl,
  musicTheme,
  voiceActor,
  navigateTo,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  isRendering,
  renderProgress,
  handleRenderFinalVideo,
  progressStatus,
  hasEnoughCredits,
  onOpenVideoEditor,
  variant = "floating",
}) => {
  const [selectedExportTarget, setSelectedExportTarget] = React.useState<string>("master");

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-wrap gap-3">
      {/* Left: title + LIVE badge */}
      <div className="flex items-center gap-2 shrink-0">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider font-sans">
          ADAPTATION PLAYER
        </h3>
        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono shrink-0 uppercase tracking-widest font-black">
          LIVE
        </span>

        {variant !== "embedded" && (
          <button
            type="button"
            onClick={onOpenVideoEditor}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)] ml-2"
            title="Open Video Studio"
          >
            <Film className="h-3.5 w-3.5 text-purple-400" />
            <span>Launch Video Studio</span>
          </button>
        )}
      </div>

      {/* Centre: metadata + export pills */}
      <div className="flex items-center gap-2 flex-wrap flex-1 justify-center">
        <OutputMetadataPanel
          videoUrl={videoUrl}
          musicTheme={musicTheme}
          voiceActor={voiceActor}
          navigateTo={navigateTo}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber !== undefined && chapterNumber !== null ? String(chapterNumber) : undefined}
          chapterTitle={chapterTitle}
          targetUrl={targetUrl}
        />

        {/* Divider */}
        <span className="h-4 w-px bg-white/10 hidden sm:block" />

        {/* Export label */}
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Export</span>
        </div>

        {/* Export target pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedExportTarget("master")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
              selectedExportTarget === "master"
                ? "bg-purple-600/20 border-purple-500/50 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
            }`}
          >
            Full Master
            <span className={`text-[8px] px-1 py-0.5 rounded border font-mono ${
              selectedExportTarget === "master"
                ? "bg-emerald-500/10 border-emerald-600/30 text-emerald-400"
                : "bg-neutral-800 border-neutral-700 text-neutral-500"
            }`}>1080p</span>
          </button>

          {(((window as any).__scrapeEpisodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>) || []).length > 0 &&
            getSortedEpisodeGroups(
              ((window as any).__scrapeEpisodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>) || []
            ).map(({ grp, originalIdx }) => (
              <button
                key={originalIdx}
                type="button"
                onClick={() => setSelectedExportTarget(`ep-${originalIdx}`)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
                  selectedExportTarget === `ep-${originalIdx}`
                    ? "bg-purple-600/20 border-purple-500/50 text-purple-200"
                    : "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                }`}
              >
                <span className="truncate max-w-[72px]">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                <span className="text-[8px] text-purple-400/70">{grp.count}f</span>
              </button>
            ))
          }
        </div>

        {/* Export button (compact) */}
        {isRendering ? (
          <div className="min-w-[160px]">
            <ProcessBar progressStatus={progressStatus} />
          </div>
        ) : (
          <button
            onClick={handleRenderFinalVideo}
            disabled={!hasEnoughCredits}
            className={`relative overflow-hidden px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-[0.15em] transition-all flex items-center gap-1.5 border shrink-0 ${
              !hasEnoughCredits
                ? "bg-neutral-900/50 text-neutral-600 cursor-not-allowed border-neutral-800"
                : "bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-white border-white/10 cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.3)] hover:shadow-[0_0_22px_rgba(139,92,246,0.5)]"
            }`}
          >
            {isRendering && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            )}
            <span className="relative z-10">
              {!hasEnoughCredits ? "⚠️ No Credits" : "🎬 Export"}
            </span>
          </button>
        )}
      </div>

      {/* Right: Hide Player */}
      {variant !== "embedded" && (
        <button
          type="button"
          onClick={() => {
            useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
          }}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold font-mono active:scale-95 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          Hide Player
        </button>
      )}
    </div>
  );
};

export default React.memo(AdaptationPlayerHeader);
