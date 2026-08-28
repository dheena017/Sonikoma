import React, { useState } from "react";
import {
  Menu,
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
  Coins,
  Activity,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

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
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          path: "/admin",
        },
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
        { id: "jobs", label: "Background Jobs", icon: ActivitySquare, path: "/admin/jobs" },
        { id: "health", label: "Health", icon: Server, path: "/admin/health" },
        {
          id: "activity",
          label: "Audit Logs",
          icon: Activity,
          path: "/admin/activity",
        },
        { id: "usage", label: "Usage", icon: Cpu, path: "/admin/usage" },
      ],
    },
    {
      name: "Business",
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
        {
          id: "credits",
          label: "Credits",
          icon: Coins,
          path: "/admin/credits",
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
      return (
        currentPath === "/admin" ||
        currentPath === "/admin/" ||
        currentPath === "/admin-dashboard"
      );
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
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            active
              ? "h-5 bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.9)] opacity-100"
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
          aria-label={item.label}
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none"
        >
          {/* iOS squircle icon pill */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white scale-105"
                : "bg-[#18191f]/60 border border-white/5 text-neutral-400 group-hover:bg-[#23242c] group-hover:border-white/10 group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                active ? "text-white" : "text-neutral-400 group-hover:text-white"
              }`}
            />
          </div>
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);
  const [menuHover, setMenuHover] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-20 bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 hidden lg:flex flex-col items-center py-3 z-40 shadow-xl select-none overflow-hidden">
      {/* Top Sidebar Drawer Toggle Button */}
      {onOpenSidebar && (
        <div className="w-full flex justify-center pb-3 pt-0.5 border-b border-white/10 shrink-0">
          <button
            onClick={onOpenSidebar}
            onMouseEnter={(e) => {
              setMenuRect(e.currentTarget.getBoundingClientRect());
              setMenuHover(true);
            }}
            onMouseLeave={() => setMenuHover(false)}
            aria-label="Open Full Sidebar"
            className="w-11 h-11 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>
          <TooltipPortal
            text="Expand Sidebar"
            visible={menuHover}
            anchorRect={menuRect}
          />
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.6rem" : "0.2rem",
                marginBottom: "0.4rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
              )}
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Return to App Button */}
      <div className="mt-auto pt-3 flex justify-center w-full pb-2 border-t border-white/10 shrink-0">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={() => navigateTo("/dashboard")}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            aria-label="Return to App"
            className="w-11 h-11 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_28px_rgba(59,130,246,0.8)] active:scale-90 border border-[#60A5FA]/40 cursor-pointer flex items-center justify-center"
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
          </button>
          <TooltipPortal
            text="Return to App"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      </div>
    </aside>
  );
};

const AdminMiniSidebar = React.memo(AdminMiniSidebarInner);
export default AdminMiniSidebar;
