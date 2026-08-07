import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";
import { WorkspaceId } from "../types/workspace.types";
import { getGroupedWorkspaces, WorkspaceConfig } from "../registry/workspaceRegistry";

// ─── Single Nav Item ──────────────────────────────────────────────────────────
const SidebarItem: React.FC<{
  item: WorkspaceConfig;
  isActive: boolean;
  onSelect: (id: WorkspaceId) => void;
}> = ({ item, isActive, onSelect }) => {
  const [hover, setHover] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const Icon = item.icon;

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setRect(e.currentTarget.getBoundingClientRect());
    setHover(true);
  };

  return (
    <div className="relative group w-full flex justify-center py-0.5">
      {/* Active Glowing Pill Indicator */}
      <div
        className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
          isActive
            ? "h-6 bg-gradient-to-b from-purple-400 to-fuchsia-400 shadow-[0_0_14px_rgba(192,132,252,0.9)] opacity-100"
            : "h-0 bg-transparent opacity-0"
        }`}
      />

      <button
        onClick={() => onSelect(item.id)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
        className="p-1 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95 hover:scale-105"
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
            isActive
              ? "bg-gradient-to-br from-purple-500/25 via-purple-600/20 to-indigo-600/20 border border-purple-500/50 shadow-[0_0_16px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]"
              : "bg-neutral-900/90 border border-neutral-800/80 group-hover:bg-purple-500/15 group-hover:border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]"
          }`}
        >
          <Icon
            className={`w-4 h-4 transition-all duration-300 ${
              isActive ? "text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]" : "text-neutral-400 group-hover:text-purple-200"
            }`}
          />
        </div>
      </button>

      <TooltipPortal text={item.title} visible={hover} anchorRect={rect} />
    </div>
  );
};

// ─── Mini Sidebar ─────────────────────────────────────────────────────────────
interface MiniSidebarProps {
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (id: WorkspaceId) => void;
  onBackToApp?: () => void;
}

export const MiniSidebar: React.FC<MiniSidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  onBackToApp,
}) => {
  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);

  const groupedWorkspaces = getGroupedWorkspaces();

  return (
    <aside className="w-16 sm:w-20 shrink-0 bg-gradient-to-b from-neutral-950/95 via-[#0c0a1a]/95 to-neutral-950/95 backdrop-blur-2xl border-r border-purple-900/20 shadow-[4px_0_24px_rgba(0,0,0,0.4)] flex flex-col items-center py-2.5 z-30 select-none h-full overflow-hidden">
      {/* Scrollable Nav */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 mini-sidebar-scrollbar pt-1">
        {groupedWorkspaces.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center pb-1.5">
            {/* Group Label + Divider */}
            <div
              className="w-full flex flex-col items-center"
              style={{ marginTop: groupIdx > 0 ? "0.375rem" : "0", marginBottom: "0.25rem" }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent rounded-full mb-1" />
              )}
              <span className="text-[7.5px] font-black uppercase tracking-[0.16em] text-neutral-400 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-0.5">
                {group.name}
              </span>
            </div>

            {/* Items */}
            {group.items.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={activeWorkspace === item.id}
                onSelect={onSelectWorkspace}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-auto pt-2 flex justify-center w-full pb-1 border-t border-purple-900/20">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => onBackToApp?.()}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            className="p-2.5 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-700 hover:from-purple-400 hover:to-indigo-600 text-white transition-all shadow-[0_4px_16px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_22px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </button>
          <TooltipPortal text="Return to Storyboard" visible={returnHover} anchorRect={returnRect} />
        </div>
      </div>
    </aside>
  );
};
