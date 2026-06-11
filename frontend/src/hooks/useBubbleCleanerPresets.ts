import { useState, useCallback } from "react";
import { CustomBubblePreset, BubbleCleanerSharedProps } from "../components/scraper/tabTypes";

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

  const savePresetSlot = useCallback((slot: string, name: string) => {
    const updated = {
      ...customPresets,
      [slot]: {
        name: name.trim() || `Custom Slot ${slot.slice(-1)}`,
        detectionStyle: props.detectionStyle,
        eraseMethod: props.eraseMethod,
        sensitivity: props.sensitivity,
        bubbleDilation: props.bubbleDilation,
        bubbleInpaintRadius: props.bubbleInpaintRadius
      }
    };
    setCustomPresets(updated);
    localStorage.setItem("bubble_custom_presets", JSON.stringify(updated));
    setActiveSlot(slot);
    props.addNotification?.(`Saved custom preset: "${updated[slot].name}"`, "success");
  }, [customPresets, props]);

  const loadPresetSlot = useCallback((slot: string) => {
    const t = customPresets[slot];
    if (!t) return;
    props.setDetectionStyle(t.detectionStyle);
    props.setEraseMethod(t.eraseMethod);
    props.setSensitivity(t.sensitivity);
    props.setBubbleDilation(t.bubbleDilation);
    props.setBubbleInpaintRadius(t.bubbleInpaintRadius);
    setActiveSlot(slot);
    props.addNotification?.(`Loaded preset: "${t.name}"`, "info");
  }, [customPresets, props]);

  const applyQuickPreset = useCallback((preset: Partial<CustomBubblePreset> & { id: string }) => {
    if (preset.detectionStyle !== undefined) props.setDetectionStyle(preset.detectionStyle);
    if (preset.eraseMethod !== undefined) props.setEraseMethod(preset.eraseMethod);
    if (preset.sensitivity !== undefined) props.setSensitivity(preset.sensitivity);
    if (preset.bubbleDilation !== undefined) props.setBubbleDilation(preset.bubbleDilation);
    if (preset.bubbleInpaintRadius !== undefined) props.setBubbleInpaintRadius(preset.bubbleInpaintRadius);
    setActiveSlot(preset.id);
  }, [props]);

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
  }, [customPresets, props]);

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
  }, [props]);

  return {
    customPresets,
    activeSlot,
    setActiveSlot,
    savePresetSlot,
    loadPresetSlot,
    applyQuickPreset,
    exportPresets,
    importPresets
  };
}
