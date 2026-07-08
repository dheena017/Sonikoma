import React, { useEffect } from "react";
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
  X,
  ExternalLink,
} from "lucide-react";
import { useThemeMode } from "../../hooks/useThemeMode";

interface AdminSidebarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  navigateTo,
  isOpen,
  onClose,
}) => {
  const { themeMode } = useThemeMode();

  // PREMIUM SCROLL LOCK FIX:
  // This hook locks the body scroll when the sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = ""; // Resets to default
    }

    // Cleanup function in case the component unmounts while open
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
      return currentPath === "/admin" || currentPath === "/admin/" || currentPath === "/admin-dashboard";
    }
    return currentPath.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-950 backdrop-blur-3xl border-r border-neutral-800 shadow-[8px_0_32px_rgba(0,0,0,0.4)]">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-violet-600 rounded-lg shadow-lg shadow-violet-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-neutral-100 tracking-tight block leading-none text-sm">
              Command
            </span>
            <span className="text-[9px] text-violet-400 font-mono uppercase tracking-widest block mt-0.5 leading-none">
              Center
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-all cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2.5">
            <h4 className="px-3 text-[10px] font-black text-violet-400/50 uppercase tracking-[0.25em] font-mono">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.id} className="relative">
                    {/* Premium Floating Active Pill */}
                    <div
                      className={`absolute left-2 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-violet-500/10 text-neutral-100 shadow-[inset_0_0_16px_rgba(139,92,246,0.1)] border border-violet-500/20"
                          : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                      }`}
                    >
                      <item.icon
                        className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                          active
                            ? "text-violet-400"
                            : "text-neutral-500 group-hover:scale-110 group-hover:text-neutral-400"
                        }`}
                      />
                      <span className="text-sm font-bold tracking-wide">
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="p-5 border-t border-neutral-800/60">
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-xs font-black tracking-widest transition-all shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] active:scale-95 border border-violet-400/30 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>RETURN TO APP</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-[280px] sm:w-[320px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
