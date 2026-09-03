import React, { useEffect } from "react";
import {
  X,
  ArrowLeft,
  Zap,
  FolderSync,
  FolderOpen,
  LayoutDashboard,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";
import { WorkspaceId } from "../types/workspace.types";
import { getGroupedWorkspaces } from "../registry/workspaceRegistry";

interface VideoEditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace?: WorkspaceId;
  onSelectWorkspace?: (id: WorkspaceId) => void;
  seriesTitle?: string;
  chapterTitle?: string;
  panelsCount?: number;
  onBackToApp?: () => void;
  navigateTo?: (path: string) => void;
}

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
                <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-blue-600/30 border border-[#3B82F6]/20 flex items-center justify-center text-[#60A5FA] font-bold text-xs">
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
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-black/50 cursor-pointer active:scale-98"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Active Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

const VideoEditorSidebar: React.FC<VideoEditorSidebarProps> = ({
  isOpen,
  onClose,
  activeWorkspace = "imported_assets",
  onSelectWorkspace,
  seriesTitle,
  chapterTitle,
  panelsCount = 0,
  onBackToApp,
  navigateTo,
}) => {
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

  const workspaceGroups = getGroupedWorkspaces();

  const globalItems = [
    {
      id: "dashboard",
      title: "Main Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      id: "projects",
      title: "Projects Gallery",
      icon: FolderOpen,
      path: "/projects",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-[280px] sm:w-[300px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="w-full h-full bg-[#09090B]/95 backdrop-blur-3xl border-r border-white/8 flex flex-col justify-between shadow-[10px_0_40px_rgba(0,0,0,0.7),inset_-1px_0_0_rgba(59,130,246,0.06)] select-none">
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <SonikomaLogo
              size="md"
              badge="Studio"
              showSubtitle={true}
              subtitleText={seriesTitle || "Comic to Video Studio"}
              onClick={() => navigateTo?.("/dashboard")}
            />

            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {workspaceGroups.map((group, groupIdx) => (
              <div key={group.name} className="space-y-1.5">
                {groupIdx > 0 && (
                  <div className="w-full flex flex-col pt-1 pb-1">
                    <div className="w-8 h-[1px] bg-white/10 rounded-full ml-3" />
                  </div>
                )}
                <h4 className="px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans">
                  {group.name}
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeWorkspace === item.id;

                    return (
                      <li key={item.id} className="relative">
                        {/* Active Side Accent Indicator */}
                        <div
                          className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                            isActive
                              ? "h-5 bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] opacity-100"
                              : "h-0 bg-transparent opacity-0"
                          }`}
                        />

                        <button
                          onClick={() => {
                            onSelectWorkspace?.(item.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold shadow-sm"
                              : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isActive
                                  ? "text-white"
                                  : "text-neutral-400 group-hover:scale-110 group-hover:text-[#3B82F6]"
                              }`}
                            />
                            <span className="text-sm font-bold tracking-wide font-sans">
                              {item.title}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* Global Links Section */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full flex flex-col pt-1 pb-1">
                <div className="w-8 h-[1px] bg-white/10 rounded-full ml-3" />
              </div>
              <h4 className="px-4 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans">
                Global
              </h4>
              <ul className="space-y-1">
                {globalItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          navigateTo?.(item.path);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-transparent transition-all duration-300 group cursor-pointer active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0 text-neutral-400 group-hover:scale-110 group-hover:text-[#3B82F6] transition-all" />
                          <span className="text-sm font-bold tracking-wide font-sans">
                            {item.title}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Sidebar Footer: Active Project Widget + Return Button */}
          <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/30 to-transparent shrink-0 space-y-3">
            <ActiveProjectSidebarWidget
              setDrawerOpen={(open) =>
                useProjectStore.getState().setDrawerOpen(open)
              }
            />
            <button
              onClick={() => {
                onClose();
                onBackToApp?.();
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-[#2A2A2A] hover:bg-[#3B82F6] text-neutral-300 hover:text-white text-xs font-black tracking-widest uppercase transition-all active:scale-95 border border-[#2F2F2F] hover:border-[#60A5FA]/40 cursor-pointer font-sans shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>CREATIVE SUITE</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(VideoEditorSidebar);
