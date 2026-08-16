import React from "react";
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
} from "lucide-react";

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
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-80 shrink-0 bg-[#06060c]/90 border-r border-white/8 z-50 transition-all duration-300 ease-out transform overflow-hidden backdrop-blur-3xl ${
          isOpen ? "translate-x-0 shadow-[10px_0_40px_rgba(0,0,0,0.7),inset_-1px_0_0_rgba(168,85,247,0.06)]" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-5 space-y-4 select-none">
          <div className="space-y-4 flex flex-col flex-grow min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_16px_rgba(168,85,247,0.4)]">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-wide text-white font-mono uppercase">
                    Sonikoma Studio
                  </h3>
                  <p className="text-[9px] text-purple-300/80 font-mono">
                    {seriesTitle ? `${seriesTitle}` : "NLE Production Suite"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-grow min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
              {navSections.map((sec, secIdx) => (
                <div key={sec.group} className="space-y-1.5">
                  {secIdx > 0 && <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-800/80 to-transparent my-3" />}
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans pl-2">
                    {sec.group}
                  </h4>
                  <ul className="space-y-1.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => {
                              if (item.onClick) {
                                item.onClick();
                              } else {
                                setActiveNav(item.id);
                              }
                              onClose();
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer text-left relative group ${
                              isActive
                                ? "text-white bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 border border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.2)] font-bold"
                                : "text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent hover:border-neutral-800/60"
                            }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                            )}
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isActive
                                    ? "text-purple-300 scale-110"
                                    : "text-neutral-400 group-hover:text-purple-300 group-hover:scale-105"
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-purple-900/20">
            {panelsCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-300 text-[9px] font-mono flex items-center justify-between">
                <span>Active Sequence:</span>
                <span className="font-bold">{panelsCount} Panel Clips</span>
              </div>
            )}
            <button
              onClick={() => {
                onClose();
                onBackToApp?.();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-bold font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_14px_rgba(168,85,247,0.35)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Storyboard</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(VideoEditorSidebar);
