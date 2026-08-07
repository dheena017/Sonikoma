// ─── SyncStatusBadge ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/SyncStatusBadge.tsx

import React from "react";
import { Check, RefreshCw, AlertTriangle, Circle } from "lucide-react";

export type SyncStatus = "synced" | "syncing" | "dirty" | "error";

interface SyncStatusBadgeProps {
  status?: SyncStatus;
  showText?: boolean;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status = "synced", showText = false }) => {
  switch (status) {
    case "synced":
      return (
        <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-mono" title="Synced with repo & cache">
          <Check className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
          {showText && <span>Synced</span>}
        </span>
      );
    case "syncing":
      return (
        <span className="flex items-center gap-1 text-amber-300 text-[9px] font-mono" title="Syncing asset to cache...">
          <RefreshCw className="h-2.5 w-2.5 shrink-0 text-amber-300 animate-spin" />
          {showText && <span>Syncing</span>}
        </span>
      );
    case "dirty":
      return (
        <span className="flex items-center gap-1 text-amber-400 text-[9px] font-mono" title="Unsaved changes (local draft)">
          <Circle className="h-2 w-2 shrink-0 fill-amber-400 text-amber-400" />
          {showText && <span>Unsaved</span>}
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 text-red-400 text-[9px] font-mono" title="Sync error">
          <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-red-400" />
          {showText && <span>Error</span>}
        </span>
      );
  }
};

export default React.memo(SyncStatusBadge);
