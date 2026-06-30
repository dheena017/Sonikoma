import React from "react";
import {
  Shield,
  LayoutGrid,
  Mail,
  Users,
  FolderGit2,
  Cpu,
  Globe,
  DollarSign,
  BarChart3,
  Database,
  Terminal,
  Settings,
  Server,
  ActivitySquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode";

interface AdminSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  navigateTo,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { themeMode } = useThemeMode();

  const groups = [
    {
      name: "Core",
      items: [
        { id: "overview", label: "Overview", icon: LayoutGrid, path: "/admin" },
        { id: "announcements", label: "Announcements", icon: Mail, path: "/admin/announcements" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "content", label: "Content", icon: FolderGit2, path: "/admin/content" },
      ],
    },
    {
      name: "Monitoring",
      items: [
        { id: "health", label: "Health", icon: Server, path: "/admin/health" },
        { id: "activity", label: "Audit Logs", icon: ActivitySquare, path: "/admin/activity" },
        { id: "usage", label: "Usage", icon: Cpu, path: "/admin/usage" },
      ],
    },
    {
      name: "Business & Data",
      items: [
        { id: "finance", label: "Finance", icon: DollarSign, path: "/admin/finance" },
        { id: "scrapers", label: "Scrapers", icon: Globe, path: "/admin/scrapers" },
        { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
      ],
    },
    {
      name: "Technical",
      items: [
        { id: "explorer", label: "Explorer", icon: Database, path: "/admin/explorer" },
        { id: "console", label: "Console", icon: Terminal, path: "/admin/console" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin" || currentPath === "/admin/";
    }
    return currentPath.startsWith(path);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0a0a0e]/95 backdrop-blur-xl border-r border-violet-900/20 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-violet-900/10">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 rounded-lg shadow-lg shadow-violet-600/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Command Center</span>
          </div>
        )}
        {isCollapsed && (
          <Shield className="w-6 h-6 text-violet-500 mx-auto" />
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 p-1.5 bg-violet-600 rounded-full border border-violet-500 text-white shadow-lg hover:bg-violet-500 transition-colors hidden lg:block"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2">
            {!isCollapsed && (
              <h4 className="px-4 text-[10px] font-bold text-violet-400/60 uppercase tracking-widest font-mono">
                {group.name}
              </h4>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigateTo(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        active
                          ? "bg-violet-600/10 text-white shadow-[inset_0_0_12px_rgba(139,92,246,0.05)] border border-violet-500/20"
                          : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          active ? "text-violet-400" : "text-neutral-500 group-hover:text-neutral-300"
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="text-xs font-bold font-mono truncate">{item.label}</span>
                      )}
                      {active && (
                        <div className="absolute left-0 w-1 h-6 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-violet-900/10">
        <button
          onClick={() => navigateTo("/dashboard")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-violet-600/20 active:scale-95"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Return to App</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
