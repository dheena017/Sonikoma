import React, { useState, useEffect } from "react";
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
  Menu,
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
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0a0e]/95 backdrop-blur-2xl border-r border-violet-900/20">
      {/* Sidebar Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-violet-900/10 relative">
        <div className={`flex items-center gap-3 transition-all ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>
          <div className="p-2.5 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/30 shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="shrink-0 whitespace-nowrap">
            <span className="font-black text-white tracking-tight block leading-tight">Command</span>
            <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest">Center</span>
          </div>
        </div>

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
          className="hidden lg:flex p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors absolute top-6"
          style={{
            left: isDesktopExpanded ? 'auto' : '15px',
            right: isDesktopExpanded ? '15px' : 'auto'
          }}
        >
          {isDesktopExpanded ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-8 px-5 space-y-9 scrollbar-hide">
        {groups.map((group) => (
          <div key={group.name} className="space-y-3">
            <h4 className={`px-4 text-[10px] font-black text-violet-400/40 uppercase tracking-[0.2em] font-mono transition-all ${!isDesktopExpanded ? "lg:opacity-0 lg:h-0 overflow-hidden" : ""}`}>
              {group.name}
            </h4>
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        navigateTo(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group relative ${
                        active
                          ? "bg-violet-600/15 text-white shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] border border-violet-500/30"
                          : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 transition-colors duration-300 ${
                          active ? "text-violet-400" : "text-neutral-500 group-hover:text-neutral-300"
                        }`}
                      />
                      <span className={`text-xs font-bold font-mono tracking-tight transition-all whitespace-nowrap ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>{item.label}</span>
                      {active && (
                        <div className="absolute left-0 w-1.5 h-6 bg-violet-500 rounded-r-full shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
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
      <div className="p-6 border-t border-violet-900/10 bg-violet-950/5">
        <button
          onClick={() => {
            navigateTo("/dashboard");
            onClose();
          }}
          className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black font-mono transition-all shadow-xl shadow-violet-600/20 active:scale-95 border border-violet-400/20 ${!isDesktopExpanded ? "lg:px-2 lg:py-3" : ""}`}
        >
          <ExternalLink className="w-5 h-5 shrink-0" />
          <span className={`transition-all whitespace-nowrap ${!isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""}`}>RETURN TO APP</span>
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (isDesktopExpanded) {
      document.body.style.overflow = "hidden";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "";
    };
  }, [isDesktopExpanded]);

  return (
    <>
      {/* Drawer backdrop for mobile and desktop overlay */}
      {(isOpen || isDesktopExpanded) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={() => {
            if (isOpen) onClose();
            if (isDesktopExpanded) setIsDesktopExpanded(false);
          }}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`transition-all duration-300 ease-out flex flex-col ${
          isOpen || isDesktopExpanded
            ? "fixed top-0 left-0 h-screen z-50 translate-x-0 shadow-2xl shadow-black/80 w-80"
            : "fixed lg:absolute inset-y-0 left-0 h-full z-50 -translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Placeholder to reserve space in document flow so main content doesn't jump */}
      <div className="hidden lg:block lg:w-20 lg:h-full lg:shrink-0 pointer-events-none" />
    </>
  );
};

export default AdminSidebar;
