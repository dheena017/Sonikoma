import React, { useState } from "react";
import { GeneratedPanel } from "../../types";
import { useStoryboardOperations } from "../../hooks/useStoryboardOperations";

import TimelineEmptyState from "./TimelineEmptyState";
import TimelineHeader from "./TimelineHeader";
import TimelineBulkOps from "./TimelineBulkOps";
import TimelineCard from "./TimelineCard";
import TimelineSelectionBar from "./TimelineSelectionBar";

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
  voiceActor?: string;
  musicTheme?: string;
  narrationStyle?: string;
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
  voiceActor,
  musicTheme,
  narrationStyle = "long",
}: StoryboardTimelineProps) {
  // ── Panel selection state ────────────────────────────────────────────────
  const [selectedPanelIds, setSelectedPanelIds] = useState<Set<number>>(
    new Set()
  );

  const togglePanelSelection = (id: number) => {
    setSelectedPanelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPanels = () => {
    setSelectedPanelIds(new Set(panels.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedPanelIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedPanelIds.size === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete the ${selectedPanelIds.size} selected panel(s)?`
      )
    ) {
      setPanels((prev) => prev.filter((p) => !selectedPanelIds.has(p.id)));
      clearSelection();
      addNotification?.(
        `Deleted ${selectedPanelIds.size} selected panels`,
        "info"
      );
    }
  };

  const handleBulkModifyDuration = (val: number) => {
    if (selectedPanelIds.size === 0) return;
    setPanels((prev) =>
      prev.map((p) =>
        selectedPanelIds.has(p.id) ? { ...p, duration: val } : p
      )
    );
    addNotification?.(`Set duration of selected panels to ${val}s`, "success");
  };

  const handleBulkModifyMotion = (val: string) => {
    if (selectedPanelIds.size === 0) return;
    setPanels((prev) =>
      prev.map((p) =>
        selectedPanelIds.has(p.id) ? { ...p, motion_type: val } : p
      )
    );
    addNotification?.(
      `Set motion style of selected panels to '${val}'`,
      "success"
    );
  };
  // ────────────────────────────────────────────────────────────────────────

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
    handleModifySFX,
    handleModifyVisualDescription,
    handleBulkSetDuration,
    handleBulkSetMotion,
    handleBulkSetPreset,
    handleClearTimeline,
    handleAnalyzePanel,
    handleAnalyzeAllPanels,
    handleAnalyzeSelectedPanels,
    isAnalyzingAll,
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
    voiceActor,
    musicTheme,
    narrationStyle,
  });

  if (panels.length === 0) {
    return <TimelineEmptyState hasScrapedImages={hasScrapedImages} />;
  }

  const selectedCount = selectedPanelIds.size;

  return (
    <div
      id="panels_timeline_section"
      className={`bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 transition-all ${
        selectedCount > 0 ? "pb-24" : ""
      }`}
    >
      <TimelineHeader
        showBulkOps={showBulkOps}
        setShowBulkOps={setShowBulkOps}
        isZipping={isZipping}
        panelsLength={panels.length}
        handleDownloadZip={handleDownloadZip}
        isAnalyzingAll={isAnalyzingAll}
        handleAnalyzeAllPanels={handleAnalyzeAllPanels}
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
      <div
        className={`flex gap-3 sm:gap-4 overflow-x-auto scrollbar-thin ${
          selectedCount > 0 ? "pb-2" : "pb-4"
        }`}
      >
        {panels.map((panel, idx) => (
          <TimelineCard
            key={panel.id}
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
            handleModifySFX={handleModifySFX}
            handleModifyVisualDescription={handleModifyVisualDescription}
            handleAnalyzePanel={handleAnalyzePanel}
            isSelected={selectedPanelIds.has(panel.id)}
            onToggleSelect={() => togglePanelSelection(panel.id)}
          />
        ))}
      </div>

      {/* Fixed floating selection bar — stays at bottom of screen when scrolling */}
      <TimelineSelectionBar
        selectedCount={selectedCount}
        totalCount={panels.length}
        isAnalyzingAll={isAnalyzingAll}
        handleAnalyzeSelected={() => {
          handleAnalyzeSelectedPanels(Array.from(selectedPanelIds));
          clearSelection();
        }}
        selectAllPanels={selectAllPanels}
        clearSelection={clearSelection}
        isCompiling={isCompiling}
        handleCompileVideo={handleCompileVideo}
        handleDeleteSelected={handleDeleteSelected}
        handleBulkModifyDuration={handleBulkModifyDuration}
        handleBulkModifyMotion={handleBulkModifyMotion}
      />
    </div>
  );
}
