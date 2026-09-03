import React, { useState } from "react";
import {
  Sparkles,
  Save,
  Video,
  Layers,
  X,
  Sliders,
  ChevronDown,
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

export const QuickVideoPreviewHeader: React.FC<QuickVideoPreviewHeaderProps> = ({
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
  const finalSave = onSave || handleSave;

  const titleBlock = (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.35)] shrink-0">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            Quick Video Preview
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Instant storyboard panel playback and compiled video preview
        </p>
      </div>
    </div>
  );

  const centerBlock = (
    <div className="flex items-center bg-neutral-950/90 p-0.5 rounded-xl border border-neutral-800 shadow-inner">
      <button
        type="button"
        onClick={() => setMonitorTab("timeline")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
          monitorTab === "timeline"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>Storyboard Preview</span>
        {panelsCount > 0 && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-purple-200">
            {panelsCount}p
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setMonitorTab("video")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
          monitorTab === "video"
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <Video className="h-3.5 w-3.5" />
        <span>Final Video</span>
        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 uppercase">
          MP4
        </span>
      </button>
    </div>
  );

  const rightBlock = (
    <div className="flex items-center gap-2">
      {advancedSettingsProps && (
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className={`h-8 px-2.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
            showAdvancedSettings
              ? "bg-purple-600/30 border-purple-500 text-purple-200"
              : "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white"
          }`}
          title="Render and Vision Settings"
        >
          <Sliders className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden sm:inline">Settings</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`} />
        </button>
      )}

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
          className="h-8 px-3 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
          title="Save Storyboard State"
        >
          <Save className="h-3.5 w-3.5 text-purple-400" />
          <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
        </button>
      )}

      {finalExport && (
        <button
          type="button"
          onClick={finalExport}
          disabled={isRendering}
          className="h-8 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] active:scale-95 disabled:opacity-50"
          title="Export and render final video"
        >
          <Video className="h-3.5 w-3.5" />
          <span>{isRendering ? "Rendering..." : "Export Video"}</span>
        </button>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-xl bg-neutral-900/90 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-neutral-800 text-neutral-400 flex items-center justify-center transition-all cursor-pointer shadow-md"
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
