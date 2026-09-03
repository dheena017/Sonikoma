import React, { useEffect } from "react";
import {
  X,
  Video,
  BookOpen,
  Image,
  Users,
  Wand2,
  Type,
  Shapes,
  Music,
  LayoutTemplate,
  Package,
  ShoppingBag,
  AppWindow,
  Star,
  History,
  LayoutDashboard,
  FolderOpen,
  ArrowLeft,
  Zap,
  FolderSync,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

interface VideoEditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
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

const VideoEditorSidebar: React.FC<VideoEditorSidebarProps> = ({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
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

  const navSections = [
    {
      group: "Primary Workspaces",
      items: [
        { id: "favorites", label: "Favorites Vault", icon: Star },
        { id: "recent", label: "Recently Used", icon: History },
        { id: "story", label: "Story Studio (Heart)", icon: BookOpen },
        { id: "media", label: "Media Bin", icon: Image },
        { id: "characters", label: "Characters Roster", icon: Users },
        { id: "ai", label: "Advanced AI Studio", icon: Wand2 },
        { id: "text", label: "Text & Captions", icon: Type },
      ],
    },
    {
      group: "Secondary Workspaces",
      items: [
        { id: "elements", label: "Elements & FX", icon: Shapes },
        { id: "audio", label: "Audio & Voiceover", icon: Music },
        { id: "templates", label: "Comic Templates", icon: LayoutTemplate },
        { id: "resources", label: "Creator Resources", icon: Package },
      ],
    },
    {
      group: "Utility & Store",
      items: [
        { id: "marketplace", label: "Marketplace Packs", icon: ShoppingBag },
        { id: "apps", label: "Connected Apps", icon: AppWindow },
      ],
    },
    {
      group: "Global Navigation",
      items: [
        {
          id: "dash",
          label: "Main Dashboard",
          icon: LayoutDashboard,
          onClick: () => navigateTo?.("/dashboard"),
        },
        {
          id: "proj",
          label: "Projects Gallery",
          icon: FolderOpen,
          onClick: () => navigateTo?.("/projects"),
        },
      ],
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
        <div className="w-full h-full bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between shadow-2xl select-none">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white  shrink-0">
                <Video className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight text-white font-sans uppercase">
                    Sonikoma Studio
                  </h3>
                </div>
                <span className="text-[10px] text-neutral-400 font-sans truncate">
                  {seriesTitle ? seriesTitle : "Comedy"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Project Widget */}
          <div className="px-4 pt-3 shrink-0">
            <ActiveProjectSidebarWidget
              setDrawerOpen={(open) =>
                useProjectStore.getState().setDrawerOpen(open)
              }
            />
          </div>

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navSections.map((sec, secIdx) => (
              <div key={sec.group} className="space-y-2">
                {secIdx > 0 && (
                  <div className="w-full flex flex-col pt-1 pb-1">
                    <div className="w-8 h-[1px] bg-white/10 rounded-full ml-3" />
                  </div>
                )}
                <h4 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">
                  {sec.group}
                </h4>
                <ul className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.id;

                    return (
                      <li key={item.id} className="relative">
                        {/* Active Side Accent Indicator */}
                        <div
                          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                            isActive
                              ? "h-5 bg-[#2A2A2A] shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
                              : "h-0 bg-transparent opacity-0"
                          }`}
                        />

                        <button
                          onClick={() => {
                            if (item.onClick) {
                              item.onClick();
                            } else {
                              setActiveNav(item.id);
                            }
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group relative cursor-pointer active:scale-[0.98] ${
                            isActive
                              ? "bg-[#2A2A2A] text-white shadow-[inset_0_0_16px_rgba(59,130,246,0.12)] border border-[#3B82F6]/30 font-bold"
                              : "text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isActive
                                  ? "text-[#3B82F6]"
                                  : "text-neutral-400 group-hover:scale-110 group-hover:text-[#93C5FD]"
                              }`}
                            />
                            <span className="text-xs font-semibold tracking-wide font-sans">
                              {item.label}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Sidebar Footer: Return Button */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={() => {
                onClose();
                onBackToApp?.();
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs font-black tracking-widest uppercase transition-all  hover: active:scale-95 border border-[#60A5FA]/40 cursor-pointer font-sans"
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
