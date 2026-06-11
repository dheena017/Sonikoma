/**
 * AutoCropTabContent — thin orchestrator that routes between the three
 * sub-tab components: General · Layout · Advanced · Help
 */
import React from "react";
import { AutoCropGeneralTab } from "./AutoCropGeneralTab";
import { AutoCropLayoutTab } from "./AutoCropLayoutTab";
import { AutoCropAdvancedTab } from "./AutoCropAdvancedTab";
import { AutoCropHelpTab } from "./AutoCropHelpTab";
import { GlobalScraperConfigTool } from "./GlobalScraperConfigTool";

export interface AutoCropTabContentProps {
  activeTab: string;
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  cropModel: string;
  setCropModel: (v: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (v: boolean) => void;
  cropSensitivity: number;
  setCropSensitivity: (v: number) => void;
  cropPaddingPx: number;
  setCropPaddingPx: (v: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (v: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
  scrapedImages: string[];
  selectedScraped: string[];
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification?: (msg: string, type: any) => void;
}

export default function AutoCropTabContent(props: AutoCropTabContentProps) {
  const { activeTab } = props;

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative">
      {activeTab === "general" && <AutoCropGeneralTab {...props} />}
      {activeTab === "layout"  && (
        <AutoCropLayoutTab
          cropPaddingPx={props.cropPaddingPx}
          setCropPaddingPx={props.setCropPaddingPx}
          cropBackgroundMode={props.cropBackgroundMode}
          setCropBackgroundMode={props.setCropBackgroundMode}
          aspectRatioLock={props.aspectRatioLock}
          setAspectRatioLock={props.setAspectRatioLock}
          scrapedImages={props.scrapedImages}
          selectedScraped={props.selectedScraped}
          autoSplitTallStrips={props.autoSplitTallStrips}
          overlapMergeThreshold={props.overlapMergeThreshold}
          cropSensitivity={props.cropSensitivity}
          cropCannyLow={props.cropCannyLow}
          cropCannyHigh={props.cropCannyHigh}
          cropCloseKernelSize={props.cropCloseKernelSize}
        />
      )}
      {activeTab === "advanced" && (
        <AutoCropAdvancedTab
          useLocalCV={props.useLocalCV}
          cropModel={props.cropModel}
          autoSplitTallStrips={props.autoSplitTallStrips}
          cropSensitivity={props.cropSensitivity}
          setCropSensitivity={props.setCropSensitivity}
          cropPaddingPx={props.cropPaddingPx}
          cropBackgroundMode={props.cropBackgroundMode}
          aspectRatioLock={props.aspectRatioLock}
          minPanelAreaPct={props.minPanelAreaPct}
          setMinPanelAreaPct={props.setMinPanelAreaPct}
          overlapMergeThreshold={props.overlapMergeThreshold}
          setOverlapMergeThreshold={props.setOverlapMergeThreshold}
          cropMinHeightPx={props.cropMinHeightPx}
          setCropMinHeightPx={props.setCropMinHeightPx}
          cropCannyLow={props.cropCannyLow}
          setCropCannyLow={props.setCropCannyLow}
          cropCannyHigh={props.cropCannyHigh}
          setCropCannyHigh={props.setCropCannyHigh}
          cropCloseKernelSize={props.cropCloseKernelSize}
          setCropCloseKernelSize={props.setCropCloseKernelSize}
        />
      )}
      {activeTab === "help" && <AutoCropHelpTab />}

      <GlobalScraperConfigTool addNotification={props.addNotification} />
    </div>
  );
}
