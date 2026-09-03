import React, { useState } from "react";
import { GeneratedPanel } from "@/types";
import PlaybackMonitor from "@/shared/ui/video/PlaybackMonitor";
import VideoEditorViewportHeader from "./VideoEditorViewportHeader";

export interface EditorViewportProps {
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
  aspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
}

export const EditorViewport: React.FC<EditorViewportProps> = ({
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
  musicTheme = "",
  voiceActor = "",
  seriesTitle,
  chapterNumber,
  chapterTitle,
  targetUrl,
  aspectRatio = "original",
  onAspectRatioChange,
}) => {
  const [monitorTab, setMonitorTab] = useState<"timeline" | "video">("timeline");
  const [zoomLevel, setZoomLevel] = useState(1);
  const resetZoom = () => setZoomLevel(1);
  const finalExport = onExportVideo || handleRenderFinalVideo || onExport;
  const finalSave = onSave || handleSave;

  const getAspectClass = (ratio?: string) => {
    switch (ratio) {
      case "9:16":
        return "aspect-[9/16]";
      case "16:9":
        return "aspect-video";
      case "1:1":
        return "aspect-square";
      case "4:3":
        return "aspect-[4/3]";
      case "original":
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      <VideoEditorViewportHeader
        monitorTab={monitorTab}
        setMonitorTab={setMonitorTab}
        panelsCount={panels.length}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        resetZoom={resetZoom}
        onSave={finalSave}
        isSaving={isSaving}
        onExportVideo={finalExport}
        isRendering={isRendering}
        musicTheme={musicTheme}
        voiceActor={voiceActor}
        videoUrl={videoUrl}
        seriesTitle={seriesTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        targetUrl={targetUrl}
        navigateTo={navigateTo}
        aspectRatio={aspectRatio}
        setAspectRatio={onAspectRatioChange}
      />

      <div
        className="flex-1 w-full relative overflow-hidden bg-black flex items-center justify-center p-2"
        onWheel={(event) => {
          event.preventDefault();
          setZoomLevel((current) =>
            Math.min(2, Math.max(0.5, current + (event.deltaY < 0 ? 0.1 : -0.1)))
          );
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-150"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          <div className={`w-full h-full max-w-full max-h-full flex items-center justify-center ${getAspectClass(aspectRatio)}`}>
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
      </div>
    </div>
  );
};

export default EditorViewport;
export { EditorViewport as Viewport };
