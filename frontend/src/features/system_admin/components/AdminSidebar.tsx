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
  Coins,
  Activity,
} from "lucide-react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

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
        { id: "jobs", label: "Background Jobs", icon: Activity, path: "/admin/jobs" },
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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#121212] border-r border-[#2F2F2F] shadow-2xl">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#2F2F2F] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0 rounded-full border border-[#2F2F2F] p-0.5 bg-[#1E1E1E]">
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="h-10 w-10 rounded-full shrink-0 object-cover bg-black"
              alt="Sonikoma Logo"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-[#E5E5E5] font-sans">
                Command Center
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded-md font-mono">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] font-sans tracking-wide">
              System Infrastructure
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
          title="Close admin drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-1">
            {groupIdx > 0 && (
              <div className="w-full h-px bg-neutral-800/60 my-2.5" />
            )}
            <h4 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.16em] font-sans mb-1">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.id} className="relative">
                    {/* Active Left Indicator Pill */}
                    {active && (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-purple-400 z-10" />
                    )}

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold font-sans transition-all duration-150 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-purple-500/15 text-white border border-purple-500/30"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent"
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                          active
                            ? "text-purple-300"
                            : "text-neutral-400 group-hover:text-purple-300"
                        }`}
                      />
                      <span className="truncate">
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
      <div className="p-4 border-t border-neutral-800/60 space-y-2">
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-neutral-900 hover:bg-purple-600/20 text-neutral-300 hover:text-purple-200 border border-neutral-800 hover:border-purple-500/40 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>RETURN TO APP</span>
        </button>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Infrastructure OK
          </span>
          <span className="font-mono text-neutral-400 text-[10px]">Admin</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-[280px] sm:w-[320px] bg-neutral-950/85 backdrop-blur-2xl border-r border-white/10 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
          isOpen
            ? "translate-x-0 shadow-[10px_0_40px_rgba(0,0,0,0.8)]"
            : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
