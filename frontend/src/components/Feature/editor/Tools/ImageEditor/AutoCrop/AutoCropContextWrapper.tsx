import React, { useEffect } from 'react';
import { AutoCropProvider, useAutoCrop } from './contexts/AutoCropContext';
import { migrateLegacySettings } from './utils/legacyMigration';

export function AutoCropContextWrapper({ legacyProps, children }: { legacyProps: any; children: React.ReactNode }) {
  return (
    <AutoCropProvider>
      <AutoCropStateSynchronizer legacyProps={legacyProps}>
        {children}
      </AutoCropStateSynchronizer>
    </AutoCropProvider>
  );
}

function AutoCropStateSynchronizer({ legacyProps, children }: { legacyProps: any; children: React.ReactNode }) {
  const { settings, updateSettings, activeEngine, setActiveEngine } = useAutoCrop();

  // The original components are going to be mutating legacyProps continuously via the setter functions.
  // Instead of pushing state down from our Context to legacy props, we actually need to sync legacyProps INTO our context
  // so that the activeEngine highlights correctly and settings stay in sync if external forces change them.
  useEffect(() => {
    const migrated = migrateLegacySettings(legacyProps);
    // Deep equal check to avoid infinite render loops
    if (JSON.stringify(migrated) !== JSON.stringify(settings)) {
        updateSettings(migrated);
    }
  }, [
      legacyProps.useLocalCV,
      legacyProps.cropSensitivity,
      legacyProps.cropModel,
      legacyProps.cropPaddingPx,
      legacyProps.cropBackgroundMode,
      legacyProps.autoSplitTallStrips,
      legacyProps.minPanelAreaPct,
      legacyProps.overlapMergeThreshold,
      legacyProps.cropMinHeightPx,
      legacyProps.cropCannyLow,
      legacyProps.cropCannyHigh,
      legacyProps.cropCloseKernelSize,
      legacyProps.aspectRatioLock,
      legacyProps.cropGuidance,
      legacyProps.cropFocusMode
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also sync engine selection back up if clicked from the new UI wrapper
  useEffect(() => {
     if (activeEngine === 'opencv' && legacyProps.useLocalCV === false && legacyProps.setUseLocalCV) {
         legacyProps.setUseLocalCV(true);
     } else if (activeEngine === 'aiSmart' && legacyProps.useLocalCV === true && legacyProps.setUseLocalCV) {
         legacyProps.setUseLocalCV(false);
     }
  }, [activeEngine]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
