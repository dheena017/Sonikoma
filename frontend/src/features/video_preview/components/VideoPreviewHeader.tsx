import React from "react";
import { X, Film } from "lucide-react";
import VideoPreviewMetadataPanel from "@/features/video_preview/components/VideoPreviewMetadataPanel";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";

export interface VideoPreviewHeaderProps {
  videoUrl: string | null;
  musicTheme: string;
  voiceActor: string;
  navigateTo: (path: string) => void;
  seriesTitle: string;
  chapterNumber: string | number;
  chapterTitle: string;
  targetUrl: string;
  // kept in interface for compat but no longer rendered here
  isRendering?: boolean;
  renderProgress?: number;
  handleRenderFinalVideo?: () => void;
  progressStatus?: any;
  hasEnoughCredits?: boolean;
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
  onOpenVideoEditor,
  variant = "floating",
}) => {
  const previewLabel = getPreviewDisplayLabel(videoUrl);

  return (
    <div className="relative flex items-center justify-between px-4 h-12 shrink-0 bg-[#09090e]/95 backdrop-blur-md border-b border-neutral-800/80 overflow-hidden select-none">
      {/* Top gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-80" />

      {/* LEFT: Title + Launch button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
          <h3 className="font-black text-[11px] text-white uppercase tracking-widest font-mono">
            {previewLabel}
          </h3>
        </div>

        {variant !== "embedded" && (
          <button
            type="button"
            onClick={onOpenVideoEditor}
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-[10px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            title="Open Video Studio"
          >
            <Film className="h-3 w-3 text-purple-400" />
            <span>Video Studio</span>
          </button>
        )}
      </div>

      {/* CENTRE: Metadata badges only */}
      <div className="flex items-center gap-2 flex-1 justify-center flex-wrap px-4">
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
      </div>

      {/* RIGHT: Close / Hide */}
      {variant !== "embedded" && (
        <button
          type="button"
          onClick={() => {
            useImageEditorStore.getState().setPlayerSettings({ isPlayerOpen: false });
          }}
          className="h-7 w-7 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
          title="Hide Preview Player"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default React.memo(VideoPreviewHeader);
export { VideoPreviewHeader };
