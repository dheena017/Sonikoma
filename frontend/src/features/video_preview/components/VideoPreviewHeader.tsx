import React from "react";
import { X, Film } from "lucide-react";
import VideoPreviewMetadataPanel from "@/features/video_preview/components/VideoPreviewMetadataPanel";
import ProcessBar from "@/shared/ui/loading/ProcessBar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
} from "@/features/workspace_scraper/components/LiveScraperDeck";

export interface VideoPreviewHeaderProps {
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

const getPreviewDisplayLabel = (videoUrl: string | null) => {
  if (!videoUrl) return "VIDEO PREVIEW PLAYER";

  const sanitizedUrl = videoUrl.split("?")[0];
  const fileName = sanitizedUrl.split("/").filter(Boolean).pop() ?? "";
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  return (nameWithoutExt.replace(/[_-]+/g, " ").trim() || "VIDEO PREVIEW PLAYER").toUpperCase();
};

const VideoPreviewHeader: React.FC<VideoPreviewHeaderProps> = ({
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
  const previewLabel = getPreviewDisplayLabel(videoUrl);

  return (
    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5 flex-wrap gap-3">
      {/* Left: Title & Launch Studio Button */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h3 className="font-extrabold text-sm text-white uppercase tracking-wider font-sans">
            {previewLabel}
          </h3>
        </div>

        {variant !== "embedded" && (
          <button
            type="button"
            onClick={onOpenVideoEditor}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600/25 to-indigo-600/25 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/40 text-purple-200 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)] ml-1"
            title="Open Video Studio"
          >
            <Film className="h-3.5 w-3.5 text-purple-400" />
            <span>Launch Video Studio</span>
          </button>
        )}
      </div>

      {/* Centre: Metadata Specs & Action Controls */}
      <div className="flex items-center gap-2.5 flex-wrap flex-1 justify-center">
        <VideoPreviewMetadataPanel
          musicTheme={musicTheme}
          voiceActor={voiceActor}
          videoUrl={videoUrl}
          navigateTo={navigateTo}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber !== undefined && chapterNumber !== null ? String(chapterNumber) : undefined}
          chapterTitle={chapterTitle}
          targetUrl={targetUrl}
        />

        {/* Primary Export Render Button */}
        {isRendering ? (
          <div className="min-w-[160px]">
            <ProcessBar progressStatus={progressStatus} />
          </div>
        ) : (
          <button
            onClick={handleRenderFinalVideo}
            disabled={!hasEnoughCredits}
            className={`relative overflow-hidden h-7 px-3.5 rounded-lg font-extrabold text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
              !hasEnoughCredits
                ? "bg-neutral-900/50 text-neutral-600 cursor-not-allowed border-neutral-800"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-white/10 cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.35)] hover:shadow-[0_0_22px_rgba(139,92,246,0.55)] active:scale-95"
            }`}
          >
            {isRendering && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            )}
            <span className="relative z-10">
              {!hasEnoughCredits ? "⚠️ No Credits" : "🎬 Export Video"}
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
          className="h-7 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold font-mono active:scale-95 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          <span>Hide</span>
        </button>
      )}
    </div>
  );
};

export default React.memo(VideoPreviewHeader);
export { VideoPreviewHeader };
