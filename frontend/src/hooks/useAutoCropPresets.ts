import { useState, useCallback } from "react";
import {
  CustomCropPreset,
  AutoCropSharedProps,
} from "../components/scraper/tabTypes";
import { useConfigHistory } from "./useConfigHistory";

export function useAutoCropPresets(props: AutoCropSharedProps) {
  const [customPresets, setCustomPresets] = useState<
    Record<string, CustomCropPreset>
  >(() => {
    try {
      const saved = localStorage.getItem("crop_custom_presets");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const defaults: CustomCropPreset = {
      name: "Custom Slot",
      useLocalCV: true,
      cropModel: "gemini-2.0-flash-lite",
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

  // We need to pass the current state to history, not the props object with functions
  const currentConfig = {
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
  };

  const { history, pushToHistory } = useConfigHistory<any>(
    "crop_config",
    currentConfig
  );

  const applyState = useCallback(
    (s: any) => {
      if (s.useLocalCV !== undefined) props.setUseLocalCV(s.useLocalCV);
      if (s.cropModel !== undefined) props.setCropModel(s.cropModel);
      if (s.autoSplitTallStrips !== undefined)
        props.setAutoSplitTallStrips(s.autoSplitTallStrips);
      if (s.cropSensitivity !== undefined)
        props.setCropSensitivity(s.cropSensitivity);
      if (s.cropPaddingPx !== undefined)
        props.setCropPaddingPx(s.cropPaddingPx);
      if (s.cropBackgroundMode !== undefined)
        props.setCropBackgroundMode(s.cropBackgroundMode);
      if (s.aspectRatioLock !== undefined)
        props.setAspectRatioLock(s.aspectRatioLock);
      if (s.minPanelAreaPct !== undefined)
        props.setMinPanelAreaPct(s.minPanelAreaPct);
      if (s.overlapMergeThreshold !== undefined)
        props.setOverlapMergeThreshold(s.overlapMergeThreshold);
      if (s.cropMinHeightPx !== undefined)
        props.setCropMinHeightPx(s.cropMinHeightPx);
      if (s.cropCannyLow !== undefined) props.setCropCannyLow(s.cropCannyLow);
      if (s.cropCannyHigh !== undefined)
        props.setCropCannyHigh(s.cropCannyHigh);
      if (s.cropCloseKernelSize !== undefined)
        props.setCropCloseKernelSize(s.cropCloseKernelSize);
    },
    [props]
  );

  const savePresetSlot = useCallback(
    (slot: string, name: string) => {
      const config = {
        ...currentConfig,
        name: name.trim() || `Custom ${slot.toUpperCase()}`,
      };
      console.log(`[Auto Cropper] Saving preset to slot ${slot}:`, config);
      const updated = { ...customPresets, [slot]: config };
      setCustomPresets(updated);
      localStorage.setItem("crop_custom_presets", JSON.stringify(updated));
      setActiveSlot(slot);
      pushToHistory(config);
      props.addNotification?.(
        `Saved configuration to preset: "${config.name}"`,
        "success"
      );
    },
    [customPresets, currentConfig, props.addNotification, pushToHistory]
  );

  const loadPresetSlot = useCallback(
    (slot: string) => {
      const t = customPresets[slot];
      if (!t) return;
      console.log(`[Auto Cropper] Loading preset from slot ${slot}:`, t);
      applyState(t);
      setActiveSlot(slot);
      props.addNotification?.(`Loaded preset config: "${t.name}"`, "info");
    },
    [customPresets, applyState, props.addNotification]
  );

  const applyBuiltInPreset = useCallback(
    (preset: Partial<CustomCropPreset> & { id: string, label?: string }) => {
      applyState(preset);
      setActiveSlot(preset.id);
      pushToHistory(preset);
      props.addNotification?.(`Applied preset: ${preset.label || preset.id}`, "info");
    },
    [applyState, pushToHistory, props.addNotification]
  );

  return {
    customPresets,
    activeSlot,
    setActiveSlot,
    savePresetSlot,
    loadPresetSlot,
    applyBuiltInPreset,
    history,
    applyState,
  };
}
