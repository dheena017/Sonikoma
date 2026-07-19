import React, { createContext, useContext, useState, useEffect } from 'react';
import { AutoCropSettings, OpenCVSettings, AISmartSettings } from '../types';
import { EngineRegistry } from '../services/EngineRegistry';

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
  model: "gemini-1.5-flash",
  guidance: "",
  focusMode: "standard",
};

export const defaultAutoCropSettings: AutoCropSettings = {
  engine: "opencv",
  opencv: defaultOpenCVSettings,
  aiSmart: defaultAISmartSettings,
};

interface AutoCropContextProps {
  settings: AutoCropSettings;
  updateSettings: (newSettings: Partial<AutoCropSettings>) => void;
  updateEngineSettings: (engine: "opencv" | "aiSmart", engineSettings: Partial<OpenCVSettings | AISmartSettings>) => void;
  activeEngine: string;
  setActiveEngine: (engineId: "opencv" | "aiSmart") => void;
}

const AutoCropContext = createContext<AutoCropContextProps | undefined>(undefined);

export function AutoCropProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AutoCropSettings>(defaultAutoCropSettings);

  const updateSettings = (newSettings: Partial<AutoCropSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateEngineSettings = (engine: "opencv" | "aiSmart", engineSettings: Partial<OpenCVSettings | AISmartSettings>) => {
    setSettings((prev) => ({
      ...prev,
      [engine]: {
        ...prev[engine],
        ...engineSettings,
      },
    }));
  };

  const setActiveEngine = (engineId: "opencv" | "aiSmart") => {
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
