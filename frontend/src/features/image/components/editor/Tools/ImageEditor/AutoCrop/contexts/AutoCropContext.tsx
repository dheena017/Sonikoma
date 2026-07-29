import React, { createContext, useContext, useState, useEffect } from 'react';
import { AutoCropSettings, OpenCVSettings, AISmartSettings, HybridSettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/types';
import { EngineRegistry } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/services/EngineRegistry';

const defaultOpenCVSettings: OpenCVSettings = {
  sensitivity: 30,
  paddingPx: 10,
  backgroundMode: "auto",
  autoSplitTallStrips: true,
  minPanelAreaPct: 2.0,
  overlapMergeThreshold: 20,
  minHeightPx: 60,
  cannyLow: 20,
  cannyHigh: 100,
  closeKernelSize: 15,
  aspectRatioLock: "free",
};

const defaultAISmartSettings: AISmartSettings = {
  model: "gemini-2.5-flash",
  guidance: "",
  focusMode: "standard",
};

const defaultHybridSettings: HybridSettings = {
  mode: "balanced",
};

export const defaultAutoCropSettings: AutoCropSettings = {
  engine: "hybrid",
  imageType: "auto",
  opencv: defaultOpenCVSettings,
  aiSmart: defaultAISmartSettings,
  hybrid: defaultHybridSettings,
};

interface AutoCropContextProps {
  settings: AutoCropSettings;
  updateSettings: (newSettings: Partial<AutoCropSettings>) => void;
  updateEngineSettings: (engine: "opencv" | "aiSmart" | "hybrid", engineSettings: Partial<OpenCVSettings | AISmartSettings | HybridSettings>) => void;
  activeEngine: string;
  setActiveEngine: (engineId: "opencv" | "aiSmart" | "hybrid") => void;
}

const AutoCropContext = createContext<AutoCropContextProps | undefined>(undefined);

export function AutoCropProvider({
  children,
  initialEngine = "hybrid"
}: {
  children: React.ReactNode;
  initialEngine?: "opencv" | "aiSmart" | "hybrid";
}) {
  const [settings, setSettings] = useState<AutoCropSettings>(() => ({
    ...defaultAutoCropSettings,
    engine: initialEngine,
  }));

  const updateSettings = (newSettings: Partial<AutoCropSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateEngineSettings = (engine: "opencv" | "aiSmart" | "hybrid", engineSettings: Partial<OpenCVSettings | AISmartSettings | HybridSettings>) => {
    setSettings((prev) => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        ...engineSettings,
      },
    }));
  };

  const setActiveEngine = (engineId: "opencv" | "aiSmart" | "hybrid") => {
    updateSettings({ engine: engineId });
  };

  return (
    <AutoCropContext.Provider
      value={{
        settings,
        updateSettings,
        updateEngineSettings,
        activeEngine: settings.engine,
        setActiveEngine,
      }}
    >
      {children}
    </AutoCropContext.Provider>
  );
}

export function useAutoCrop() {
  const context = useContext(AutoCropContext);
  if (!context) {
    throw new Error("useAutoCrop must be used within an AutoCropProvider");
  }
  return context;
}
