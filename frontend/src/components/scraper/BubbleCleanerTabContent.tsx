/**
 * BubbleCleanerTabContent — thin orchestrator that routes between:
 *   BubbleCleanerGeneralTab  — presets, detect, erase, slots, split-slider, scanner, perf
 *   BubbleCleanerAdvancedTab — sensitivity, color, dilation, inpaint, mask color, SFX, JSON
 *   BubbleCleanerHelpTab     — manual, legend, magnifier, doodle sandbox, crash simulator
 */
import React from "react";
import { BubbleCleanerGeneralTab } from "./BubbleCleanerGeneralTab";
import { BubbleCleanerAdvancedTab } from "./BubbleCleanerAdvancedTab";
import { BubbleCleanerHelpTab } from "./BubbleCleanerHelpTab";

export type DetectionStyle = "all" | "white_only" | "text_only";
export type EraseMethod =
  | "auto"
  | "inpaint"
  | "blur"
  | "solid_white"
  | "solid_black";

interface BubbleCleanerTabContentProps {
  activeTab: string;
  detectionStyle: DetectionStyle;
  setDetectionStyle: (v: DetectionStyle) => void;
  eraseMethod: EraseMethod;
  setEraseMethod: (v: EraseMethod) => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  bubbleDilation: number;
  setBubbleDilation: (v: number) => void;
  bubbleInpaintRadius: number;
  setBubbleInpaintRadius: (v: number) => void;
  selectedCount: number;
  scrapedImages: string[];
  selectedScraped: string[];
  addNotification?: (msg: string, type: any) => void;
}

export default function BubbleCleanerTabContent(
  props: BubbleCleanerTabContentProps
) {
  const { activeTab } = props;

  const shared = {
    detectionStyle: props.detectionStyle,
    setDetectionStyle: props.setDetectionStyle,
    eraseMethod: props.eraseMethod,
    setEraseMethod: props.setEraseMethod,
    sensitivity: props.sensitivity,
    setSensitivity: props.setSensitivity,
    bubbleDilation: props.bubbleDilation,
    setBubbleDilation: props.setBubbleDilation,
    bubbleInpaintRadius: props.bubbleInpaintRadius,
    setBubbleInpaintRadius: props.setBubbleInpaintRadius,
    selectedCount: props.selectedCount,
    scrapedImages: props.scrapedImages,
    selectedScraped: props.selectedScraped,
    addNotification: props.addNotification,
  };

  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative">
      {activeTab === "general" && <BubbleCleanerGeneralTab {...shared} />}
      {activeTab === "advanced" && <BubbleCleanerAdvancedTab {...shared} />}
      {activeTab === "help" && (
        <BubbleCleanerHelpTab
          eraseMethod={props.eraseMethod}
          bubbleDilation={props.bubbleDilation}
          bubbleInpaintRadius={props.bubbleInpaintRadius}
          addNotification={props.addNotification}
          scrapedImages={props.scrapedImages}
          selectedScraped={props.selectedScraped}
        />
      )}
    </div>
  );
}
