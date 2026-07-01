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
      className={`fixed top-[5.5rem] bottom-0 left-0 bg-[#0a0a0f] border border-white/5 rounded-2xl flex flex-col transition-all duration-300 z-50 shadow-2xl shadow-black/60 overflow-hidden ${
        isCollapsed ? "w-16" : "w-20"
      }`}
    >
      <div className="p-2 flex items-center justify-center border-b border-white/5">
        <img
          src="/logo.png"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/logo.png";
          }}
          alt="Croex Logo"
          className="h-10 w-10 rounded-full bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover"
        />
      </div>
      <div className="p-2 border-b border-white/5">
        <button
          onClick={onBackToApp}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all border border-white/5"
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
              onClick={() => setCurrentSection(item.id)}
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

      <div className="p-2 border-t border-white/5">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-neutral-950 border border-white/5 text-neutral-500 hover:text-white transition-all"
          title="Toggle sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default EditorMiniSidebar;
