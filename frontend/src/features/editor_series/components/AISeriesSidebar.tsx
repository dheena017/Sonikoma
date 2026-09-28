import React from "react";
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
  X,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

interface AISeriesSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeSeriesId?: string | null;
}

export const AISeriesSidebar: React.FC<AISeriesSidebarProps> = ({
  currentPath,
  navigateTo,
  isOpen,
  onClose,
  activeSeriesId = null,
}) => {
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
      title: "Series Hub & Creation",
      items: [
        {
          id: "hub",
          label: "AI Series Hub",
          desc: "Manage franchises, view generation queue & library",
          icon: Layers,
          path: "/ai-series",
          badge: "Library",
        },
        {
          id: "generator",
          label: "Franchise Creator Cockpit",
          desc: "Architect new multi-season universe with Turbo Chapter 1",
          icon: Zap,
          path: "/series-generator",
          badge: "Synthesize",
        },
      ],
    },
    {
      title: "Visual Studios",
      items: [
        {
          id: "manhwa",
          label: "Manhwa Webtoon Studio",
          desc: "Vertical strip infinite scroll panel arrangement",
          icon: BookOpen,
          path: `/studio/manhwa/${resolvedSeriesId}`,
          badge: "Webtoon",
        },
        {
          id: "comic",
          label: "Comic & Manga Studio",
          desc: "Paginated multi-panel spreads & screentones",
          icon: LayoutGrid,
          path: `/studio/comic/${resolvedSeriesId}`,
          badge: "Print Grid",
        },
        {
          id: "anime",
          label: "Anime Cinema Studio",
          desc: "24fps kinetic sakuga motion & camera sweeps",
          icon: Tv,
          path: `/studio/anime/${resolvedSeriesId}`,
          badge: "Cinematic",
        },
      ],
    },
    {
      title: "World & Cast Vault",
      items: [
        {
          id: "cast",
          label: "Character DNA Vault",
          desc: "Facial consistency, scar registry & costume palette",
          icon: Users,
          path: `/series/${resolvedSeriesId}/cast`,
          badge: "DNA Lock",
        },
        {
          id: "world",
          label: "World & Lore Bible",
          desc: "Factions, timeline laws & continuity rules",
          icon: Globe,
          path: `/series/${resolvedSeriesId}/world`,
          badge: "Continuity",
        },
        {
          id: "timeline",
          label: "Series Arc Director",
          desc: "Multi-season pacing roadmap & 0-cliffhanger epilogue",
          icon: Compass,
          path: `/series/${resolvedSeriesId}/timeline`,
          badge: "Epilogue",
        },
      ],
    },
    {
      title: "Production Stages",
      items: [
        {
          id: "vfx",
          label: "VFX Choreographer",
          desc: "Combat particles, kinetic impact frames & aura",
          icon: Sparkles,
          path: `/series/${resolvedSeriesId}/vfx`,
          badge: "Sakuga",
        },
        {
          id: "dubbing",
          label: "Audio Dub Stage",
          desc: "Neural character voice acting & BGM audio track",
          icon: Mic,
          path: `/series/${resolvedSeriesId}/dubbing`,
          badge: "Voice",
        },
        {
          id: "monitor",
          label: "Series Live Monitor",
          desc: "Real-time task synthesis telemetry & RLHF logs",
          icon: Activity,
          path: `/series/${resolvedSeriesId}/monitor`,
          badge: "Telemetry",
        },
      ],
    },
    {
      title: "Publishing & Distribution",
      items: [
        {
          id: "theater",
          label: "Reader Theater",
          desc: "Immersive multi-mode reader with interactive speech audio",
          icon: Film,
          path: `/watch/${resolvedSeriesId}`,
          badge: "Theater",
        },
        {
          id: "export",
          label: "Export Master",
          desc: "Publish to Webtoon, PDF, CBR/CBZ, or 4K Video bundle",
          icon: Share2,
          path: `/series/${resolvedSeriesId}/export`,
          badge: "Publish",
        },
      ],
    },
  ];

  const isItemActive = (path: string, id: string) => {
    if (id === "hub") return currentPath === "/ai-series" || currentPath === "/ai-series/";
    if (id === "generator") return currentPath === "/series-generator" || currentPath === "/series-generator/";
    if (id === "manhwa") return currentPath.startsWith("/studio/manhwa");
    if (id === "comic") return currentPath.startsWith("/studio/comic");
    if (id === "anime") return currentPath.startsWith("/studio/anime");
    if (id === "cast") return currentPath.includes("/cast");
    if (id === "world") return currentPath.includes("/world");
    if (id === "timeline") return currentPath.includes("/timeline");
    if (id === "vfx") return currentPath.includes("/vfx");
    if (id === "dubbing") return currentPath.includes("/dubbing");
    if (id === "monitor") return currentPath.includes("/monitor");
    if (id === "theater") return currentPath.startsWith("/watch") || currentPath.startsWith("/read");
    if (id === "export") return currentPath.includes("/export");
    return currentPath === path;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed top-0 bottom-0 left-0 w-80 sm:w-96 bg-[#0B0C0E] border-r border-slate-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#121316]">
          <SonikomaLogo
            size="sm"
            badge="AI Series"
            onClick={() => {
              onClose();
              navigateTo("/ai-series");
            }}
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto custom-purple-scrollbar p-4 space-y-6">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 font-mono">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path, item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onClose();
                        navigateTo(item.path);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer group ${
                        active
                          ? "bg-violet-950/40 border border-violet-500/60 shadow-md shadow-violet-950/40 text-white"
                          : "hover:bg-[#18191E] border border-transparent text-slate-300 hover:text-white"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          active
                            ? "bg-violet-600 text-white"
                            : "bg-[#18191E] text-slate-400 group-hover:text-violet-400 group-hover:bg-[#202229]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">
                            {item.label}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-violet-300">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Return Button */}
        <div className="p-4 border-t border-slate-800 bg-[#121316] shrink-0">
          <button
            onClick={() => {
              onClose();
              navigateTo("/dashboard");
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Main Dashboard</span>
          </button>
          <div className="text-[9px] text-center text-slate-500 font-mono mt-2 uppercase tracking-wider">
            Sonikoma AI Generated Series Studio
          </div>
        </div>
      </aside>
    </>
  );
};

export default AISeriesSidebar;
