import React, { useEffect } from 'react';
import { AutoCropProvider, useAutoCrop } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext';
import { migrateLegacySettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/utils/legacyMigration';

export function AutoCropContextWrapper({ legacyProps, children }: { legacyProps: any; children: React.ReactNode }) {
  const initialEngine = legacyProps?.useLocalCV === false ? "aiSmart" : "hybrid";
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
    // Only force engine switch if it's currently on an engine that directly contradicts useLocalCV
    // If useLocalCV is true, and engine is aiSmart, switch to opencv or hybrid.
    // We'll trust the migrateLegacySettings more now, but keep this simple safeguard.
    if (legacyProps?.useLocalCV === false && activeEngine !== "aiSmart") {
       setActiveEngine("aiSmart");
    } else if (legacyProps?.useLocalCV === true && activeEngine === "aiSmart") {
       setActiveEngine("hybrid"); // default back to hybrid if AI turned off
    }
  }, [legacyProps?.useLocalCV, activeEngine, setActiveEngine]);

  return <>{children}</>;
}
