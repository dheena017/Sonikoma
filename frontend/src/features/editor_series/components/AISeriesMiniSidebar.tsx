import React, { useState } from "react";
import {
  Layers,
  Zap,
  BookOpen,
  LayoutGrid,
  Tv,
  Users,
  Globe,
  Compass,
  Sparkles,
  Mic,
  Activity,
  Film,
  Share2,
  Menu,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

interface AISeriesMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  activeSeriesId?: string | null;
  onOpenSidebar?: () => void;
}

const AISeriesMiniSidebarInner: React.FC<AISeriesMiniSidebarProps> = ({
  currentPath,
  navigateTo,
  activeSeriesId = null,
  onOpenSidebar,
}) => {
  // Retrieve persistent series ID if not passed directly
  const resolvedSeriesId =
    activeSeriesId ||
    (() => {
      const match =
        currentPath.match(/\/series\/([^\/]+)/) ||
        currentPath.match(/\/studio\/[^\/]+\/([^\/]+)/) ||
        currentPath.match(/\/watch\/([^\/]+)/) ||
        currentPath.match(/\/read\/([^\/]+)/);
      if (match) return match[1];
      return localStorage.getItem("sonikoma_last_series_id") || "demo";
    })();

  const groups = [
    {
      name: "Hub",
      items: [
        {
          id: "hub",
          label: "AI Series Hub",
          icon: Layers,
          path: "/ai-series",
        },
        {
          id: "generator",
          label: "Series Creator Cockpit",
          icon: Zap,
          path: "/series-generator",
        },
      ],
    },
    {
      name: "Studios",
      items: [
        {
          id: "manhwa",
          label: "Manhwa Webtoon Studio",
          icon: BookOpen,
          path: `/studio/manhwa/${resolvedSeriesId}`,
        },
        {
          id: "comic",
          label: "Comic & Manga Studio",
          icon: LayoutGrid,
          path: `/studio/comic/${resolvedSeriesId}`,
        },
        {
          id: "anime",
          label: "Anime Cinema Studio",
          icon: Tv,
          path: `/studio/anime/${resolvedSeriesId}`,
        },
      ],
    },
    {
      name: "World & Cast",
      items: [
        {
          id: "cast",
          label: "Character DNA Vault",
          icon: Users,
          path: `/series/${resolvedSeriesId}/cast`,
        },
        {
          id: "world",
          label: "World & Lore Bible",
          icon: Globe,
          path: `/series/${resolvedSeriesId}/world`,
        },
        {
          id: "timeline",
          label: "Series Arc Director",
          icon: Compass,
          path: `/series/${resolvedSeriesId}/timeline`,
        },
      ],
    },
    {
      name: "Production",
      items: [
        {
          id: "vfx",
          label: "VFX Choreographer",
          icon: Sparkles,
          path: `/series/${resolvedSeriesId}/vfx`,
        },
        {
          id: "dubbing",
          label: "Audio Dub Stage",
          icon: Mic,
          path: `/series/${resolvedSeriesId}/dubbing`,
        },
        {
          id: "monitor",
          label: "Series Live Monitor",
          icon: Activity,
          path: `/series/${resolvedSeriesId}/monitor`,
        },
      ],
    },
    {
      name: "Publishing",
      items: [
        {
          id: "theater",
          label: "Reader Theater",
          icon: Film,
          path: `/watch/${resolvedSeriesId}`,
        },
        {
          id: "export",
          label: "Export Master",
          icon: Share2,
          path: `/series/${resolvedSeriesId}/export`,
        },
      ],
    },
  ];

  const isActive = (item: any) => {
    if (item.id === "hub") {
      return currentPath === "/ai-series" || currentPath === "/ai-series/";
    }
    if (item.id === "generator") {
      return (
        currentPath === "/series-generator" ||
        currentPath === "/series-generator/"
      );
    }
    if (item.id === "manhwa") {
      return currentPath.startsWith("/studio/manhwa");
    }
    if (item.id === "comic") {
      return currentPath.startsWith("/studio/comic");
    }
    if (item.id === "anime") {
      return currentPath.startsWith("/studio/anime");
    }
    if (item.id === "cast") {
      return currentPath.includes("/cast");
    }
    if (item.id === "world") {
      return currentPath.includes("/world");
    }
    if (item.id === "timeline") {
      return currentPath.includes("/timeline");
    }
    if (item.id === "vfx") {
      return currentPath.includes("/vfx");
    }
    if (item.id === "dubbing") {
      return currentPath.includes("/dubbing");
    }
    if (item.id === "monitor") {
      return currentPath.includes("/monitor");
    }
    if (item.id === "theater") {
      return (
        currentPath.startsWith("/watch") || currentPath.startsWith("/read")
      );
    }
    if (item.id === "export") {
      return currentPath.includes("/export");
    }
    return currentPath === item.path;
  };

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = isActive(item);
    const Icon = item.icon;

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      setRect(e.currentTarget.getBoundingClientRect());
      setHover(true);
    };

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Left edge active indicator bar matching Creative Suite */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            active
              ? "h-5 bg-violet-500 opacity-100 shadow-[0_0_8px_rgba(139,92,246,0.8)]"
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
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-violet-600 border border-violet-400/50 text-white shadow-violet-900/50"
                : "bg-transparent border border-transparent text-neutral-400 group-hover:bg-[#1E1E1E] group-hover:border-neutral-700 group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[17px] h-[17px] transition-colors duration-200 ${
                active
                  ? "text-white"
                  : "text-neutral-400 group-hover:text-violet-400"
              }`}
            />
          </div>
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-neutral-950/85 backdrop-blur-2xl border-r border-white/10 hidden lg:flex flex-col items-center py-3 z-40 shadow-[8px_0_32px_rgba(0,0,0,0.6)] select-none overflow-hidden">
      {/* Navigation Groups */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-0.5"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.5rem" : "0.15rem",
                marginBottom: "0.3rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-5 h-[1px] bg-neutral-800/80 rounded-full mb-1" />
              )}
              <span className="text-[8px] font-sans font-black uppercase tracking-[0.16em] text-neutral-400 select-none text-center w-full px-1">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Return to Main Dashboard Button */}
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
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-lg shadow-blue-500/25 active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center group"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0 text-white" />
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

export const AISeriesMiniSidebar = React.memo(AISeriesMiniSidebarInner);
export default AISeriesMiniSidebar;
