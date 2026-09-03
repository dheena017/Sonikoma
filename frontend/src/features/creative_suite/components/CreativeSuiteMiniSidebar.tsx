import React, { useState } from "react";
import {
  Menu,
  LayoutGrid,
  Film,
  Globe,
  Mic,
  Youtube,
  ExternalLink,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

interface CreativeSuiteMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  panels?: any[];
  onOpenSidebar?: () => void;
}

const CreativeSuiteMiniSidebarInner: React.FC<
  CreativeSuiteMiniSidebarProps
> = ({ currentPath, navigateTo, panels = [], onOpenSidebar }) => {
  const groups = [
    {
      name: "Hub",
      items: [
        {
          id: "dashboard",
          label: "Creative Hub",
          icon: LayoutGrid,
          path: "/creative-suite",
          requiresPanels: false,
        },
      ],
    },
    {
      name: "Visuals",
      items: [
        {
          id: "optimizer",
          label: "Video Optimizer",
          icon: Film,
          path: "/creative-suite/ai-optimizer",
          requiresPanels: true,
        },
        {
          id: "assistant",
          label: "Translation Studio",
          icon: Globe,
          path: "/creative-suite/panel-assistant",
          requiresPanels: true,
        },
      ],
    },
    {
      name: "Audio",
      items: [
        {
          id: "voice",
          label: "Voice & Sound Studio",
          icon: Mic,
          path: "/creative-suite/ai-voice",
          requiresPanels: true,
        },
      ],
    },
    {
      name: "Distribution",
      items: [
        {
          id: "youtube",
          label: "YouTube Publisher",
          icon: Youtube,
          path: "/creative-suite/youtube",
          requiresPanels: false,
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/creative-suite") {
      return (
        currentPath === "/creative-suite" ||
        currentPath === "/creative-suite/" ||
        currentPath === "/creative-suite-dashboard"
      );
    }
    return (
      currentPath === path ||
      currentPath.startsWith(path + "?") ||
      currentPath.startsWith(path + "/")
    );
  };

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = isActive(item.path);
    const isLocked = false;
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
            active
              ? "h-5 bg-[#3B82F6]  opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          aria-label={item.label}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105"
                : isLocked
                ? "bg-[#121212] border border-[#2F2F2F] opacity-40 cursor-not-allowed"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-[#3B82F6] group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                active
                  ? "text-white"
                  : isLocked
                  ? "text-neutral-700"
                  : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
              }`}
            />
          </div>
        </button>
        <TooltipPortal
          text={`${item.label}${isLocked ? " 🔒 (Locked)" : ""}`}
          visible={hover}
          anchorRect={rect}
        />
      </div>
    );
  };

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);
  const [menuHover, setMenuHover] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-neutral-950/85 backdrop-blur-2xl border-r border-white/10 hidden lg:flex flex-col items-center py-3 z-40 shadow-[8px_0_32px_rgba(0,0,0,0.6)] select-none overflow-hidden">
      {/* Navigation Groups */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + label */}
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
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-[0.16em] text-neutral-400 select-none text-center w-full px-1">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to App Dashboard */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-white/10 shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Main Dashboard"
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all  hover: active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>
          <TooltipPortal
            text="Main Dashboard"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      </div>
    </aside>
  );
};

const CreativeSuiteMiniSidebar = React.memo(CreativeSuiteMiniSidebarInner);
export default CreativeSuiteMiniSidebar;
