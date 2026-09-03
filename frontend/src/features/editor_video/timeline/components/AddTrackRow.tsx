// ─── AddTrackRow ──────────────────────────────────────────────────────────────
// Canonical location: timeline/components/AddTrackRow.tsx

import React from "react";
import { Plus } from "lucide-react";

interface AddTrackRowProps {
  onOpenMediaPicker?: () => void;
}

const AddTrackRow: React.FC<AddTrackRowProps> = ({ onOpenMediaPicker }) => (
  <div className="h-9 flex items-center border-b border-[#2F2F2F] bg-[#121212]">
    <div className="w-56 shrink-0 h-full sticky left-0 z-40 flex items-center px-3 border-r border-[#2F2F2F] bg-[#121212] shadow-sm">
      <button
        type="button"
        onClick={onOpenMediaPicker || (() => {})}
        className="w-full h-6 rounded flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-[#3B82F6]/20 border border-white/10 hover:border-[#3B82F6]/40 transition-all cursor-pointer"
        title="Add Track / Media"
      >
        <Plus className="h-3 w-3 text-[#3B82F6]" />
        <span>Add Track</span>
      </button>
    </div>
    <div className="flex-1" />
  </div>
);

export default React.memo(AddTrackRow);
