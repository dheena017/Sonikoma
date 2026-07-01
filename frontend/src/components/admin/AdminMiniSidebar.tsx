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
  ExternalLink,
  Menu,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode.js";
import TooltipPortal from "../TooltipPortal";
import { useState } from "react";

interface AdminMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  onOpenSidebar: () => void;
}

const AdminMiniSidebarInner: React.FC<AdminMiniSidebarProps> = ({
  currentPath,
  navigateTo,
  onOpenSidebar,
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

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center">
        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className={`p-3 rounded-xl transition-all duration-300 relative flex items-center justify-center ${
            active
              ? "bg-violet-600/15 text-white shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] border border-violet-500/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Icon
            className={`w-5 h-5 transition-colors duration-300 ${
              active ? "text-violet-400" : "text-neutral-500 group-hover:text-neutral-300"
            }`}
          />
          {active && (
            <div className="absolute left-0 w-1 h-6 bg-violet-500 rounded-r-full shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    <aside className="fixed top-16 bottom-4 left-4 w-20 bg-[#0a0a0e] border border-violet-900/20 rounded-3xl shadow-2xl hidden lg:flex flex-col items-center py-5 z-40">
      {/* Brand Icon / Expand Sidebar */}
      <div className="mb-8 flex flex-col gap-4 items-center">
        <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/30">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          title="Expand Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex-1 w-full overflow-y-auto hide-scrollbar mini-sidebar-scrollbar flex flex-col items-center space-y-6 pt-6"
        style={{ scrollbarGutter: "stable" }}
      >
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center space-y-3">
            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
            {groupIdx < groups.length - 1 && (
              <div className="w-6 h-px bg-violet-900/10 my-2" />
            )}
          </div>
        ))}
      </div>

      {/* Footer Return Button */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-6">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-xl shadow-violet-600/20 active:scale-95 border border-violet-400/20"
          >
            <ExternalLink className="w-5 h-5 shrink-0" />
          </button>
          {/* Tooltip on hover */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-violet-950 border border-violet-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-xl font-mono">
            Return to App
          </div>
        </div>
      </div>
    </aside>
  );
};

const AdminMiniSidebar = React.memo(AdminMiniSidebarInner);
export default AdminMiniSidebar;
