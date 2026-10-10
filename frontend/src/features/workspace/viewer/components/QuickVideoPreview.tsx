import React, { useState } from "react";
import { GeneratedPanel } from "@/shared/types";
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
  const [monitorTab, setMonitorTab] = useState<"timeline" | "video">(
    advancedSettingsProps?.activePreviewTab || (videoUrl ? "video" : "timeline")
  );

  // Automatically switch the player to the compiled video when videoUrl becomes available
  React.useEffect(() => {
    if (videoUrl) {
      setMonitorTab("video");
    }
  }, [videoUrl]);

  const finalExport = onExportVideo || handleRenderFinalVideo || onExport;
  const finalSave = onSave || handleSave;

  return (
    <div className="w-full flex-1 h-full min-h-0 rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-6 lg:p-7 shadow-2xl flex flex-col gap-4 relative overflow-hidden text-left">
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

      <div className="w-full flex-1 min-h-[260px] max-h-[600px] lg:max-h-[500px] aspect-video mx-auto rounded-2xl overflow-hidden border border-[#2F2F2F] bg-black/90 shadow-xl relative flex items-center justify-center my-auto">
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
export {
  QuickVideoPreview as StudioVideoPreview,
  QuickVideoPreview as VideoPreviewDeck,
};
