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
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Slide-Out Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-80 shrink-0 bg-gradient-to-b from-neutral-950/98 via-[#0d0a1d]/98 to-neutral-950/98 border-r border-purple-900/30 z-50 transition-all duration-300 ease-out transform overflow-hidden backdrop-blur-2xl ${
          isOpen ? "translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.6)]" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-5 space-y-4 select-none">
          {/* Header & Logo */}
          <div className="space-y-4 flex flex-col flex-grow min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
                  <img
                    src="/logo-dark.png"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                    }}
                    className="relative h-10 w-10 rounded-full border border-purple-500/30 shrink-0 object-cover bg-black"
                    alt="Sonikoma Logo"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm tracking-tight text-white font-sans">
                      Video Editor
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-mono">
                      NLE
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
                    Video Production Suite
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
                title="Close sidebar drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu Items */}
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

          {/* Bottom Card */}
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
