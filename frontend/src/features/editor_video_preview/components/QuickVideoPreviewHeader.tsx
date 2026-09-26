import React, { useState } from "react";
import {
  Sparkles,
  Video,
  Layers,
  X,
  Sliders,
  ChevronDown,
  Download,
} from "lucide-react";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";
import MetadataPanel from "@/shared/ui/video/MetadataPanel";
import AdvancedSettings from "@/shared/ui/video/AdvancedSettings";

export interface QuickVideoPreviewHeaderProps {
  monitorTab: "timeline" | "video";
  setMonitorTab: (tab: "timeline" | "video") => void;
  panelsCount: number;
  activePanelIndex: number;
  onSave?: () => void;
  handleSave?: () => void;
  isSaving?: boolean;
  onExportVideo?: () => void;
  handleRenderFinalVideo?: () => void;
  onExport?: () => void;
  isRendering?: boolean;
  onClose?: () => void;
  musicTheme?: string;
  voiceActor?: string;
  videoUrl?: string | null;
  seriesTitle?: string;
  chapterNumber?: string | number;
  chapterTitle?: string;
  targetUrl?: string;
  navigateTo?: (path: string) => void;
  advancedSettingsProps?: any;
}

export const QuickVideoPreviewHeader: React.FC<
  QuickVideoPreviewHeaderProps
> = ({
  monitorTab,
  setMonitorTab,
  panelsCount,
  activePanelIndex,
  onSave,
  handleSave,
  isSaving = false,
  onExportVideo,
  handleRenderFinalVideo,
  onExport,
  isRendering = false,
  onClose,
  musicTheme = "orchestral_battle",
  voiceActor = "en-US-GuyNeural",
  videoUrl = null,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  navigateTo,
  advancedSettingsProps,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const finalExport = onExportVideo || handleRenderFinalVideo || onExport;

  const titleBlock = (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] border border-blue-400/40 shadow-md shadow-blue-500/25 flex items-center justify-center shrink-0 transition-all cursor-pointer">
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            <span className="hidden sm:inline">Quick Video Preview</span>
            <span className="sm:hidden">Preview</span>
          </h3>
          <span className="hidden min-[480px]:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[9px] sm:text-[10px] font-bold text-[#60A5FA] font-mono shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            Live Sync
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden xl:block">
          Instant storyboard panel playback and compiled video preview
        </p>
      </div>
    </div>
  );

  const centerBlock = (
    <div className="flex items-center bg-neutral-950/90 p-0.5 rounded-xl border border-neutral-800 shadow-inner shrink-0">
      <button
        type="button"
        onClick={() => setMonitorTab("timeline")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
          monitorTab === "timeline"
            ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-500/25 border border-blue-400/40"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
        }`}
      >
        <Layers className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Storyboard Preview</span>
        <span className="md:hidden">Storyboard</span>
        {panelsCount > 0 && (
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
              monitorTab === "timeline"
                ? "bg-black/30 text-white font-bold"
                : "bg-black/40 text-[#60A5FA]"
            }`}
          >
            {panelsCount}p
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setMonitorTab("video")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
          monitorTab === "video"
            ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-500/25 border border-blue-400/40"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
        }`}
      >
        <Video className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Final Video</span>
        <span className="md:hidden">Final</span>
        <span
          className={`hidden sm:inline text-[8px] font-mono px-1 py-0.2 rounded border uppercase ${
            monitorTab === "video"
              ? "bg-black/30 border-blue-400/40 text-white"
              : "bg-[#2A2A2A] border-neutral-800 text-[#60A5FA]"
          }`}
        >
          MP4
        </span>
      </button>
    </div>
  );

  const rightBlock = (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      {advancedSettingsProps && (
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className={`h-8 px-2.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 whitespace-nowrap ${
            showAdvancedSettings
              ? "bg-[#2A2A2A] border-[#3B82F6] text-[#3B82F6]"
              : "bg-neutral-900/90 hover:bg-neutral-800 border-transparent text-neutral-300 hover:text-white"
          }`}
          title="Render and Vision Settings"
        >
          <Sliders className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span className="hidden sm:inline">Settings</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              showAdvancedSettings ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      <div className="hidden min-[480px]:block shrink-0">
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
      </div>


      {finalExport && (
        <button
          type="button"
          onClick={finalExport}
          disabled={isRendering}
          className="h-8 px-2.5 sm:px-3.5 rounded-xl border border-blue-400/40 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50 shrink-0 whitespace-nowrap"
          title="Export and render final video"
        >
          <Video className="h-3.5 w-3.5 text-white shrink-0" />
          <span className="hidden md:inline">
            {isRendering ? "Rendering..." : "Export Video"}
          </span>
          <span className="md:hidden">{isRendering ? "..." : "Export"}</span>
        </button>
      )}

      {videoUrl && (
        <a
          href={videoUrl}
          download={seriesTitle ? `${seriesTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_video.mp4` : "video.mp4"}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 sm:px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/25 active:scale-95 shrink-0 whitespace-nowrap"
          title="Download compiled MP4 video to your computer"
        >
          <Download className="h-3.5 w-3.5 text-white shrink-0" />
          <span className="hidden md:inline">Download MP4</span>
          <span className="md:hidden">MP4</span>
        </a>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-xl bg-neutral-900/90 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-neutral-800 text-neutral-400 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
          title="Hide Quick Video Preview"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <EditorHeaderFrame
        left={titleBlock}
        center={centerBlock}
        right={rightBlock}
        centerClassName="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:min-w-0 flex justify-center"
        className="flex-wrap sm:flex-nowrap gap-2 sm:gap-3"
      />

      {/* Collapsible Advanced Settings Modal */}
      {showAdvancedSettings && advancedSettingsProps && (
        <div className="pt-2 pb-1 border-b border-white/10 animate-fade-in">
          <AdvancedSettings {...advancedSettingsProps} />
        </div>
      )}
    </>
  );
};

export default QuickVideoPreviewHeader;
