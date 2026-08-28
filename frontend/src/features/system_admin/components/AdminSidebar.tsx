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
  ArrowLeft,
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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const groups = [
    {
      name: "Core Infrastructure",
      items: [
        {
          id: "dashboard",
          label: "Root Dashboard",
          icon: LayoutGrid,
          path: "/admin",
        },
        {
          id: "announcements",
          label: "Announcements & Alerts",
          icon: Mail,
          path: "/admin/announcements",
        },
        { id: "users", label: "User Accounts", icon: Users, path: "/admin/users" },
        {
          id: "content",
          label: "Content Moderation",
          icon: FolderGit2,
          path: "/admin/content",
        },
      ],
    },
    {
      name: "Workers & Telemetry",
      items: [
        { id: "jobs", label: "Background Jobs", icon: Cpu, path: "/admin/jobs" },
        {
          id: "scrapers",
          label: "Scraper Workers",
          icon: Globe,
          path: "/admin/scrapers",
        },
        {
          id: "health",
          label: "Node & Host Health",
          icon: Server,
          path: "/admin/health",
        },
        {
          id: "activity",
          label: "Audit Logs",
          icon: Activity,
          path: "/admin/activity",
        },
      ],
    },
    {
      name: "Financials & Analytics",
      items: [
        {
          id: "analytics",
          label: "Platform Growth",
          icon: BarChart3,
          path: "/admin/analytics",
        },
        {
          id: "credits",
          label: "Credits Ledger",
          icon: Coins,
          path: "/admin/credits",
        },
        {
          id: "finance",
          label: "Revenue & MRR",
          icon: DollarSign,
          path: "/admin/finance",
        },
        {
          id: "usage",
          label: "Quota Limits",
          icon: ActivitySquare,
          path: "/admin/usage",
        },
      ],
    },
    {
      name: "System Tools",
      items: [
        {
          id: "explorer",
          label: "Database Explorer",
          icon: Database,
          path: "/admin/explorer",
        },
        {
          id: "console",
          label: "Server Shell & Logs",
          icon: Terminal,
          path: "/admin/console",
        },
        {
          id: "settings",
          label: "Global Settings",
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
    <div className="flex h-full flex-col bg-[#0d0d12]/95 backdrop-blur-3xl border-r border-white/10 shadow-[8px_0_32px_rgba(0,0,0,0.6)]">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 rounded-full border border-purple-500/30 p-0.5 bg-[#18191e] shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="h-9 w-9 rounded-full shrink-0 object-cover bg-black"
              alt="Sonikoma Logo"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white font-sans">
                Command Center
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-md font-mono">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
              System Infrastructure
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
          title="Close admin drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-2">
            {groupIdx > 0 && (
              <div className="w-full flex flex-col pt-1 pb-1">
                <div className="w-8 h-[1px] bg-white/10 rounded-full ml-3" />
              </div>
            )}
            <h4 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">
              {group.name}
            </h4>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.id} className="relative">
                    {/* Active Side Accent Indicator */}
                    <div
                      className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                        active
                          ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
                          : "h-0 bg-transparent opacity-0"
                      }`}
                    />

                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group relative cursor-pointer active:scale-[0.98] ${
                        active
                          ? "bg-purple-600/15 text-white shadow-[inset_0_0_16px_rgba(168,85,247,0.12)] border border-purple-500/30 font-bold"
                          : "text-neutral-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            active
                              ? "text-purple-400"
                              : "text-neutral-400 group-hover:scale-110 group-hover:text-purple-300"
                          }`}
                        />
                        <span className="text-xs font-semibold tracking-wide font-sans truncate">
                          {item.label}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Return to App */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.45)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65)] active:scale-95 border border-purple-400/40 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>RETURN TO APP</span>
        </button>
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
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
        className={`fixed top-0 bottom-0 left-0 h-screen w-[280px] sm:w-[320px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
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
