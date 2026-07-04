import React from "react";
import { Info } from "lucide-react";

export function LogsPageHelpBanner() {
  return (
    <div className="bg-purple-950/20 border border-purple-500/20 rounded-3xl p-5 flex items-start gap-5 shadow-inner">
      <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 shadow-lg">
        <Info className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-purple-200 uppercase tracking-widest">
          Telemetry Orchestration Info
        </h4>
        <p className="text-xs text-purple-300/60 leading-relaxed font-mono">
          Live view displays high-frequency ephemeral events stored in server
          memory. Historical view queries the persistent SQL transaction log for
          deep forensic analysis. Logs are automatically pruned every 7 days or
          when exceeding 5,000 records. Snapshot metadata is captured
          automatically for all critical engine failures.
        </p>
      </div>
    </div>
  );
}
