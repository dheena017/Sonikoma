import React from "react";
import {
  X,
  Film,
  Sparkles,
  Loader2,
  Layout,
  Video,
} from "lucide-react";
import VideoPreviewMetadataPanel from "./MetadataPanel";
import ProcessBar from "@/shared/ui/loading/ProcessBar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

export interface VideoPreviewHeaderProps {
  videoUrl: string | null;
  musicTheme: string;
  voiceActor: string;
  navigateTo: (path: string) => void;
  seriesTitle: string;
  chapterNumber: string | number;
  chapterTitle: string;
  targetUrl: string;
  isRendering?: boolean;
  renderProgress?: number;
  handleRenderFinalVideo?: () => void;
  progressStatus?: any;
  hasEnoughCredits?: boolean;
  onOpenVideoEditor?: () => void;
  variant?: "floating" | "embedded";
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activePreviewTab?: string;
  setActivePreviewTab?: (tab: string) => void;
  panelsCount?: number;
  allowEditorTab?: boolean;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}

const getPreviewDisplayLabel = (
  videoUrl: string | null,
  seriesTitle?: string,
  chapterTitle?: string,
  chapterNumber?: string | number
) => {
  const parts: string[] = [];
  if (seriesTitle && seriesTitle.trim()) {
    parts.push(seriesTitle.trim());
  }
  if (chapterTitle && chapterTitle.trim()) {
    let cleanChapter = chapterTitle.trim();
    // Normalize repeated "Episode Episode" strings
    cleanChapter = cleanChapter.replace(/^(episode\s+)+/i, "Episode ");
    parts.push(cleanChapter);
  } else if (chapterNumber) {
    parts.push(`Episode ${chapterNumber}`);
  }

  if (parts.length > 0) {
    return parts.join(" · ").toUpperCase();
  }

  if (!videoUrl) return "VIDEO PREVIEW PLAYER";
  const sanitizedUrl = videoUrl.split("?")[0];
  const fileName = sanitizedUrl.split("/").filter(Boolean).pop() ?? "";
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  return (
    nameWithoutExt.replace(/[_-]+/g, " ").trim() || "VIDEO PREVIEW PLAYER"
  ).toUpperCase();
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
  isRendering = false,
  renderProgress = 0,
  handleRenderFinalVideo,
  progressStatus,
  hasEnoughCredits = true,
  onOpenVideoEditor,
  variant = "floating",
  isSidebarOpen = true,
  onToggleSidebar,
  activePreviewTab = "timeline",
  setActivePreviewTab,
  panelsCount = 0,
  allowEditorTab = false,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const previewLabel = getPreviewDisplayLabel(
    videoUrl,
    seriesTitle,
    chapterTitle,
    chapterNumber
  );
  const isFloating = variant !== "embedded";

  const leftBlock = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.3)] shrink-0">
        <Film className="h-4.5 w-4.5 text-purple-400" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate"
            title={previewLabel}
          >
            {previewLabel}
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Program Monitor
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Video preview player, real-time animation canvas & composition
        </p>
      </div>

      {isFloating && onOpenVideoEditor && (
        <button
          type="button"
          onClick={onOpenVideoEditor}
          className="hidden md:flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-[10px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)] shrink-0"
          title="Open Video Studio"
        >
          <Film className="h-3 w-3 text-purple-400" />
          <span>Video Studio</span>
        </button>
      )}
    </div>
  );

  const centerBlock = (
    <>
      {!allowEditorTab && (
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("timeline")}
          className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
            activePreviewTab === "timeline"
              ? "bg-purple-600/30 border-purple-500/60 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
          }`}
        >
          <Layout
            className={`h-3 w-3 ${
              activePreviewTab === "timeline"
                ? "text-purple-400"
                : "text-neutral-500"
            }`}
          />
          <span>Storyboard Live</span>
          {panelsCount > 0 && (
            <span
              className={`text-[8px] px-1 py-0.2 rounded font-black border ${
                activePreviewTab === "timeline"
                  ? "bg-purple-500/30 text-purple-200 border-purple-500/40"
                  : "bg-neutral-900 text-neutral-500 border-neutral-800"
              }`}
            >
              {panelsCount}p
            </span>
          )}
        </button>
      )}

      {allowEditorTab && (
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("editor")}
          className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
            activePreviewTab === "editor"
              ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]"
              : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
          }`}
        >
          <Sparkles
            className={`h-3 w-3 ${
              activePreviewTab === "editor"
                ? "text-indigo-400"
                : "text-neutral-500"
            }`}
          />
          <span>Video Editor Live</span>
          <span
            className={`text-[8px] px-1 py-0.2 rounded font-black border ${
              activePreviewTab === "editor"
                ? "bg-indigo-500/25 text-indigo-200 border-indigo-500/40"
                : "bg-neutral-900 text-neutral-500 border-neutral-800"
            }`}
          >
            CANVAS
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setActivePreviewTab?.("video")}
        className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer border ${
          activePreviewTab === "video"
            ? "bg-emerald-600/25 border-emerald-500/50 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
        }`}
      >
        <Video
          className={`h-3 w-3 ${
            activePreviewTab === "video"
              ? "text-emerald-400"
              : "text-neutral-500"
          }`}
        />
        <span>Final Video</span>
        <span
          className={`text-[8px] px-1 py-0.2 rounded font-black border ${
            activePreviewTab === "video"
              ? "bg-emerald-500/25 text-emerald-200 border-emerald-500/40"
              : "bg-neutral-900 text-neutral-500 border-neutral-800"
          }`}
        >
          MP4
        </span>
      </button>
    </>
  );

  const rightBlock = (
    <>
      <VideoPreviewMetadataPanel
        musicTheme={musicTheme}
        voiceActor={voiceActor}
        videoUrl={videoUrl}
        navigateTo={navigateTo}
        seriesTitle={seriesTitle}
        chapterNumber={
          chapterNumber !== undefined && chapterNumber !== null
            ? String(chapterNumber)
            : undefined
        }
        chapterTitle={chapterTitle}
        targetUrl={targetUrl}
      />

      {handleRenderFinalVideo && (
        <>
          {isRendering ? (
            progressStatus ? (
              <div className="min-w-[140px]">
                <ProcessBar progressStatus={progressStatus} />
              </div>
            ) : (
              <div className="h-7 px-3 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center gap-1.5 text-[10px] font-bold font-mono text-purple-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Exporting {renderProgress}%</span>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={handleRenderFinalVideo}
              disabled={!hasEnoughCredits}
              title={
                !hasEnoughCredits
                  ? "Not enough credits to export"
                  : "Export final video"
              }
              className={`relative overflow-hidden h-7 px-3.5 rounded-lg font-black text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
                !hasEnoughCredits
                  ? "bg-neutral-900/50 text-neutral-600 cursor-not-allowed border-neutral-800"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-white/10 cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] active:scale-95"
              }`}
            >
              <Sparkles className="h-3 w-3 text-purple-200 shrink-0" />
              <span>{!hasEnoughCredits ? "No Credits" : "Export Video"}</span>
            </button>
          )}
        </>
      )}

      {isFloating && (
        <button
          type="button"
          onClick={() => {
            useImageEditorStore
              .getState()
              .setPlayerSettings({ isPlayerOpen: false });
          }}
          className="h-7 w-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95"
          title="Hide Preview Player"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );

  return (
    <EditorHeaderFrame
      left={leftBlock}
      center={centerBlock}
      right={rightBlock}
      className="border-b-0 rounded-2xl bg-gradient-to-r from-neutral-900/95 via-neutral-900/75 to-purple-950/40 border border-purple-500/30 backdrop-blur-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    />
  );
};
export default React.memo(VideoPreviewHeader);
export { VideoPreviewHeader };
