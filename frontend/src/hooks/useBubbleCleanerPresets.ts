import { useState, useCallback } from "react";
import { CustomBubblePreset, BubbleCleanerSharedProps } from "../components/scraper/tabTypes";
import { useConfigHistory } from "./useConfigHistory";

export function useBubbleCleanerPresets(props: BubbleCleanerSharedProps) {
  const [customPresets, setCustomPresets] = useState<Record<string, CustomBubblePreset>>(() => {
    try {
      const s = localStorage.getItem("bubble_custom_presets");
      if (s) return JSON.parse(s);
    } catch (_) {}
    return {
      slot1: { name: "Custom Slot 1", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
      slot2: { name: "Custom Slot 2", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
      slot3: { name: "Custom Slot 3", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
    };
  });

  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const currentConfig = {
    detectionStyle: props.detectionStyle,
    eraseMethod: props.eraseMethod,
    sensitivity: props.sensitivity,
    bubbleDilation: props.bubbleDilation,
    bubbleInpaintRadius: props.bubbleInpaintRadius
  };

  const { history, pushToHistory } = useConfigHistory<any>("bubble_config", currentConfig);

  const applyState = useCallback((s: any) => {
    if (s.detectionStyle !== undefined) props.setDetectionStyle(s.detectionStyle);
    if (s.eraseMethod !== undefined) props.setEraseMethod(s.eraseMethod);
    if (s.sensitivity !== undefined) props.setSensitivity(s.sensitivity);
    if (s.bubbleDilation !== undefined) props.setBubbleDilation(s.bubbleDilation);
    if (s.bubbleInpaintRadius !== undefined) props.setBubbleInpaintRadius(s.bubbleInpaintRadius);
  }, [props]);

  const savePresetSlot = useCallback((slot: string, name: string) => {
    const config = {
      ...currentConfig,
      name: name.trim() || `Custom Slot ${slot.slice(-1)}`,
    };
    const updated = { ...customPresets, [slot]: config };
    setCustomPresets(updated);
    localStorage.setItem("bubble_custom_presets", JSON.stringify(updated));
    setActiveSlot(slot);
    pushToHistory(config);
    props.addNotification?.(`Saved custom preset: "${config.name}"`, "success");
  }, [customPresets, currentConfig, props.addNotification, pushToHistory]);

  const loadPresetSlot = useCallback((slot: string) => {
    const t = customPresets[slot];
    if (!t) return;
    applyState(t);
    setActiveSlot(slot);
    props.addNotification?.(`Loaded preset: "${t.name}"`, "info");
  }, [customPresets, applyState, props.addNotification]);

  const applyQuickPreset = useCallback((preset: Partial<CustomBubblePreset> & { id: string }) => {
    applyState(preset);
    setActiveSlot(preset.id);
    pushToHistory(preset);
  }, [applyState, pushToHistory]);

  const exportPresets = useCallback(() => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPresets, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "bubble_cleaner_presets.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
      props.addNotification?.("Successfully exported presets configuration.", "success");
    } catch (err: any) {
      props.addNotification?.("Failed to export presets: " + err.message, "error");
    }
  }, [customPresets, props.addNotification]);

  const importPresets = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.slot1 && parsed.slot2 && parsed.slot3) {
        setCustomPresets(parsed);
        localStorage.setItem("bubble_custom_presets", JSON.stringify(parsed));
        props.addNotification?.("Presets imported successfully!", "success");
        return true;
      } else {
        throw new Error("Invalid presets file format.");
      }
    } catch (err: any) {
      props.addNotification?.("Failed to parse file: " + err.message, "error");
      return false;
    }
  }, [props.addNotification]);

  return {
    customPresets,
    activeSlot,
    setActiveSlot,
    savePresetSlot,
    loadPresetSlot,
    applyQuickPreset,
    exportPresets,
    importPresets,
    history,
    applyState
  };
}
