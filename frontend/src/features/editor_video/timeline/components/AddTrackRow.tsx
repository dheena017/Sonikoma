// ─── AddTrackRow ──────────────────────────────────────────────────────────────
// Canonical location: timeline/components/AddTrackRow.tsx

import React from "react";
import AddMediaButton from "./AddMediaButton";

interface AddTrackRowProps {
  onOpenMediaPicker?: () => void;
}

const AddTrackRow: React.FC<AddTrackRowProps> = ({ onOpenMediaPicker }) => (
  <div className="h-10 flex items-center border-b border-white/[0.03] group hover:bg-white/[0.02] transition-colors">
    <div className="w-44 shrink-0 sticky left-0 z-20 border-r border-white/10 bg-[#0d0d16] h-full flex items-center justify-center px-3 shadow-[3px_0_12px_rgba(0,0,0,0.6)]">
      <AddMediaButton
        onClick={onOpenMediaPicker || (() => {})}
        label="Add new track / media"
      />
    </div>
    <div className="flex-1 flex items-center px-3">
      <span className="text-[11px] text-neutral-600 group-hover:text-neutral-500 transition-colors select-none">
        or drag and drop media files directly onto timeline
      </span>
    </div>
    <div className="w-32 shrink-0 sticky right-0 z-20 border-l border-white/10 bg-[#0d0d16] h-full flex items-center justify-center shadow-[-3px_0_12px_rgba(0,0,0,0.6)]" />
  </div>
);

export default React.memo(AddTrackRow);
