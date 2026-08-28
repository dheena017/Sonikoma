import React, { useState } from "react";
import {
  LayoutGrid,
  Film,
  Scissors,
  Users,
  Globe,
  Music,
  MessageSquare,
  Mic,
  BarChart3,
  Youtube,
  ExternalLink,
  ArrowLeft,
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
      name: "Dist",
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

  // Helper custom icon wrapper for sparkles to match Lucide Sparkles icon
  function SparklesIcon(props: any) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
        <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
        <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
      </svg>
    );
  }

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
        {/* Active side indicator */}
        <div
          className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-200 z-10 ${
            active
              ? "h-5 bg-gradient-to-b from-purple-400 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          aria-label={item.label}
          className="p-1 transition-all duration-150 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-purple-600/20 border border-purple-500/50 shadow-[0_0_14px_rgba(168,85,247,0.25)] text-purple-200 scale-105"
                : isLocked
                ? "bg-neutral-950 border border-neutral-900 opacity-40 cursor-not-allowed"
                : "bg-neutral-900/90 border border-neutral-800 text-neutral-400 group-hover:bg-neutral-800/90 group-hover:border-neutral-700 group-hover:text-neutral-100 group-hover:shadow-md"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-150 ${
                active
                  ? "text-purple-300"
                  : isLocked
                  ? "text-neutral-700"
                  : "text-neutral-400 group-hover:text-neutral-200"
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

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-[#070709] border-r border-neutral-900 hidden lg:flex flex-col items-center py-3 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.3)] select-none overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider (only between groups) + label for every group */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.375rem" : "0",
                marginBottom: "0.25rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-px bg-neutral-700/60 rounded-full mb-1" />
              )}
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500 select-none text-center w-full px-1">
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
      <div className="mt-auto pt-3 flex justify-center w-full pb-1 border-t border-neutral-900">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            aria-label="Main Dashboard"
            className="w-11 h-11 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-purple-600/20 hover:border-purple-500/40 hover:text-purple-300 hover:shadow-[0_0_14px_rgba(168,85,247,0.25)] transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
};

const CreativeSuiteMiniSidebar = React.memo(CreativeSuiteMiniSidebarInner);
export default CreativeSuiteMiniSidebar;
