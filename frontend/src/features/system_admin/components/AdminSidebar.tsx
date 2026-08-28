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
          className="w-9 h-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
          title="Close admin drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="space-y-2.5">
            {groupIdx > 0 && (
              <div className="w-full flex flex-col pt-1">
                <div className="w-8 h-[1px] bg-neutral-800 rounded-full mb-2 ml-3" />
              </div>
            )}
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
                          ? "h-5 bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
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
                          ? "bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 text-white shadow-[0_4px_20px_rgba(168,85,247,0.2)] border border-purple-500/40 font-bold"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent hover:border-neutral-800/60"
                      }`}
                    >
                      <item.icon
                        className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 ${
                          active
                            ? "text-purple-300"
                            : "text-neutral-400 group-hover:scale-110 group-hover:text-purple-300"
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
