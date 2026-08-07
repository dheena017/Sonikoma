import React, { useState } from "react";
import {
  Image,
  Users,
  BookOpen,
  Shapes,
  Type,
  Music,
  Wand2,
  LayoutTemplate,
  Package,
  ShoppingBag,
  AppWindow,
  ArrowLeft,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

// ─── Types ────────────────────────────────────────────────────────────────────
export type WorkspaceId =
  | "media"
  | "characters"
  | "story"
  | "elements"
  | "text"
  | "audio"
  | "ai"
  | "templates"
  | "resources"
  | "marketplace"
  | "apps";

interface NavItem {
  id: WorkspaceId;
  label: string;
  Icon: React.ElementType;
}

// ─── Navigation Groups: PRIMARY → SECONDARY → UTILITY ─────────────────────────
const NAV_GROUPS: { name: string; items: NavItem[] }[] = [
  {
    name: "Primary",
    items: [
      { id: "story",      label: "Story",      Icon: BookOpen },
      { id: "media",      label: "Media",      Icon: Image },
      { id: "characters", label: "Characters", Icon: Users },
      { id: "ai",         label: "AI Studio",  Icon: Wand2 },
      { id: "text",       label: "Text",       Icon: Type },
    ],
  },
  {
    name: "Secondary",
    items: [
      { id: "elements",   label: "Elements",   Icon: Shapes },
      { id: "audio",      label: "Audio",      Icon: Music },
      { id: "templates",  label: "Templates",  Icon: LayoutTemplate },
      { id: "resources",  label: "Resources",  Icon: Package },
    ],
  },
  {
    name: "Utility",
    items: [
      { id: "marketplace", label: "Marketplace", Icon: ShoppingBag },
      { id: "apps",        label: "Apps",        Icon: AppWindow },
    ],
  },
];

// ─── Single Nav Item ──────────────────────────────────────────────────────────
const SidebarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onSelect: (id: WorkspaceId) => void;
}> = ({ item, isActive, onSelect }) => {
  const [hover, setHover] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const { Icon } = item;

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setRect(e.currentTarget.getBoundingClientRect());
    setHover(true);
  };

  return (
    <div className="relative group w-full flex justify-center py-0.5">
      {/* Active Pill Indicator */}
      <div
        className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
          isActive
            ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100"
            : "h-0 bg-transparent opacity-0"
        }`}
      />

      <button
        onClick={() => onSelect(item.id)}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setHover(false)}
        className="p-1 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
      >
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
            isActive
              ? "bg-purple-500/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
              : "bg-neutral-900 border border-neutral-800 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
          }`}
        >
          <Icon
            className={`w-4 h-4 transition-colors duration-300 ${
              isActive ? "text-purple-400" : "text-neutral-400 group-hover:text-purple-300"
            }`}
          />
        </div>
      </button>

      <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
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

  return (
    <aside className="w-16 sm:w-20 shrink-0 bg-neutral-950/90 backdrop-blur-xl border-r border-neutral-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.3)] flex flex-col items-center py-2.5 z-30 select-none h-full overflow-hidden">
      {/* Scrollable Nav */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 mini-sidebar-scrollbar pt-1">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center pb-1.5">
            {/* Group Label + Divider */}
            <div
              className="w-full flex flex-col items-center"
              style={{ marginTop: groupIdx > 0 ? "0.375rem" : "0", marginBottom: "0.25rem" }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1" />
              )}
              <span className="text-[8px] font-black uppercase tracking-[0.14em] text-neutral-400 font-mono select-none text-center w-full truncate whitespace-nowrap overflow-hidden px-0.5">
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
      <div className="mt-auto pt-2 flex justify-center w-full pb-1 border-t border-neutral-800/60">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => onBackToApp?.()}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            className="p-2.5 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </button>
          <TooltipPortal text="Return to Storyboard" visible={returnHover} anchorRect={returnRect} />
        </div>
      </div>
    </aside>
  );
};
