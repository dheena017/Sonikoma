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
  type LucideIcon,
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
  navigateTo?: (path: string) => void;
}

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string | number;
  isProcessing?: boolean;
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
  navigateTo,
}: EditorSidebarProps) => {
  const menuItems: SidebarMenuItem[] = [
    {
      id: "images",
      label: "Imported Images",
      icon: Layout,
      path: "/workspace/editor",
    },
    {
      id: "crop",
      label: "Crop",
      icon: Scissors,
      path: "/workspace/editor",
    },
    {
      id: "edit",
      label: "Edit",
      icon: Film,
      path: "/workspace/editor",
    },
    {
      id: "cut",
      label: "Cut",
      icon: Brain,
      path: "/workspace/editor",
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-4 h-screen bg-[#0a0a0f] border border-white/5 rounded-none flex flex-col transition-all duration-300 z-40 shadow-2xl shadow-black/60 overflow-hidden ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-2 border-b border-white/5 flex items-center justify-end">
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
      <div className="p-2 border-b border-white/5">
        <button
          onClick={onBackToApp}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all border border-white/5"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
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
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all duration-200 group relative ${
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
      <div className="p-2 border-t border-white/5">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-xl bg-neutral-950 border border-white/5 text-neutral-500 hover:text-white transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default EditorSidebar;
