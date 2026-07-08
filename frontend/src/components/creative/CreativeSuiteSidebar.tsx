import React, { useEffect } from "react";
import {
  Sparkles,
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
  X,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode";

interface CreativeSuiteSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  panels?: any[];
}

const CreativeSuiteSidebar: React.FC<CreativeSuiteSidebarProps> = ({
  currentPath,
  navigateTo,
  isOpen,
  onClose,
  panels = [],
}) => {
  const { themeMode } = useThemeMode();

  // Lock body scroll when sidebar drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const groups = [
    {
      name: "Hub",
      items: [
        {
          id: "dashboard",
          label: "Overview Hub",
          icon: LayoutGrid,
          path: "/creative-suite",
          requiresPanels: false,
        },
      ],
    },
    {
      name: "Visual Studio",
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
          icon: Sparkles,
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
      name: "Audio Production",
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
      name: "Context & Script",
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
      name: "Distribution",
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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-955 backdrop-blur-3xl border-r border-neutral-900 shadow-[8px_0_32px_rgba(0,0,0,0.45)]">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-900/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-purple-550 to-indigo-650 rounded-lg shadow-lg shadow-purple-650/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-black text-neutral-100 tracking-tight block leading-none text-sm font-mono">
              CREATIVE
            </span>
            <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest block mt-0.5 leading-none">
              Suite Workspace
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2.5">
            <h4 className="px-3 text-[9px] font-black text-purple-400/50 uppercase tracking-[0.25em] font-mono">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const isLocked = item.requiresPanels && panels.length === 0;

                return (
                  <li key={item.id} className="relative">
                    {/* Premium Active Side Indicator */}
                    <div
                      className={`absolute left-2 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-purple-500/10 text-neutral-100 shadow-[inset_0_0_16px_rgba(168,85,247,0.08)] border border-purple-500/20"
                          : isLocked
                          ? "text-neutral-600 hover:text-neutral-450 border border-transparent"
                          : "text-neutral-500 hover:text-neutral-250 hover:bg-neutral-900 border border-transparent"
                      }`}
                      title={isLocked ? "Requires timeline panels to unlock" : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                            active
                              ? "text-purple-400"
                              : isLocked
                              ? "text-neutral-700"
                              : "text-neutral-500 group-hover:scale-110 group-hover:text-neutral-400"
                          }`}
                        />
                        <span className="text-xs font-bold tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      
                      {isLocked && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-neutral-900 text-neutral-600 scale-90">
                          🔒 LCK
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Return to App */}
      <div className="p-5 border-t border-neutral-900">
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black tracking-widest transition-all shadow-[0_4px_14px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] active:scale-95 border border-purple-400/30 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>MAIN DASHBOARD</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-[280px] sm:w-[300px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default CreativeSuiteSidebar;
