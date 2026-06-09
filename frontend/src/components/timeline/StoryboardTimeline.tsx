import React from "react";
import { GeneratedPanel } from "../../types";
import { useStoryboardOperations } from "../../hooks/useStoryboardOperations";

import TimelineEmptyState from "./TimelineEmptyState";
import TimelineHeader from "./TimelineHeader";
import TimelineBulkOps from "./TimelineBulkOps";
import TimelineCard from "./TimelineCard";

interface StoryboardTimelineProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  activePreviewTab: "video" | "storyboard";
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setPlaybackTime: (time: number) => void;
  hasScrapedImages?: boolean;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: any) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function StoryboardTimeline({
  panels,
  setPanels,
  currentPanelIndex,
  setCurrentPanelIndex,
  activePreviewTab,
  setActivePreviewTab,
  setPlaybackTime,
  hasScrapedImages = false,
  setVideoUrl,
  addNotification,
  targetUrl,
  fetchWithInterceptor,
  selectedModel,
  setConsoleLogs,
}: StoryboardTimelineProps) {
  const {
    analyzingPanelId,
    isCompiling,
    isZipping,
    showBulkOps,
    setShowBulkOps,
    bulkDuration,
    setBulkDuration,
    bulkMotion,
    setBulkMotion,
    bulkPreset,
    setBulkPreset,
    handleDownloadZip,
    handleModifySpeechText,
    handleModifyMotion,
    handleModifyDuration,
    handleShiftPanel,
    handleBulkSetDuration,
    handleBulkSetMotion,
    handleBulkSetPreset,
    handleClearTimeline,
    handleAnalyzePanel,
    handleCompileVideo,
  } = useStoryboardOperations({
    panels,
    setPanels,
    setCurrentPanelIndex,
    setActivePreviewTab,
    setVideoUrl,
    addNotification,
    targetUrl,
    fetchWithInterceptor,
    selectedModel,
    setConsoleLogs,
  });

  if (panels.length === 0) {
    return <TimelineEmptyState hasScrapedImages={hasScrapedImages} />;
  }

  return (
    <div
      id="panels_timeline_section"
      className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4"
    >
      <TimelineHeader
        showBulkOps={showBulkOps}
        setShowBulkOps={setShowBulkOps}
        isZipping={isZipping}
        panelsLength={panels.length}
        handleDownloadZip={handleDownloadZip}
        isCompiling={isCompiling}
        handleCompileVideo={handleCompileVideo}
      />

      {/* Bulk Operations Menu */}
      {showBulkOps && (
        <TimelineBulkOps
          bulkDuration={bulkDuration}
          setBulkDuration={setBulkDuration}
          handleBulkSetDuration={handleBulkSetDuration}
          bulkMotion={bulkMotion}
          setBulkMotion={setBulkMotion}
          handleBulkSetMotion={handleBulkSetMotion}
          bulkPreset={bulkPreset}
          setBulkPreset={setBulkPreset}
          handleBulkSetPreset={handleBulkSetPreset}
          handleClearTimeline={handleClearTimeline}
        />
      )}

      {/* Storyboard grid */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {panels.map((panel, idx) => (
          <TimelineCard
            panel={panel}
            idx={idx}
            currentPanelIndex={currentPanelIndex}
            activePreviewTab={activePreviewTab}
            setCurrentPanelIndex={setCurrentPanelIndex}
            setActivePreviewTab={setActivePreviewTab}
            setPlaybackTime={setPlaybackTime}
            analyzingPanelId={analyzingPanelId}
            handleShiftPanel={handleShiftPanel}
            panelsLength={panels.length}
            handleModifySpeechText={handleModifySpeechText}
            handleModifyMotion={handleModifyMotion}
            handleModifyDuration={handleModifyDuration}
            handleAnalyzePanel={handleAnalyzePanel}
          />
        ))}
      </div>
    </div>
  );
}
