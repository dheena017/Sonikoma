import React, { useState } from "react";
import { Scissors, Brain, ArrowLeft, type LucideIcon } from "lucide-react";
import TooltipPortal from "../../TooltipPortal";

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

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  badge?: string | number;
  isProcessing?: boolean;
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
  const menuItems: SidebarMenuItem[] = [
    {
      id: "autocrop",
      label: "Auto-Crop",
      icon: Scissors,
      path: "/auto-crop",
      badge: scrapedCount > 0 ? scrapedCount : undefined,
      isProcessing: isBatchCropping,
    },
    {
      id: "bubbles",
      label: "Clean-Bubbles",
      icon: Brain,
      path: "/bubble-cleaner",
      isProcessing: isCleaningBubbles,
    },
  ];

  const SidebarItem: React.FC<{ item: SidebarMenuItem }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const pathname = window.location.pathname;
    const isActive =
      currentSection === item.id ||
      pathname === item.path ||
      (item.path && pathname.startsWith(`${item.path}/`));

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
            isActive
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => {
            const nextSection =
              item.id === "autocrop"
                ? "autocrop"
                : item.id === "bubbles"
                ? "bubbles"
                : item.id;
            setCurrentSection(nextSection);
            if (
              item.id !== "autocrop" &&
              item.id !== "bubbles" &&
              item.path &&
              navigateTo
            ) {
              navigateTo(item.path);
            }
          }}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          {/* iOS-style icon pill container */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              isActive
                ? "bg-purple-500/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : "bg-neutral-800 border border-neutral-700 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                isActive ? "text-purple-400" : "text-neutral-400 group-hover:text-purple-300"
              }`}
            />
          </div>
          {item.badge !== undefined && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-purple-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-sm z-20">
              {item.badge}
            </span>
          )}
          {item.isProcessing && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-purple-500 animate-ping z-20" />
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    // Premium Glassmorphism Container
    <aside
      className={`hidden md:flex fixed top-[59px] bottom-0 left-0 bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 flex-col items-center transition-all duration-300 z-40 py-4 shadow-[4px_0_24px_rgba(0,0,0,0.3)] ${
        isCollapsed ? "w-16" : "w-20"
      }`}
    >
      {/* Top Action Area: Back to App */}
      <div className="w-full flex justify-center pb-4 border-b border-neutral-800/60 mb-2">
        <button
          onClick={onBackToApp}
          title="Back to Dashboard"
          className="transition-all active:scale-95 flex items-center justify-center cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center group-hover:bg-purple-500/15 group-hover:border-purple-500/30 transition-all duration-200 shadow-sm">
            <ArrowLeft className="w-[18px] h-[18px] text-neutral-400 group-hover:text-purple-400 transition-colors" />
          </div>
        </button>
      </div>

      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {menuItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
};

export default EditorMiniSidebar;
