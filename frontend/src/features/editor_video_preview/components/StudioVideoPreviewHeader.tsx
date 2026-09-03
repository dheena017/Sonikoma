import React from "react";
import { Film, Sparkles, Loader2, Video, Save, X } from "lucide-react";
import MetadataPanel from "@/features/editor_video/viewport/monitor/MetadataPanel";
import ProcessBar from "@/shared/ui/loading/ProcessBar";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

export interface StudioVideoPreviewHeaderProps {
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
  activePreviewTab?: string;
  setActivePreviewTab?: (tab: string) => void;
  panelsCount?: number;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

const StudioVideoPreviewHeader: React.FC<StudioVideoPreviewHeaderProps> = ({
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
  activePreviewTab = "timeline",
  setActivePreviewTab,
  panelsCount = 0,
  onSave,
  isSaving = false,
  isDirty = false,
}) => {
  const leftBlock = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.3)] shrink-0">
        <Film className="h-4.5 w-4.5 text-purple-400" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.16em] font-mono truncate">
            Quick Video Preview
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Live Preview
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate hidden lg:block">
          Fast real-time scene player & audio-visual playback monitor
        </p>
      </div>

      {onOpenVideoEditor && (
        <button
          type="button"
          onClick={onOpenVideoEditor}
          className="hidden md:flex items-center gap-1.5 px-2.5 h-6 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-[10px] font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)] shrink-0"
          title="Open Pro Video Editor Studio"
        >
          <Film className="h-3 w-3 text-purple-400" />
          <span>Pro Editor</span>
        </button>
      )}
    </div>
  );

  const centerBlock = (
    <>
      <button
        type="button"
        onClick={() => setActivePreviewTab?.("timeline")}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer border ${
          activePreviewTab !== "video"
            ? "bg-purple-600/30 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.3)]"
            : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]"
        }`}
      >
        <Sparkles
          className={`h-3.5 w-3.5 ${
            activePreviewTab !== "video"
              ? "text-purple-300"
              : "text-neutral-500"
          }`}
        />
        <span>Live Preview</span>
        {panelsCount > 0 && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-md font-black border ${
              activePreviewTab !== "video"
                ? "bg-purple-500/30 text-purple-200 border-purple-500/40 shadow-sm"
                : "bg-neutral-900 text-neutral-500 border-neutral-800"
            }`}
          >
            {panelsCount}p
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActivePreviewTab?.("video")}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer border ${
          activePreviewTab === "video"
            ? "bg-emerald-600/30 border-emerald-500/60 text-white shadow-[0_0_14px_rgba(16,185,129,0.3)]"
            : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]"
        }`}
      >
        <Video
          className={`h-3.5 w-3.5 ${
            activePreviewTab === "video"
              ? "text-emerald-300"
              : "text-neutral-500"
          }`}
        />
        <span>Final Video</span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-md font-black border ${
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
    <div className="flex items-center gap-2">
      {/* 💾 Save Project Action Button */}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`relative overflow-hidden h-7 px-3.5 rounded-lg font-black text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer active:scale-95 ${
            isSaving
              ? "bg-purple-900/40 text-purple-200 cursor-wait border-purple-500/30"
              : isDirty
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-[0_0_14px_rgba(168,85,247,0.4)] animate-pulse"
              : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-white/10"
          }`}
          title={isDirty ? "Save Unsaved Changes (Ctrl+S)" : "Project Saved"}
        >
          <Save
            className={`h-3 w-3 ${
              isSaving
                ? "animate-spin text-purple-200"
                : isDirty
                ? "text-purple-200"
                : "text-neutral-400"
            }`}
          />
          <span className="whitespace-nowrap">
            {isSaving ? "Saving..." : isDirty ? "Save*" : "Save"}
          </span>
        </button>
      )}

      <MetadataPanel
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
              <span className="whitespace-nowrap">
                {!hasEnoughCredits ? "No Credits" : "Export Video"}
              </span>
            </button>
          )}
        </>
      )}

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
    </div>
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

export default React.memo(StudioVideoPreviewHeader);
export { StudioVideoPreviewHeader };
