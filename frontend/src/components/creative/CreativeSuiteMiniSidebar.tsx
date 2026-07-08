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
  ArrowLeft,
} from "lucide-react";
import TooltipPortal from "../TooltipPortal";

interface CreativeSuiteMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  panels?: any[];
  onOpenSidebar?: () => void;
}

const CreativeSuiteMiniSidebarInner: React.FC<CreativeSuiteMiniSidebarProps> = ({
  currentPath,
  navigateTo,
  panels = [],
  onOpenSidebar,
}) => {
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
          path: "/ai-optimizer",
          requiresPanels: true,
        },
        {
          id: "assistant",
          label: "Panel Assistant",
          icon: Scissors,
          path: "/panel-assistant",
          requiresPanels: true,
        },
        {
          id: "thumbnails",
          label: "Thumbnail Studio",
          icon: SparklesIcon,
          path: "/ai-thumbnails",
          requiresPanels: false,
        },
        {
          id: "analytics",
          label: "CTR Predictor",
          icon: BarChart3,
          path: "/ai-analytics",
          requiresPanels: false,
        },
      ],
    },
    {
      name: "Audio",
      items: [
        {
          id: "audio-lab",
          label: "Sound Design Lab",
          icon: Music,
          path: "/ai-audio-lab",
          requiresPanels: true,
        },
        {
          id: "voice",
          label: "Voice Studio",
          icon: Mic,
          path: "/ai-voice",
          requiresPanels: true,
        },
      ],
    },
    {
      name: "Script",
      items: [
        {
          id: "characters",
          label: "Character DB",
          icon: Users,
          path: "/ai-characters",
          requiresPanels: false,
        },
        {
          id: "translation",
          label: "Translation Studio",
          icon: Globe,
          path: "/ai-translation",
          requiresPanels: true,
        },
      ],
    },
    {
      name: "Dist",
      items: [
        {
          id: "engagement",
          label: "Community Coach",
          icon: MessageSquare,
          path: "/ai-engagement",
          requiresPanels: false,
        },
        {
          id: "youtube",
          label: "YouTube Publisher",
          icon: Youtube,
          path: "/youtube",
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
    return currentPath === path || currentPath.startsWith(path + "?") || currentPath.startsWith(path + "/");
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
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 ${
            active
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              active
                ? "bg-purple-550/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : isLocked
                ? "bg-neutral-950 border border-neutral-900 opacity-40 cursor-not-allowed"
                : "bg-neutral-900 border border-neutral-800 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                active
                  ? "text-purple-400"
                  : isLocked
                  ? "text-neutral-700"
                  : "text-neutral-450 group-hover:text-purple-300"
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
    <aside className="fixed top-[59px] bottom-0 left-0 w-20 bg-[#050507] border-r border-neutral-900 hidden lg:flex flex-col items-center py-4 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.3)] select-none">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-2"
          >
            {groupIdx > 0 && (
              <div className="w-1 h-1 rounded-full bg-purple-900/50 shadow-[0_0_4px_rgba(168,85,247,0.3)] my-2" />
            )}

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to App Dashboard */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-900">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white transition-all shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 border border-purple-400/30 cursor-pointer"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
          </button>
          
          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-medium tracking-wide">
            Main Dashboard
          </div>
        </div>
      </div>
    </aside>
  );
};

const CreativeSuiteMiniSidebar = React.memo(CreativeSuiteMiniSidebarInner);
export default CreativeSuiteMiniSidebar;
