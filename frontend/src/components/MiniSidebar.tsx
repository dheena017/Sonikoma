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
  const isDashboardOverview =
    currentPath === "/" || currentPath === "/dashboard";
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
        { label: "Dashboard", icon: LayoutDashboard, active: isDashboardOverview, onClick: () => navigateTo("/") },
        { label: "Workspace", icon: Layout, active: isWorkspace, onClick: () => navigateTo("/workspace") },
        { label: "Projects", icon: FolderOpen, active: isProjects, onClick: () => navigateTo("/projects") },
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
        <button
          onClick={item.onClick}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          title={item.label}
          className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative flex items-center justify-center ${
            item.active
              ? "text-white bg-purple-950/20 border border-purple-900/60 shadow-inner"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              item.active ? "text-purple-400" : "text-neutral-500 group-hover:text-neutral-300"
            }`}
          />
          {item.badge && (
            <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] bg-purple-600 text-[9px] text-white font-bold rounded-full flex items-center justify-center px-1 border border-neutral-950">
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
    <aside className={`fixed ${isProEditorPage ? "top-12" : "top-16"} bottom-4 left-4 w-20 shrink-0 bg-neutral-950/95 border border-neutral-900/60 rounded-3xl shadow-2xl hidden lg:flex flex-col items-center pb-5 z-40`}>
      <div
        className="flex-1 w-full overflow-y-auto overflow-x-hidden hide-scrollbar mini-sidebar-scrollbar flex flex-col items-center space-y-6 pt-3 px-2.5"
        style={{ scrollbarGutter: "stable" }}
      >
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="w-full flex flex-col items-center space-y-2">
            <div className="w-10 h-px bg-neutral-800/50 mb-1" />
            {group.items.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        ))}

        {/* Creative Tools Flyout menu (simplified for mini sidebar) */}
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="w-10 h-px bg-neutral-800/50 mb-1" />
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => navigateTo("/workspace")}
              title="Creative Suite (Expand to View)"
              onMouseEnter={(e) => {
                setCreativeRect(e.currentTarget.getBoundingClientRect());
                setCreativeHover(true);
              }}
              onMouseLeave={() => setCreativeHover(false)}
              className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent`}
            >
              <Sparkles className="h-5 w-5 text-neutral-500 group-hover:text-purple-400 group-hover:animate-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-neutral-800 rounded-full p-0.5 border border-neutral-900">
                <ChevronRight className="h-2 w-2 text-neutral-400" />
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
