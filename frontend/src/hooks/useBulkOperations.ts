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
    setPanels((prev) => prev.map((p) => ({ ...p, duration: bulkDuration })));
    addNotification?.(
      `Applied ${bulkDuration}s duration to all panels!`,
      "success"
    );
  };

  const handleBulkSetMotion = () => {
    setPanels((prev) => prev.map((p) => ({ ...p, motion_type: bulkMotion })));
    addNotification?.(
      `Applied '${bulkMotion}' motion to all panels!`,
      "success"
    );
  };

  const handleBulkSetPreset = () => {
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
