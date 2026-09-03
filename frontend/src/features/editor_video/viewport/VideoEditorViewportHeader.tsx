import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Save,
  Video,
  ZoomIn,
  ZoomOut,
  Tv,
} from "lucide-react";
import MetadataPanel from "@/shared/ui/video/MetadataPanel";

export interface VideoEditorViewportHeaderProps {
  monitorTab: "timeline" | "video";
  setMonitorTab: (tab: "timeline" | "video") => void;
  panelsCount: number;
  zoomLevel: number;
  setZoomLevel: (updater: (prev: number) => number) => void;
  resetZoom: () => void;
  onSave?: () => void;
  handleSave?: () => void;
  isSaving?: boolean;
  onExportVideo?: () => void;
  handleRenderFinalVideo?: () => void;
  onExport?: () => void;
  isRendering?: boolean;
  musicTheme?: string;
  voiceActor?: string;
  videoUrl?: string | null;
  seriesTitle?: string;
  chapterNumber?: string | number;
  chapterTitle?: string;
  targetUrl?: string;
  navigateTo?: (path: string) => void;
  aspectRatio?: string;
  setAspectRatio?: (ratio: string) => void;
}

export const VideoEditorViewportHeader: React.FC<VideoEditorViewportHeaderProps> = ({
  monitorTab,
  setMonitorTab,
  panelsCount,
  zoomLevel,
  setZoomLevel,
  resetZoom,
  onSave,
  handleSave,
  isSaving = false,
  onExportVideo,
  handleRenderFinalVideo,
  onExport,
  isRendering = false,
  musicTheme = "",
  voiceActor = "",
  videoUrl = null,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  navigateTo,
  aspectRatio = "original",
  setAspectRatio,
}) => {
  const finalExport = onExportVideo || handleRenderFinalVideo || onExport;
  const finalSave = onSave || handleSave;
  const headerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateLayout = () => {
      const width = header.clientWidth;
      setIsCompact(width < 860);
      setIsNarrow(width < 560);
    };
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={headerRef} className="rounded-none border-b border-[#2F2F2F] bg-[#121212] h-11 px-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 shrink-0 z-20 overflow-hidden">
      {/* Left: Viewport Name & Live Pill */}
      <div className="min-w-0 flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] flex items-center justify-center  shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex items-center gap-2">
          <span className={`${isNarrow ? "hidden" : "block"} truncate whitespace-nowrap text-xs font-bold font-mono tracking-wider text-white uppercase`}>
            {isCompact ? "Video Preview" : "Video Editor Preview"}
          </span>
          <span className={`${isNarrow ? "hidden" : "inline-flex"} items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400`}>
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Center: Live Video Preview vs Final Video Tabs */}
      <div className="flex items-center bg-black/50 border border-white/10 p-0.5 rounded-lg shadow-inner whitespace-nowrap">
        <button
          type="button"
          onClick={() => setMonitorTab("timeline")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md whitespace-nowrap text-[11px] font-bold transition-all cursor-pointer ${
            monitorTab === "timeline"
              ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Tv className="h-3 w-3" />
          <span className={isNarrow ? "hidden" : "inline"}>{isCompact ? "Live" : "Live Video Preview"}</span>
        </button>

        <button
          type="button"
          onClick={() => setMonitorTab("video")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md whitespace-nowrap text-[11px] font-bold transition-all cursor-pointer ${
            monitorTab === "video"
              ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] text-white shadow-sm"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Video className="h-3 w-3" />
          <span className={isNarrow ? "hidden" : "inline"}>{isCompact ? "Final" : "Final Video"}</span>
          <span className={`${isCompact ? "hidden" : "inline"} text-[8px] font-mono px-1 py-0.2 rounded bg-[#2A2A2A] border border-[#2F2F2F] text-[#60A5FA] uppercase`}>
            MP4
          </span>
        </button>
      </div>

      {/* Right: Aspect Ratio, Zoom Tools, Metadata, Save & Export */}
      <div className="min-w-0 flex items-center justify-end gap-1.5">
        <div className="hidden sm:flex items-center bg-neutral-900/90 border border-white/10 rounded-lg p-0.5 text-neutral-400 mr-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
            className="p-1 hover:text-white hover:bg-neutral-800 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <button
            onClick={resetZoom}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold hover:text-white cursor-pointer"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
            className="p-1 hover:text-white hover:bg-neutral-800 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>

        <MetadataPanel
          musicTheme={musicTheme}
          voiceActor={voiceActor}
          videoUrl={videoUrl}
          seriesTitle={seriesTitle}
          chapterNumber={chapterNumber}
          chapterTitle={chapterTitle}
          targetUrl={targetUrl}
          navigateTo={navigateTo}
        />

        {finalSave && (
          <button
            type="button"
            onClick={finalSave}
            disabled={isSaving}
            className="h-7 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
            title="Save Project"
          >
            <Save className="h-3 w-3 text-[#3B82F6]" />
            <span className={isCompact ? "hidden" : "hidden sm:inline"}>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        )}

        {finalExport && (
          <button
            type="button"
            onClick={finalExport}
            disabled={isRendering}
            className="h-7 px-3 rounded-lg bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-blue-600 text-white text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Export and render final video"
          >
            <Video className="h-3 w-3" />
            <span className={isNarrow ? "hidden" : "inline"}>{isCompact ? "Export" : isRendering ? "Rendering..." : "Export Video"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoEditorViewportHeader;
