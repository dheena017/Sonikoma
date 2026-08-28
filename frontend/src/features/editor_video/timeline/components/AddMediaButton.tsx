// ─── AddMediaButton ──────────────────────────────────────────────────────────
// Canonical location: timeline/components/AddMediaButton.tsx

import React from "react";
import { Plus } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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
  <Tooltip text={label} placement="top">
    <button
      onClick={onClick}
      aria-label={label}
      className={`group relative flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 border border-white/15 hover:bg-purple-600 hover:border-purple-400 text-neutral-300 hover:text-white transition-all shadow-md cursor-pointer ${className}`}
    >
      <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
    </button>
  </Tooltip>
);

export default React.memo(AddMediaButton);
