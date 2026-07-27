import React, { useEffect } from 'react';
import { AutoCropProvider, useAutoCrop } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext';
import { migrateLegacySettings } from '@/features/image/components/editor/Tools/ImageEditor/AutoCrop/utils/legacyMigration';

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
  const { settings, updateSettings, activeEngine } = useAutoCrop();

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
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
     if (!legacyProps?.setUseLocalCV) return;
     const isLocalCV = legacyProps.useLocalCV;
     if (activeEngine === 'opencv' && isLocalCV === false) {
         legacyProps.setUseLocalCV(true);
     } else if (activeEngine === 'aiSmart' && isLocalCV === true) {
         legacyProps.setUseLocalCV(false);
     }
  }, [activeEngine, legacyProps?.useLocalCV]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
