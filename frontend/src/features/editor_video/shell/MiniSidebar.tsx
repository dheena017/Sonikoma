import React, { useState } from "react";
import { ArrowLeft, FolderOpen, LayoutDashboard } from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";
import { WorkspaceId } from "../types/workspace.types";
import {
  getGroupedWorkspaces,
  WorkspaceConfig,
} from "../registry/workspaceRegistry";

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
      {/* Left edge active indicator bar */}
      <div
        className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
          isActive
            ? "h-5 bg-[#3B82F6] opacity-100"
            : "h-0 bg-transparent opacity-0"
        }`}
      />

      <button
        onClick={() => onSelect(item.id)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
        aria-label={item.title}
        className="p-1 cursor-pointer transition-transform duration-200 active:scale-95 group"
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isActive
              ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105 shadow-[0_4px_14px_rgba(59,130,246,0.28)]"
              : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-[#3B82F6] group-hover:text-white"
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] transition-colors duration-200 ${
              isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
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
  navigateTo?: (path: string) => void;
}

export const MiniSidebar: React.FC<MiniSidebarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  onBackToApp,
  navigateTo,
}) => {
  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);

  const groupedWorkspaces = getGroupedWorkspaces();

  return (
    <aside className="hidden lg:flex w-20 h-full shrink-0 bg-[#121212]/95 backdrop-blur-2xl border-r border-white/10 flex-col items-center py-3 z-30 shadow-xl select-none overflow-hidden">
      {/* Workspace Groups List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groupedWorkspaces.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + monospace label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.6rem" : "0.2rem",
                marginBottom: "0.4rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
              )}
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
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

        <div className="w-full flex flex-col items-center pb-1">
          <div className="w-full flex flex-col items-center" style={{ marginTop: "0.6rem", marginBottom: "0.4rem" }}>
            <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
            <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
              Global
            </span>
          </div>
          {[
            { label: "Main Dashboard", icon: LayoutDashboard, path: "/dashboard" },
            { label: "Projects Gallery", icon: FolderOpen, path: "/projects" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.path} className="relative group w-full flex justify-center py-0.5">
                <button
                  onClick={() => navigateTo?.(item.path)}
                  aria-label={item.label}
                  title={item.label}
                  className="p-1 cursor-pointer transition-transform duration-200 active:scale-95 group"
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-[#3B82F6] group-hover:text-white">
                    <Icon className="w-[18px] h-[18px] transition-colors duration-200 text-[#9CA3AF] group-hover:text-[#3B82F6]" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Return Button */}
      {onBackToApp && (
        <div className="mt-auto pt-3 w-full flex justify-center border-t border-[#2F2F2F] shrink-0 pb-2">
          <button
            onClick={onBackToApp}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Return to Creative Suite"
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white border border-[#60A5FA]/40 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
          <TooltipPortal
            text="Return to Creative Suite"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      )}
    </aside>
  );
};
