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
          className={`p-2.5 transition-all duration-300 rounded-xl cursor-pointer relative flex items-center justify-center group-active:scale-95 ${
            isActive
              ? "bg-purple-500/10 text-white border border-purple-500/20 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5 border border-transparent hover:scale-105"
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] transition-transform duration-300 ${
              isActive ? "text-purple-400" : "group-hover:text-neutral-200"
            }`}
          />
          {item.badge !== undefined && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] bg-purple-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-sm z-20">
              {item.badge}
            </span>
          )}
          {item.isProcessing && (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-purple-500 animate-ping z-20" />
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    // Premium Glassmorphism Container
    <aside
      className={`fixed top-16 bottom-0 left-0 bg-[#0a0a0e]/80 backdrop-blur-xl border-r border-purple-900/10 flex flex-col items-center transition-all duration-300 z-40 py-4 shadow-[4px_0_24px_rgba(0,0,0,0.4)] ${
        isCollapsed ? "w-16" : "w-20"
      }`}
    >
      {/* Top Action Area: Back to App */}
      <div className="w-full flex justify-center pb-4 border-b border-white/[0.02] mb-2">
        <button
          onClick={onBackToApp}
          title="Back to Dashboard"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all active:scale-95 border border-white/10 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
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
