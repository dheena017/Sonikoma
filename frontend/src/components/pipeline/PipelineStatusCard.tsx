import React from "react";
import { Cpu } from "lucide-react";

interface PipelineStatusCardProps {
  progressStatus: string;
}

export default function PipelineStatusCard({
  progressStatus,
}: PipelineStatusCardProps) {
  return (
    <div
      id="pipeline_status_card"
      className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-5 animate-pulse"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-purple-400 animate-spin" />
          <span className="font-bold text-sm text-white">
            Pipeline executing asynchronously
          </span>
        </div>
        <span className="text-xs font-mono text-purple-400 font-semibold">
          Live status
        </span>
      </div>

      <div className="bg-neutral-950/80 px-4 py-3 rounded-xl border border-neutral-800/80 text-xs font-mono text-neutral-200">
        <span className="text-purple-400 font-bold">&gt;&gt;</span>{" "}
        {progressStatus}
      </div>

      {/* Progress animation track */}
      <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 h-full w-2/3 rounded-full animate-infinite-scroll" />
      </div>
    </div>
  );
}
