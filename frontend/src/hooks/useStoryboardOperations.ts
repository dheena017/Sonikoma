import React from "react";
import { GeneratedPanel } from "../types.js";
import { useBulkOperations } from "./useBulkOperations.js";
import { useSceneModifier } from "./useSceneModifier.js";
import { useCompileActions } from "./useCompileActions.js";

interface UseStoryboardOperationsProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: unknown) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  voiceActor?: string;
  musicTheme?: string;
}

export function useStoryboardOperations({
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
}: UseStoryboardOperationsProps) {
  
  const {
    showBulkOps,
    setShowBulkOps,
    bulkDuration,
    setBulkDuration,
    bulkMotion,
    setBulkMotion,
    bulkPreset,
    setBulkPreset,
    handleBulkSetDuration,
    handleBulkSetMotion,
    handleBulkSetPreset,
  } = useBulkOperations({ setPanels, addNotification });

  const {
    handleModifySpeechText,
    handleModifyMotion,
    handleModifyDuration,
    handleShiftPanel,
    handleModifySFX,
    handleModifyVisualDescription,
  } = useSceneModifier({ panels, setPanels, setCurrentPanelIndex, setConsoleLogs, addNotification });

  const {
    analyzingPanelId,
    isAnalyzingAll,
    isCompiling,
    isZipping,
    handleDownloadZip,
    handleAnalyzePanel,
    handleAnalyzeAllPanels,
    handleAnalyzeSelectedPanels,
    handleCompileVideo,
  } = useCompileActions({
    panels,
    setPanels,
    setActivePreviewTab,
    setVideoUrl,
    addNotification,
    targetUrl,
    fetchWithInterceptor,
    selectedModel,
    setConsoleLogs,
    voiceActor,
    musicTheme,
  });

  const handleClearTimeline = () => {
    if (window.confirm("Are you sure you want to clear the entire storyboard timeline?")) {
      setPanels([]);
      addNotification?.("Storyboard cleared", "info");
    }
  };

  return {
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
  };
}
