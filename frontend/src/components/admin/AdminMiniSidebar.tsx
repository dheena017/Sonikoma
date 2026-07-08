import React, { useState } from "react";
import {
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
  Shield,
} from "lucide-react";
import TooltipPortal from "../TooltipPortal";

interface AdminMiniSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  onOpenSidebar?: () => void;
}

const AdminMiniSidebarInner: React.FC<AdminMiniSidebarProps> = ({
  currentPath,
  navigateTo,
  onOpenSidebar,
}) => {
  const groups = [
    {
      name: "Core",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/admin" },
        {
          id: "announcements",
          label: "Announcements",
          icon: Mail,
          path: "/admin/announcements",
        },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        {
          id: "content",
          label: "Content",
          icon: FolderGit2,
          path: "/admin/content",
        },
      ],
    },
    {
      name: "Monitoring",
      items: [
        { id: "health", label: "Health", icon: Server, path: "/admin/health" },
        {
          id: "activity",
          label: "Audit Logs",
          icon: ActivitySquare,
          path: "/admin/activity",
        },
        { id: "usage", label: "Usage", icon: Cpu, path: "/admin/usage" },
      ],
    },
    {
      name: "Business & Data",
      items: [
        {
          id: "finance",
          label: "Finance",
          icon: DollarSign,
          path: "/admin/finance",
        },
        {
          id: "scrapers",
          label: "Scrapers",
          icon: Globe,
          path: "/admin/scrapers",
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: BarChart3,
          path: "/admin/analytics",
        },
      ],
    },
    {
      name: "Technical",
      items: [
        {
          id: "explorer",
          label: "Explorer",
          icon: Database,
          path: "/admin/explorer",
        },
        {
          id: "console",
          label: "Console",
          icon: Terminal,
          path: "/admin/console",
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/admin/settings",
        },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin" || currentPath === "/admin/";
    }
    if (path === "/admin-dashboard") {
      return currentPath === "/admin-dashboard";
    }
    return currentPath.startsWith(path);
  };

  const SidebarItem: React.FC<{ item: any }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 ${
            active
              ? "h-5 bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => navigateTo(item.path)}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95"
        >
          {/* iOS-style icon pill */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              active
                ? "bg-violet-500/20 border border-violet-500/40 shadow-[0_0_14px_rgba(139,92,246,0.25)]"
                : "bg-neutral-800 border border-neutral-700 group-hover:bg-violet-500/10 group-hover:border-violet-500/20"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                active ? "text-violet-400" : "text-neutral-400 group-hover:text-violet-300"
              }`}
            />
          </div>
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    // Fixed below the header, hidden scrollbars, premium glassmorphism
    <aside className="fixed top-[59px] bottom-0 left-0 w-20 bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 hidden lg:flex flex-col items-center py-4 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-2"
          >
            {/* Soft, premium gradient dot separator between groups */}
            {groupIdx > 0 && (
              <div className="w-1 h-1 rounded-full bg-violet-900/50 shadow-[0_0_4px_rgba(139,92,246,0.3)] my-2" />
            )}

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to App Button */}
      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-800/60">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            className="p-3 rounded-2xl bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-400 hover:to-violet-600 text-white transition-all shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.6)] active:scale-90 border border-violet-400/30 cursor-pointer"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>

          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-x-2 group-hover:translate-x-0 bg-neutral-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-medium tracking-wide">
            Return to App
          </div>
        </div>
      </div>
    </aside>
  );
};

const AdminMiniSidebar = React.memo(AdminMiniSidebarInner);
export default AdminMiniSidebar;
