import React from "react";
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
  Wand2,
  Users,
  MessageSquare,
  Globe,
  Music,
  Image,
  MessageCircle,
  Mic,
  LineChart,
  Youtube,
  ChevronRight,
} from "lucide-react";
import { useThemeMode } from "../hooks/useThemeMode.js";

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
  const { themeMode } = useThemeMode();

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

  const groups = [
    {
      group: "Main Workspace",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, active: isDashboardOverview, onClick: () => navigateTo("/") },
        { label: "Workspace", icon: Layout, active: isWorkspace, onClick: () => navigateTo("/workspace") },
        { label: "Projects", icon: FolderOpen, active: isProjects, onClick: () => navigateTo("/projects") },
        { label: "Auto-Crop", icon: Scissors, active: isAutoCrop, onClick: () => navigateTo("/auto-crop") },
        { label: "Clean-Bubbles", icon: Brain, active: isBubbleCleaner, onClick: () => navigateTo("/bubble-cleaner") },
        { label: "Editor", icon: Film, active: isEditor, onClick: () => navigateTo("/workspace/editor") },
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

  return (
    <aside className="fixed inset-y-0 left-0 w-20 shrink-0 bg-neutral-950/95 border-r border-neutral-900 hidden lg:flex flex-col items-center py-5 z-40">
      {/* BRANDING LOGO (Small version) */}
      <div className="mb-6 w-full flex justify-center">
        <div
          className="cursor-pointer select-none hover:opacity-90 transition-opacity"
          onClick={() => navigateTo("/")}
        >
          <img
            src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            className="h-10 w-10 rounded-full shadow-lg shadow-purple-900/40 object-cover"
            style={{
              background: themeMode === "light" ? "#ffffff" : "#000000",
            }}
            alt="Sonikoma Logo"
          />
        </div>
      </div>

      <div className="flex-1 w-full overflow-y-auto scrollbar-hide flex flex-col items-center space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="w-full flex flex-col items-center space-y-2">
            <div className="w-10 h-px bg-neutral-800/50 mb-1" />
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="relative group w-full flex justify-center">
                  <button
                    onClick={item.onClick}
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
                  {/* Tooltip on hover */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-neutral-900 border border-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl font-mono">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Creative Tools Flyout menu (simplified for mini sidebar) */}
        <div className="w-full flex flex-col items-center space-y-2">
          <div className="w-10 h-px bg-neutral-800/50 mb-1" />
          <div className="relative group w-full flex justify-center">
            <button
              onClick={() => navigateTo("/workspace")}
              title="Creative Suite (Expand to View)"
              className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer relative flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent`}
            >
              <Sparkles className="h-5 w-5 text-neutral-500 group-hover:text-purple-400 group-hover:animate-pulse" />
              <div className="absolute -bottom-1 -right-1 bg-neutral-800 rounded-full p-0.5 border border-neutral-900">
                <ChevronRight className="h-2 w-2 text-neutral-400" />
              </div>
            </button>
             {/* Tooltip on hover */}
             <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-neutral-900 border border-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl font-mono">
              Creative Suite
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const MiniSidebar = React.memo(MiniSidebarInner);
export default MiniSidebar;
