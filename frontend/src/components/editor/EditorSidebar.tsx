import React from "react";
import {
  Layout,
  Scissors,
  Brain,
  Film,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface EditorSidebarProps {
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

const EditorSidebar = ({
  isCollapsed,
  setIsCollapsed,
  currentSection,
  setCurrentSection,
  onBackToApp,
  scrapedCount,
  panelsCount,
  isBatchCropping,
  isCleaningBubbles,
}: EditorSidebarProps) => {
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
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Branding */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            alt="Croex Logo"
            className="h-11 w-11 rounded-full bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover"
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white font-sans">Croex</p>
              <p className="text-[10px] text-neutral-400 font-mono">Editor Suite</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="flex-shrink-0 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Exit Button */}
      <div className="p-3 border-b border-white/5">
        <button
          onClick={onBackToApp}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all border border-white/5 group`}
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span className="text-xs font-bold font-mono">Back to App</span>}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-purple-400" : "group-hover:text-neutral-300"}`} />
                {!isCollapsed && <span className="text-xs font-bold font-mono">{item.label}</span>}
              </div>

              {item.badge !== undefined && !isCollapsed && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold font-mono ${isActive ? "bg-purple-500/20 text-purple-300" : "bg-neutral-800 text-neutral-500"}`}>
                  {item.badge}
                </span>
              )}

              {item.isProcessing && (
                <span className={`absolute right-2 top-3 h-2 w-2 rounded-full bg-purple-500 animate-ping`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-neutral-950 border border-white/5 text-neutral-500 hover:text-white transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default EditorSidebar;
