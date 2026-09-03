// ─── AddTrackRow ──────────────────────────────────────────────────────────────
// Canonical location: timeline/components/AddTrackRow.tsx

import React from "react";
import AddMediaButton from "./AddMediaButton";

interface AddTrackRowProps {
  onOpenMediaPicker?: () => void;
}

const AddTrackRow: React.FC<AddTrackRowProps> = ({ onOpenMediaPicker }) => (
  <div className="h-10 flex items-center border-b border-white/10 bg-[#18181B] group hover:bg-white/[0.02] transition-colors">
    <div className="w-48 shrink-0 sticky left-0 z-30 border-r border-[#2F2F2F] bg-[#1E1E1E] h-full flex items-center justify-center px-3 shadow-[4px_0_16px_rgba(0,0,0,0.85)]">
      <AddMediaButton
        onClick={onOpenMediaPicker || (() => {})}
        label="Add new track / media"
      />
    </div>
    <div className="flex-1" />
    <div className="w-32 shrink-0 sticky right-0 z-20 border-l border-[#2F2F2F] bg-[#1E1E1E] h-full flex items-center justify-center shadow-[-3px_0_12px_rgba(0,0,0,0.6)]" />
  </div>
);

export default React.memo(AddTrackRow);
