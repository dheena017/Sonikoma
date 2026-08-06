import React, { useEffect } from 'react';
import { AutoCropProvider, useAutoCrop } from '../contexts/AutoCropContext';
import { migrateLegacySettings } from '../utils/legacyMigration';

export function AutoCropContextWrapper({ legacyProps, children }: { legacyProps: any; children: React.ReactNode }) {
  const initialEngine = legacyProps?.useLocalCV === false ? "aiSmart" : "opencv";
  return (
    <AutoCropProvider initialEngine={initialEngine}>
      <AutoCropStateSynchronizer legacyProps={legacyProps}>
        {children}
      </AutoCropStateSynchronizer>
    </AutoCropProvider>
  );
}

function AutoCropStateSynchronizer({ legacyProps, children }: { legacyProps: any; children: React.ReactNode }) {
  const { settings, updateSettings, setActiveEngine, activeEngine } = useAutoCrop();

  useEffect(() => {
    if (!legacyProps) return;
    const migrated = migrateLegacySettings(legacyProps);
    if (JSON.stringify(migrated) !== JSON.stringify(settings)) {
      updateSettings(migrated);
    }
  }, [
    legacyProps?.useLocalCV,
    legacyProps?.cropSensitivity,
    legacyProps?.cropModel,
    legacyProps?.cropPaddingPx,
    legacyProps?.cropBackgroundMode,
    legacyProps?.autoSplitTallStrips,
    legacyProps?.minPanelAreaPct,
    legacyProps?.overlapMergeThreshold,
    legacyProps?.cropMinHeightPx,
    legacyProps?.cropCannyLow,
    legacyProps?.cropCannyHigh,
    legacyProps?.cropCloseKernelSize,
    legacyProps?.aspectRatioLock,
    legacyProps?.cropGuidance,
    legacyProps?.cropFocusMode
  ]);

  useEffect(() => {
    const targetEngine = legacyProps?.useLocalCV === false ? "aiSmart" : "opencv";
    if (activeEngine !== targetEngine) {
      setActiveEngine(targetEngine);
    }
  }, [legacyProps?.useLocalCV, activeEngine, setActiveEngine]);

  return <>{children}</>;
}
