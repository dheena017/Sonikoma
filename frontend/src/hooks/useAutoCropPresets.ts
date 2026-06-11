import { useState, useCallback } from "react";
import { CustomCropPreset, AutoCropSharedProps } from "../components/scraper/tabTypes";

export function useAutoCropPresets(props: AutoCropSharedProps) {
  const [customPresets, setCustomPresets] = useState<Record<string, CustomCropPreset>>(() => {
    try {
      const saved = localStorage.getItem("crop_custom_presets");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const defaults: CustomCropPreset = {
      name: "Custom Slot",
      useLocalCV: true,
      cropModel: "gemini-2.5-flash",
      autoSplitTallStrips: true,
      cropSensitivity: 30,
      cropPaddingPx: 10,
      cropBackgroundMode: "auto",
      aspectRatioLock: "free",
      minPanelAreaPct: 2.0,
      overlapMergeThreshold: 20,
      cropMinHeightPx: 60,
      cropCannyLow: 20,
      cropCannyHigh: 100,
      cropCloseKernelSize: 15,
    };
    return {
      slot1: { ...defaults, name: "Custom Slot 1" },
      slot2: { ...defaults, name: "Custom Slot 2" },
      slot3: { ...defaults, name: "Custom Slot 3" },
    };
  });

  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const savePresetSlot = useCallback((slot: string, name: string) => {
    const updated = {
      ...customPresets,
      [slot]: {
        name: name.trim() || `Custom ${slot.toUpperCase()}`,
        useLocalCV: props.useLocalCV,
        cropModel: props.cropModel,
        autoSplitTallStrips: props.autoSplitTallStrips,
        cropSensitivity: props.cropSensitivity,
        cropPaddingPx: props.cropPaddingPx,
        cropBackgroundMode: props.cropBackgroundMode,
        aspectRatioLock: props.aspectRatioLock,
        minPanelAreaPct: props.minPanelAreaPct,
        overlapMergeThreshold: props.overlapMergeThreshold,
        cropMinHeightPx: props.cropMinHeightPx,
        cropCannyLow: props.cropCannyLow,
        cropCannyHigh: props.cropCannyHigh,
        cropCloseKernelSize: props.cropCloseKernelSize,
      },
    };
    setCustomPresets(updated);
    localStorage.setItem("crop_custom_presets", JSON.stringify(updated));
    setActiveSlot(slot);
    props.addNotification?.(`Saved configuration to preset: "${updated[slot].name}"`, "success");
  }, [customPresets, props]);

  const loadPresetSlot = useCallback((slot: string) => {
    const t = customPresets[slot];
    if (!t) return;
    props.setUseLocalCV(t.useLocalCV);
    props.setCropModel(t.cropModel);
    props.setAutoSplitTallStrips(t.autoSplitTallStrips);
    props.setCropSensitivity(t.cropSensitivity);
    props.setCropPaddingPx(t.cropPaddingPx);
    props.setCropBackgroundMode(t.cropBackgroundMode);
    props.setAspectRatioLock(t.aspectRatioLock);
    props.setMinPanelAreaPct(t.minPanelAreaPct);
    props.setOverlapMergeThreshold(t.overlapMergeThreshold);
    props.setCropMinHeightPx(t.cropMinHeightPx);
    props.setCropCannyLow(t.cropCannyLow);
    props.setCropCannyHigh(t.cropCannyHigh);
    props.setCropCloseKernelSize(t.cropCloseKernelSize);
    setActiveSlot(slot);
    props.addNotification?.(`Loaded preset config: "${t.name}"`, "info");
  }, [customPresets, props]);

  const applyBuiltInPreset = useCallback((preset: Partial<CustomCropPreset> & { id: string }) => {
    if (preset.cropSensitivity !== undefined) props.setCropSensitivity(preset.cropSensitivity);
    if (preset.cropPaddingPx !== undefined) props.setCropPaddingPx(preset.cropPaddingPx);
    if (preset.cropBackgroundMode !== undefined) props.setCropBackgroundMode(preset.cropBackgroundMode);
    if (preset.aspectRatioLock !== undefined) props.setAspectRatioLock(preset.aspectRatioLock);
    if (preset.autoSplitTallStrips !== undefined) props.setAutoSplitTallStrips(preset.autoSplitTallStrips);
    if (preset.minPanelAreaPct !== undefined) props.setMinPanelAreaPct(preset.minPanelAreaPct);
    if (preset.overlapMergeThreshold !== undefined) props.setOverlapMergeThreshold(preset.overlapMergeThreshold);

    setActiveSlot(preset.id);
  }, [props]);

  return {
    customPresets,
    activeSlot,
    setActiveSlot,
    savePresetSlot,
    loadPresetSlot,
    applyBuiltInPreset
  };
}
