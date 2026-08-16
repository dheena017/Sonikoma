// ─── RepoRefChip ─────────────────────────────────────────────────────────────
// Canonical location: timeline/components/RepoRefChip.tsx

import React from "react";
import { GitCommit, Database } from "lucide-react";

interface RepoRefChipProps {
  gitHash?: string;
  cacheAge?: string;
}

const RepoRefChip: React.FC<RepoRefChipProps> = ({
  gitHash = "main@a3f9c1",
  cacheAge = "3m ago",
}) => (
  <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
    <span
      className="flex items-center gap-1 text-purple-300/80"
      title="Active Git Commit"
    >
      <GitCommit className="h-2.5 w-2.5" />
      <span>{gitHash}</span>
    </span>
    <span className="text-neutral-700">•</span>
    <span
      className="flex items-center gap-1 text-neutral-400"
      title="Asset Cache Age"
    >
      <Database className="h-2.5 w-2.5" />
      <span>Cache {cacheAge}</span>
    </span>
  </div>
);

export default React.memo(RepoRefChip);
