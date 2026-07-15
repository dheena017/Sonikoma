import { normalizeLog } from "../types/logs";
import React from "react";
import { GeneratedPanel } from "../types";

interface UseSceneModifierProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setCurrentPanelIndex: (idx: number) => void;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification?: (message: string, type: any) => void;
  audioFeedback?: any;
}

export function useSceneModifier({
  panels,
  setPanels,
  setCurrentPanelIndex,
  setConsoleLogs,
  addNotification,
  audioFeedback,
}: UseSceneModifierProps) {
  const handleModifySpeechText = (panelId: number, text: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalText = originalPanel ? originalPanel.speech_text : "";

    // Dynamically calculate estimated duration based on dialogue text length
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    const newDuration = text.trim()
      ? Math.max(
          2.5,
          Math.min(12.0, parseFloat((words / 2.2 + 0.8).toFixed(1)))
        )
      : 3.0; // default for empty/blank panels

    const autoAdjusted =
      newDuration !== (originalPanel ? originalPanel.duration : 0.0);

    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId
          ? {
              ...p,
              speech_text: text,
              duration: newDuration,
              audio_url: undefined,
            }
          : p
      )
    );

    console.log(
      `[Timeline] [Text Edit] Panel #${panelId} dialogue revised. Duration: ${newDuration}s (Auto-adjusted: ${autoAdjusted}):`
    );
    console.log(`  - Sent (Original): "${originalText}"`);
    console.log(`  - Revise (Revised): "${text}"`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Dialogue revised on Panel #${panelId} (Duration: ${newDuration}s, Auto-adjusted: ${autoAdjusted})`,
        `[Speech Bubbles]   - Sent (Original): "${originalText}"`,
        `[Speech Bubbles]   - Revise (Revised): "${text}"`,
        ...prev,
      ]);
    }
    const durationMsg = autoAdjusted
      ? `Duration updated to ${newDuration}s to match text length.`
      : `Duration kept at ${newDuration}s.`;
    addNotification?.(
      `Panel #${panelId} dialogue updated. ${durationMsg}`,
      "info"
    );
    audioFeedback?.playTick();
  };

  const handleModifyMotion = (panelId: number, motionVal: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalMotion = originalPanel ? originalPanel.motion_type : "";
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, motion_type: motionVal } : p))
    );
    console.log(
      `[Timeline] [Motion Edit] Panel #${panelId} camera motion changed:`
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
    addNotification?.(
      `Panel #${panelId} motion updated to ${motionVal}.`,
      "info"
    );
    audioFeedback?.playTick();
  };

  const handleModifyDuration = (panelId: number, durVal: number) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalDuration = originalPanel ? originalPanel.duration : 0;
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, duration: durVal, audio_url: undefined } : p
      )
    );
    console.log(
      `[Timeline] [Duration Edit] Panel #${panelId} duration changed:`
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
    addNotification?.(`Panel #${panelId} duration set to ${durVal}s.`, "info");
    audioFeedback?.playTick();
  };

  const handleModifySFX = (panelId: number, sfxVal: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalSFX = originalPanel ? originalPanel.sfx : "";
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, sfx: sfxVal } : p))
    );
    console.log(`[Timeline] [SFX Edit] Panel #${panelId} SFX revised:`);
    console.log(`  - Sent (Original): "${originalSFX}"`);
    console.log(`  - Revise (Revised): "${sfxVal}"`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[SFX] Sound effect revised on Panel #${panelId}`,
        `[SFX]   - Sent (Original): "${originalSFX}"`,
        `[SFX]   - Revise (Revised): "${sfxVal}"`,
        ...prev,
      ]);
    }
    audioFeedback?.playTick();
  };

  const handleModifyVisualDescription = (panelId: number, descVal: string) => {
    const originalPanel = panels.find((p) => p.id === panelId);
    const originalDesc = originalPanel ? originalPanel.visual_description : "";
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, visual_description: descVal } : p
      )
    );
    console.log(
      `[Timeline] [Visual Edit] Panel #${panelId} visual description revised:`
    );
    console.log(`  - Sent (Original): "${originalDesc}"`);
    console.log(`  - Revise (Revised): "${descVal}"`);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Visual] Description revised on Panel #${panelId}`,
        `[Visual]   - Sent (Original): "${originalDesc}"`,
        `[Visual]   - Revise (Revised): "${descVal}"`,
        ...prev,
      ]);
    }
    audioFeedback?.playTick();
  };



  const handleShiftPanel = (index: number, direction: "left" | "right") => {
    audioFeedback?.playTick();
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

  const handleModifyNarrative = (panelId: number, text: string) => {
    setPanels((prev) =>
      prev.map((p) =>
        p.id === panelId
          ? {
              ...p,
              narrative: text,
              narrative_audio_url: undefined, // invalidate existing audio when text changes
            }
          : p
      )
    );
    audioFeedback?.playTick();
  };

  return {
    handleModifySpeechText,
    handleModifyMotion,
    handleModifyDuration,
    handleShiftPanel,
    handleModifySFX,
    handleModifyVisualDescription,
    handleModifyNarrative,
  };
}
