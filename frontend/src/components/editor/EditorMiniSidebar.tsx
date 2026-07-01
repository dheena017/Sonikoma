import React from "react";
import {
  Layout,
  Scissors,
  Brain,
  Film,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

interface EditorMiniSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  currentSection: string;
  setCurrentSection: (section: string) => void;
  onBackToApp: () => void;
  scrapedCount: number;
  panelsCount: number;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  navigateTo?: (path: string) => void;
}

const EditorMiniSidebar = ({
  isCollapsed,
  setIsCollapsed,
  currentSection,
  setCurrentSection,
  onBackToApp,
  scrapedCount,
  panelsCount,
  isBatchCropping,
  isCleaningBubbles,
  navigateTo,
}: EditorMiniSidebarProps) => {
  const menuItems = [
    {
      id: "images",
      label: "Imported Images (Live Scraper Deck)",
      icon: Layout,
      badge: scrapedCount > 0 ? scrapedCount : undefined,
    },
    {
      id: "timeline",
      label: "Timeline & Text (Storyboard Timeline)",
      icon: Film,
      badge: panelsCount > 0 ? panelsCount : undefined,
    },
    {
      id: "editor",
      label: "Editor",
      icon: Film,
      path: "/workspace/editor",
    },
    {
      id: "autocrop",
      label: "Auto-Crop",
      icon: Scissors,
      isProcessing: isBatchCropping,
    },
    {
      id: "bubbles",
      label: "Clean Bubbles",
      icon: Brain,
      isProcessing: isCleaningBubbles,
    },
  ];

  return (
    <aside
      className={`fixed top-[6rem] bottom-4 left-4 bg-[#0a0a0f] border border-white/5 rounded-2xl flex flex-col transition-all duration-300 z-40 shadow-2xl shadow-black/60 overflow-hidden ${
        isCollapsed ? "w-16" : "w-20"
      }`}
    >
      <div className="p-1.5 border-b border-white/5">
        <button
          onClick={onBackToApp}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all border border-white/5"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentSection(item.id);
                if (item.path && navigateTo) {
                  navigateTo(item.path);
                }
              }}
              title={item.label}
              className={`relative w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : ""}`} />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-purple-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {item.isProcessing && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

    </aside>
  );
};

export default EditorMiniSidebar;
