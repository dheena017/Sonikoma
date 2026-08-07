// ─── AddMediaButton ──────────────────────────────────────────────────────────
// Canonical location: timeline/components/AddMediaButton.tsx

import React from "react";
import { Plus } from "lucide-react";

interface AddMediaButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

const AddMediaButton: React.FC<AddMediaButtonProps> = ({
  onClick,
  label = "Add Media / Blank",
  className = "",
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`group relative flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 border border-white/15 hover:bg-purple-600 hover:border-purple-400 text-neutral-300 hover:text-white transition-all shadow-md cursor-pointer ${className}`}
  >
    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
    {/* Tooltip */}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-black/90 text-white text-[9px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10">
      {label}
    </span>
  </button>
);

export default React.memo(AddMediaButton);
