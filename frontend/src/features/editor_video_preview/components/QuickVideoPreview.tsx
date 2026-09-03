import React, { useState } from "react";
import { GeneratedPanel } from "@/types";
import PlaybackMonitor from "@/shared/ui/video/PlaybackMonitor";
import QuickVideoPreviewHeader from "./QuickVideoPreviewHeader";

export interface QuickVideoPreviewProps {
  [key: string]: any;
  panels: GeneratedPanel[];
  videoUrl: string | null;
  currentPanelIndex?: number;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  navigateTo: (path: string) => void;
  addNotification?: (msg: string, type: any) => void;
  onSave?: () => void;
  handleSave?: () => void;
  isSaving?: boolean;
  onExportVideo?: () => void;
  handleRenderFinalVideo?: () => void;
  onExport?: () => void;
  isRendering?: boolean;
  onCloseFloating?: () => void;
  musicTheme?: string;
  voiceActor?: string;
  seriesTitle?: string;
  chapterNumber?: string | number;
  chapterTitle?: string;
  targetUrl?: string;
  advancedSettingsProps?: any;
}

export const QuickVideoPreview: React.FC<QuickVideoPreviewProps> = ({
  panels,
  videoUrl,
  currentPanelIndex = 0,
  seriesSlug = null,
  chapterSlug = null,
  navigateTo,
  addNotification,
  onSave,
  handleSave,
  isSaving = false,
  onExportVideo,
  handleRenderFinalVideo,
  onExport,
  isRendering = false,
  onCloseFloating,
  musicTheme = "orchestral_battle",
  voiceActor = "en-US-GuyNeural",
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  advancedSettingsProps,
}) => {
  const [monitorTab, setMonitorTab] = useState<"timeline" | "video">("timeline");
  const finalExport = onExportVideo || handleRenderFinalVideo || onExport;
  const finalSave = onSave || handleSave;

  return (
    <div className="w-full bg-[#0c0d16]/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 sm:p-5 lg:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col gap-4">
      <QuickVideoPreviewHeader
        monitorTab={monitorTab}
        setMonitorTab={setMonitorTab}
        panelsCount={panels.length}
        activePanelIndex={currentPanelIndex}
        onSave={finalSave}
        isSaving={isSaving}
        onExportVideo={finalExport}
        isRendering={isRendering}
        onClose={onCloseFloating}
        musicTheme={musicTheme}
        voiceActor={voiceActor}
        videoUrl={videoUrl}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        targetUrl={targetUrl}
        navigateTo={navigateTo}
        advancedSettingsProps={advancedSettingsProps}
      />

      <div className="w-full max-h-[460px] aspect-video mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl relative flex items-center justify-center">
        <PlaybackMonitor
          panels={panels}
          videoUrl={videoUrl}
          currentPanelIndex={currentPanelIndex}
          seriesSlug={seriesSlug}
          chapterSlug={chapterSlug}
          navigateTo={navigateTo}
          addNotification={addNotification}
          mode={monitorTab}
          variant="embedded"
        />
      </div>
    </div>
  );
};

export default QuickVideoPreview;
export { QuickVideoPreview as StudioVideoPreview, QuickVideoPreview as VideoPreviewDeck };
