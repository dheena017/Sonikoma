import React from "react";
import {
  X,
  Video,
  FolderKanban,
  Film,
  Subtitles,
  Music,
  Box,
  Layers,
  Sparkles,
  Wand2,
  Settings,
  HelpCircle,
  ArrowLeft,
  LayoutDashboard,
  FolderOpen,
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
      group: "Studio Tools",
      items: [
        { id: "project", label: "Project Media Bin", icon: FolderKanban },
        { id: "scenes", label: "Scene Timeline Clips", icon: Film },
        { id: "subtitles", label: "Subtitles & Narration", icon: Subtitles },
        { id: "audio", label: "BGM & Audio Mixer", icon: Music },
        { id: "elements", label: "Elements & Overlays", icon: Box },
        { id: "transitions", label: "Scene Transitions", icon: Layers },
        { id: "effects", label: "VFX & Color Filters", icon: Sparkles },
        { id: "ai-tools", label: "AI Creative Suite", icon: Wand2 },
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-72 shrink-0 bg-neutral-950/95 border-r border-neutral-900 z-50 transition-all duration-300 ease-out transform overflow-hidden ${
          isOpen ? "translate-x-0 shadow-2xl shadow-purple-950/30" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-5 space-y-6 select-none">
          {/* Header & Logo */}
          <div className="space-y-6 flex flex-col flex-grow min-h-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white font-sans">
                    Sonikoma Video Studio
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {seriesTitle ? `${seriesTitle}` : "NLE Timeline Editor"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-6 overflow-y-auto flex-grow min-h-0 custom-sidebar-scrollbar pr-1">
              {navSections.map((sec, secIdx) => (
                <div key={sec.group} className="space-y-2">
                  {secIdx > 0 && <div className="w-8 h-[1px] bg-neutral-800 rounded-full mb-2 ml-2" />}
                  <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono pl-2">
                    {sec.group}
                  </h4>
                  <ul className="space-y-1">
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
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-left ${
                              isActive
                                ? "text-white bg-purple-950/30 border border-purple-900/60 shadow-inner"
                                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon
                                className={`h-4 w-4 ${
                                  isActive ? "text-purple-400" : "text-neutral-500"
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
          <div className="space-y-3 pt-4 border-t border-neutral-900">
            {panelsCount > 0 && (
              <div className="px-3 py-2 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-300 text-[10px] font-mono flex items-center justify-between">
                <span>Active Sequence:</span>
                <span className="font-bold">{panelsCount} Panel Clips</span>
              </div>
            )}
            <button
              onClick={() => {
                onClose();
                onBackToApp?.();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-purple-400" />
              <span>Return to Storyboard</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(VideoEditorSidebar);
