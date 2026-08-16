import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";
import { WorkspaceId } from "../types/workspace.types";
import { getGroupedWorkspaces, WorkspaceConfig } from "../registry/workspaceRegistry";

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
    <div className="relative group w-full flex justify-center py-1">
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
        aria-label={item.title}
        className="inline-flex p-1.5 transition-all duration-300 cursor-pointer relative items-center justify-center group-active:scale-95 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      >
        <div
          className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center transition-all duration-300 shadow-sm ${
            isActive
              ? "bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-indigo-600/20 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]"
              : "bg-neutral-900/90 border border-neutral-800/80 hover:bg-purple-500/15 hover:border-purple-500/30 hover:shadow-[0_0_14px_rgba(168,85,247,0.18)]"
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-all duration-300 ${
              isActive ? "text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.9)]" : "text-neutral-400 group-hover:text-purple-200"
            }`}
          />
        </div>
      </button>

      <TooltipPortal text={item.title} visible={hover} anchorRect={rect} />
    </div>
  );
};

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
    <aside className="w-16 sm:w-20 shrink-0 bg-[#06060c]/80 border-r border-white/10 backdrop-blur-3xl shadow-[4px_0_34px_rgba(0,0,0,0.45)] flex flex-col items-center py-3.5 z-30 select-none h-full overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1.5 mini-sidebar-scrollbar pt-3 px-0.5">
        {groupedWorkspaces.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center pb-1.5">
            <div
              className="w-full flex flex-col items-center"
              style={{ marginTop: groupIdx > 0 ? "0.375rem" : "0", marginBottom: "0.25rem" }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent rounded-full mb-1" />
              )}
              <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-purple-300 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-1 py-0.5 bg-purple-950/30 border border-purple-500/20 rounded-full">
                {group.name}
              </span>
            </div>

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

      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-purple-900/20">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => onBackToApp?.()}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Return to Storyboard"
            className="inline-flex p-2.5 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-700 hover:from-purple-400 hover:to-indigo-600 text-white transition-all shadow-[0_4px_16px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_22px_rgba(168,85,247,0.6)] active:scale-95 border border-purple-400/30 cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </button>
          <TooltipPortal text="Return to Storyboard" visible={returnHover} anchorRect={returnRect} />
        </div>
      </div>
    </aside>
  );
};
