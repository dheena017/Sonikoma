import React from "react";

export interface AdminUsersBulkBarProps {
  selectedCount: number;
  onAction: (action: "lock" | "unlock" | "delete") => void;
}

export const AdminUsersBulkBar: React.FC<AdminUsersBulkBarProps> = ({
  selectedCount,
  onAction,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#181818] border border-[#3B82F6]/40 px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl animate-fade-in">
      <span className="text-sm font-bold text-white">
        {selectedCount} Selected
      </span>
      <div className="w-px h-4 bg-neutral-700" />
      <button
        onClick={() => onAction("lock")}
        className="text-xs text-rose-400 hover:underline cursor-pointer"
      >
        Lock All
      </button>
      <button
        onClick={() => onAction("unlock")}
        className="text-xs text-emerald-400 hover:underline cursor-pointer"
      >
        Unlock All
      </button>
      <button
        onClick={() => onAction("delete")}
        className="text-xs text-rose-500 hover:underline cursor-pointer font-bold"
      >
        Delete All
      </button>
    </div>
  );
};

export default AdminUsersBulkBar;
