import React from "react";
import { Cpu } from "lucide-react";
import ProcessBar from "./ProcessBar.js";

interface PipelineStatusCardProps {
  progressStatus: string;
}

const PipelineStatusCard = React.memo(({
  progressStatus,
}: PipelineStatusCardProps) => {
  return (
    <div
      id="pipeline_status_card"
      className="bg-neutral-900/80 border border-neutral-800/70 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl backdrop-blur-md transition-all duration-300 min-w-0 w-full overflow-hidden"
    >
      {/* Header telemetry info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-purple-950/40 border border-purple-800/30 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-purple-400 animate-spin" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-white font-sans tracking-tight">
            Cinematic Render Pipeline Active
          </span>
        </div>
        <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-900/30">
          LIVE TELEMETRY
        </span>
      </div>

      {/* Console log status snippet */}
      <div className="bg-neutral-950/90 px-4 py-3 rounded-2xl border border-neutral-850 text-[11px] font-mono text-neutral-300 flex items-center gap-2">
        <span className="text-purple-400 font-bold shrink-0">&gt;&gt;</span>
        <span className="truncate">{progressStatus}</span>
      </div>

      {/* Stepper Progress Bar */}
      <ProcessBar progressStatus={progressStatus} />
    </div>
  );
});

export default PipelineStatusCard;
