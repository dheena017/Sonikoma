import React, { useEffect } from "react";
import {
  LayoutGrid,
  Film,
  Globe,
  Mic,
  Youtube,
  ArrowLeft,
  X,
  Zap,
  FolderOpen,
  FolderSync,
} from "lucide-react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";

const ActiveProjectSidebarWidget: React.FC<{
  setDrawerOpen: (open: boolean) => void;
}> = ({ setDrawerOpen }) => {
  const { activeProjectId, activeProjectData } = useProjectStore();
  const [imgError, setImgError] = React.useState(false);

  const coverUrl =
    activeProjectData?.project?.cover_image ||
    activeProjectData?.panels?.[0]?.image_url;

  React.useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  return (
    <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-xs shadow-sm my-2 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#3B82F6]" /> Active Project
        </span>
        {activeProjectId ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useProjectStore.getState().clearActiveProject();
              }}
              title="Close Active Project"
              aria-label="Close Active Project"
              className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      {activeProjectId && activeProjectData ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 hover:border-neutral-700/80 transition-colors">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700/50 shrink-0 flex items-center justify-center shadow-inner">
              {coverUrl && !imgError ? (
                <img
                  src={
                    coverUrl.startsWith("http")
                      ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
                      : coverUrl
                  }
                  alt={activeProjectData.project?.title || "Project Cover"}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-[#3B82F6]/20 flex items-center justify-center text-[#60A5FA] font-bold text-xs">
                  {activeProjectData.project?.title?.charAt(0).toUpperCase() || "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-neutral-100 truncate leading-tight">
                {activeProjectData.project?.title || "Untitled Project"}
              </h4>
              <span className="text-[10px] text-neutral-400 truncate font-mono">
                {activeProjectData.panels?.length || activeProjectData.project?.panels_count || 0} panels
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-[#3B82F6]/20 text-neutral-300 hover:text-[#3B82F6] border border-neutral-700/60 hover:border-[#3B82F6]/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Switch Project</span>
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-neutral-400 mb-2">
            No active project selected.
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-black/50 cursor-pointer active:scale-98"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Active Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
  useThemeMode();

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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-950/85 backdrop-blur-2xl text-white select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-5 pb-4 pt-5 border-b border-neutral-800/60 shrink-0">
        <SonikomaLogo
          size="md"
          badge="Suite"
          showSubtitle={true}
          subtitleText="Comic to Video Studio"
        />
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
          title="Close sidebar drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-2">
            {groupIdx > 0 && (
              <div className="w-full flex flex-col pt-1 pb-1">
                <div className="w-full h-px bg-neutral-800/60 my-2.5" />
              </div>
            )}
            <h4 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.16em] font-sans mb-1 flex items-center gap-2">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const isLocked = false;

                return (
                  <li key={item.id} className="relative">
                    {/* Active Side Accent Indicator */}
                    <div
                      className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-[#3B82F6] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-[#3B82F6] text-white shadow-sm border border-[#60A5FA]/40 font-bold"
                          : isLocked
                          ? "text-neutral-500 hover:text-neutral-400 border border-transparent"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                      }`}
                      title={
                        isLocked
                          ? "Requires timeline panels to unlock"
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            active
                              ? "text-white"
                              : isLocked
                              ? "text-neutral-600"
                              : "text-neutral-400 group-hover:scale-110 group-hover:text-[#93C5FD]"
                          }`}
                        />
                        <span className={active ? "font-bold text-white" : "font-medium text-neutral-300 group-hover:text-white"}>
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

      {/* Sidebar Footer: Active Project Widget + Return to App */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
        <ActiveProjectSidebarWidget
          setDrawerOpen={(open) =>
            useProjectStore.getState().setDrawerOpen(open)
          }
        />
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900/70 hover:bg-[#3B82F6] text-neutral-300 hover:text-white text-xs font-semibold tracking-wide transition-all active:scale-95 border border-neutral-800/80 hover:border-[#60A5FA]/40 cursor-pointer font-sans shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 stroke-[2.5]" />
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
