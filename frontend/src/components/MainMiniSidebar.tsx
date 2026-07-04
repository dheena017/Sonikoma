import React, { useState } from "react";
import {
  LayoutDashboard,
  Layout,
  FolderOpen,
  Scissors,
  Brain,
  Film,
  Terminal,
  Activity,
  Award,
  Keyboard,
  Sliders,
  Bell,
  Sparkles,
  Shield,
  ChevronRight,
} from "lucide-react";
import TooltipPortal from "./TooltipPortal";

interface MiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  notificationsCount: number;
}

const MiniSidebarInner: React.FC<MiniSidebarProps> = ({
  currentPath,
  navigateTo,
  notificationsCount,
}) => {
  const isDashboardOverview = currentPath === "/" || currentPath === "/dashboard";
  const isWorkspace = currentPath.startsWith("/workspace");
  const isProjects = currentPath.startsWith("/projects");
  const isAutoCrop = currentPath.startsWith("/auto-crop");
  const isBubbleCleaner = currentPath.startsWith("/bubble-cleaner");
  const isEditor = currentPath.startsWith("/editor") || currentPath.startsWith("/workspace/editor");

  const isLogs = currentPath.startsWith("/logs");
  const isStatus = currentPath.startsWith("/status");
  const isAIModels = currentPath.startsWith("/ai-models");
  const isShortcuts = currentPath.startsWith("/shortcuts");
  const isSettings = currentPath.startsWith("/settings");
  const isAdminPath = currentPath.startsWith("/admin");
  const isProEditorPage =
    currentPath === "/editor" ||
    currentPath === "/editor/" ||
    currentPath.startsWith("/editor/") ||
    currentPath.startsWith("/workspace/editor");

  const groups = [
    
    {
      group: "Main Workspace",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, active: isDashboardOverview, onClick: () => navigateTo("/dashboard") },
        { label: "Workspace", icon: Layout, active: isWorkspace, onClick: () => navigateTo("/workspace") },
        { label: "Projects", icon: FolderOpen, active: isProjects, onClick: () => navigateTo("/projects") },
      ],
    },

    {
      group: "Editor Tools",
      items: [
        { label: "Auto-Crop", icon: Scissors, active: isAutoCrop, onClick: () => navigateTo("/auto-crop") },
        { label: "Clean-Bubbles", icon: Brain, active: isBubbleCleaner, onClick: () => navigateTo("/bubble-cleaner") },
        { label: "Video Studio", icon: Film, active: isEditor, onClick: () => {
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          navigateTo(`/workspace/editor?id=${tempId}`);
        }},
      ],
    },

    {
      group: "System & Tools",
      items: [
        { label: "Logs", icon: Terminal, active: isLogs, onClick: () => navigateTo("/logs") },
        { label: "Status", icon: Activity, active: isStatus, onClick: () => navigateTo("/status") },
        { label: "AI Models", icon: Award, active: isAIModels, onClick: () => navigateTo("/ai-models") },
        { label: "Keys", icon: Keyboard, active: isShortcuts, onClick: () => navigateTo("/shortcuts") },
        { label: "Settings", icon: Sliders, active: isSettings, onClick: () => navigateTo("/settings") },
      ],
    },

    {
      group: "User Area",
      items: [
        { label: "Notifications", icon: Bell, active: currentPath === "/notifications", onClick: () => navigateTo("/notifications"), badge: notificationsCount > 0 ? notificationsCount : undefined },
        { label: "Profile", icon: Sparkles, active: currentPath === "/profile", onClick: () => navigateTo("/profile") },
        { label: "Admin Dashboard", icon: Shield, active: isAdminPath, onClick: () => navigateTo("/admin") },
      ],
    },

  ];

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setRect(r);
      setHover(true);
    };
    const handleLeave = () => setHover(false);

    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center overflow-visible">
        {/* Active Indicator Glow Pill on the far left edge */}
        <div 
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ${
            item.active 
              ? "h-6 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] opacity-100" 
              : "h-0 bg-transparent opacity-0"
          }`} 
        />

        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          title={item.label}
          // Added active:scale-95 for a tactile click feel
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative flex items-center justify-center active:scale-95 ${
            item.active
              ? "text-white bg-purple-500/15 border border-purple-500/30 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)]"
              : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 border border-transparent"
          }`}
        >
          <Icon
            className={`h-5 w-5 transition-transform duration-200 ${
              item.active ? "text-purple-400 scale-110" : "text-neutral-500 group-hover:scale-110"
            }`}
          />
          {item.badge && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] bg-purple-600 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1 border-2 border-neutral-950 shadow-sm">
              {item.badge}
            </span>
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const [creativeHover, setCreativeHover] = useState(false);
  const [creativeRect, setCreativeRect] = useState<DOMRect | null>(null);
  
  return (
    // Added backdrop-blur-2xl and opacity adjustments for a premium glass effect
    <aside className={`fixed ${isProEditorPage ? "top-12" : "top-16"} bottom-4 left-0 w-20 shrink-0 bg-neutral-950/80 backdrop-blur-2xl border-r border-neutral-800/60 rounded-none shadow-2xl hidden lg:flex flex-col items-center pb-5 z-40`}>
      <div
        // Added pl-3 here to shift everything nicely to the right, leaving the left gutter empty
        className="flex-1 w-full overflow-y-auto overflow-x-hidden hide-scrollbar mini-sidebar-scrollbar flex flex-col items-center space-y-6 pt-4 pl-3 pr-2"
        style={{ scrollbarGutter: "stable" }}
      >
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="w-full flex flex-col items-center space-y-2">
            {/* Sleek Gradient Divider instead of a harsh solid line */}
            {groupIdx > 0 && (
               <div className="w-8 h-px bg-gradient-to-r from-transparent via-neutral-700/60 to-transparent mb-2" />
            )}
            
            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        ))}

        {/* Creative Tools Flyout menu */}
        <div className="w-full flex flex-col items-center space-y-2 mt-2">
          <div className="w-8 h-px bg-gradient-to-r from-transparent via-neutral-700/60 to-transparent mb-2" />
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => navigateTo("/workspace")}
              title="Creative Suite (Expand to View)"
              onMouseEnter={(e) => {
                setCreativeRect(e.currentTarget.getBoundingClientRect());
                setCreativeHover(true);
              }}
              onMouseLeave={() => setCreativeHover(false)}
              className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 border border-transparent active:scale-95"
            >
              <Sparkles className="h-5 w-5 text-neutral-500 group-hover:text-purple-400 group-hover:animate-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-0.5 border border-neutral-700 shadow-sm">
                <ChevronRight className="h-2.5 w-2.5 text-neutral-300" />
              </div>
            </button>
            <TooltipPortal text="Creative Suite" visible={creativeHover} anchorRect={creativeRect} />
          </div>
        </div>
      </div>
    </aside>
  );
};

const MiniSidebar = React.memo(MiniSidebarInner);
export default MiniSidebar;
