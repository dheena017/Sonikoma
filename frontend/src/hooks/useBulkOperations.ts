import React, { useState } from "react";
import { GeneratedPanel } from "../types";

interface UseBulkOperationsProps {
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  addNotification?: (message: string, type: unknown) => void;
}

export function useBulkOperations({
  setPanels,
  addNotification,
}: UseBulkOperationsProps) {
  const [showBulkOps, setShowBulkOps] = useState<boolean>(false);
  const [bulkDuration, setBulkDuration] = useState<number>(4.0);
  const [bulkMotion, setBulkMotion] = useState<string>("zoom_in");
  const [bulkPreset, setBulkPreset] = useState<string>("none");

  const handleBulkSetDuration = () => {
    console.log(
      `[Bulk Ops] Setting duration to ${bulkDuration}s for all panels`
    );
    setPanels((prev) => prev.map((p) => ({ ...p, duration: bulkDuration })));
    addNotification?.(
      `Applied ${bulkDuration}s duration to all panels!`,
      "success"
    );
  };

  const handleBulkSetMotion = () => {
    console.log(`[Bulk Ops] Setting motion to ${bulkMotion} for all panels`);
    setPanels((prev) => prev.map((p) => ({ ...p, motion_type: bulkMotion })));
    addNotification?.(
      `Applied '${bulkMotion}' motion to all panels!`,
      "success"
    );
  };

  const handleBulkSetPreset = () => {
    console.log(
      `[Bulk Ops] Setting filter preset to ${bulkPreset} for all panels`
    );
    setPanels((prev) => prev.map((p) => ({ ...p, filter_preset: bulkPreset })));
    addNotification?.(
      `Applied '${bulkPreset}' style filter to all panels!`,
      "success"
    );
  };

  return {
    showBulkOps,
    setShowBulkOps,
    bulkDuration,
    setBulkDuration,
    bulkMotion,
    setBulkMotion,
    bulkPreset,
    setBulkPreset,
    handleBulkSetDuration,
    handleBulkSetMotion,
    handleBulkSetPreset,
  };
}
