import React from "react";
import { GeneratedPanel } from "../types";

interface UseSceneModifierProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setCurrentPanelIndex: (idx: number) => void;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useSceneModifier({
  panels,
  setPanels,
  setCurrentPanelIndex,
  setConsoleLogs,
}: UseSceneModifierProps) {
  const handleModifySpeechText = (panelId: number, text: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalText = originalPanel ? originalPanel.speech_text : "";
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, speech_text: text } : p))
    );
    console.log(
      `[StoryboardTimeline] [Text Edit] Panel #${panelId} dialogue revised:`
    );
    console.log(`  - Sent (Original): "${originalText}"`);
    console.log(`  - Revise (Revised): "${text}"`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Dialogue revised on Panel #${panelId}`,
        `[Speech Bubbles]   - Sent (Original): "${originalText}"`,
        `[Speech Bubbles]   - Revise (Revised): "${text}"`,
        ...prev,
      ]);
    }
  };

  const handleModifyMotion = (panelId: number, motionVal: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalMotion = originalPanel ? originalPanel.motion_type : "";
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, motion_type: motionVal } : p))
    );
    console.log(
      `[StoryboardTimeline] [Motion Edit] Panel #${panelId} camera motion changed:`
    );
    console.log(`  - Sent (Original): "${originalMotion}"`);
    console.log(`  - Revise (Revised): "${motionVal}"`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[MoviePy] Camera motion revised on Panel #${panelId}`,
        `[MoviePy]   - Sent (Original): "${originalMotion}"`,
        `[MoviePy]   - Revise (Revised): "${motionVal}"`,
        ...prev,
      ]);
    }
  };

  const handleModifyDuration = (panelId: number, durVal: number) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalDuration = originalPanel ? originalPanel.duration : 0;
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, duration: durVal } : p))
    );
    console.log(
      `[StoryboardTimeline] [Duration Edit] Panel #${panelId} duration changed:`
    );
    console.log(`  - Sent (Original): ${originalDuration}s`);
    console.log(`  - Revise (Revised): ${durVal}s`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[MoviePy] Playback duration revised on Panel #${panelId}`,
        `[MoviePy]   - Sent (Original): ${originalDuration}s`,
        `[MoviePy]   - Revise (Revised): ${durVal}s`,
        ...prev,
      ]);
    }
  };

  const handleShiftPanel = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index > 0) {
      setPanels((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index - 1];
        copy[index - 1] = temp;
        return copy;
      });
      setCurrentPanelIndex(index - 1);
    } else if (direction === "right" && index < panels.length - 1) {
      setPanels((prev) => {
        const copy = [...prev];
        const temp = copy[index];
        copy[index] = copy[index + 1];
        copy[index + 1] = temp;
        return copy;
      });
      setCurrentPanelIndex(index + 1);
    }
  };

  return {
    handleModifySpeechText,
    handleModifyMotion,
    handleModifyDuration,
    handleShiftPanel,
  };
}
