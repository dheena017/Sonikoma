import React, { useEffect, useState } from "react";
import { Square } from "lucide-react";
import CreativeSuiteHeader from "@/features/creative_suite/components/CreativeSuiteHeader";
import CreativeSuiteMiniSidebar from "@/features/creative_suite/components/CreativeSuiteMiniSidebar";
import CreativeSuiteSidebar from "@/features/creative_suite/components/CreativeSuiteSidebar";
import { useProjectStore } from "@/shared/hooks/useProjectStore";

interface CreativeSuiteLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  panels?: any[];
  hideSidebarAndHeader?: boolean;
}

const CreativeSuiteLayout: React.FC<CreativeSuiteLayoutProps> = ({
  children,
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationsMuted,
  setNotificationsMuted,
  panels = [],
  hideSidebarAndHeader = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSkillRequests, setActiveSkillRequests] = useState(0);
  const activeProjectData = useProjectStore((state) => state.activeProjectData);
  const activePanels = activeProjectData?.panels ?? panels ?? [];

  useEffect(() => {
    const updateActiveSkillRequests = () => {
      setActiveSkillRequests(window.__sonikomaActiveSkillRequestCount?.() ?? 0);
    };

    updateActiveSkillRequests();
    window.addEventListener(
      "sonikoma-skill-request-count",
      updateActiveSkillRequests
    );

    return () => {
      window.removeEventListener(
        "sonikoma-skill-request-count",
        updateActiveSkillRequests
      );
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Creative Tools Workspace
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Access AI-assisted video editing, neural voice acting, translations, and publisher tools
        </p>
      </div>

      {activeSkillRequests > 0 && (
        <button
          type="button"
          onClick={() => window.__sonikomaAbortAllSkillRequests?.()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/70 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-rose-950/40 active:scale-95 self-start sm:self-center"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          Stop Generation
        </button>
      )}
    </div>
  );

  const isOverviewHub =
    currentPath === "/creative-suite" ||
    currentPath === "/creative-suite/" ||
    currentPath === "/creative-suite-dashboard";

  if (hideSidebarAndHeader) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col py-6">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] flex flex-col selection:bg-[#3B82F6]/30">
      <CreativeSuiteHeader
        currentPath={currentPath}
        navigateTo={navigateTo}
        fetchWithInterceptor={fetchWithInterceptor}
        onToggleSidebar={toggleSidebar}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
        deleteNotification={deleteNotification}
        clearAllNotifications={clearAllNotifications}
        notificationsMuted={notificationsMuted}
        setNotificationsMuted={setNotificationsMuted}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Mini Sidebar (always visible on desktop, handles active indicator) */}
      <CreativeSuiteMiniSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        panels={activePanels}
        onOpenSidebar={toggleSidebar}
      />

      {/* Sidebar drawer (collapsible drawer for mobile and expandable option) */}
      <CreativeSuiteSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        panels={activePanels}
      />

      {/* Main page offset container */}
      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
        <main className="flex-1 px-4 sm:px-6 pb-6 pt-4 md:px-8 md:pb-8">
          <div className="w-full animate-fade-in">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-[#2F2F2F] text-center bg-[#121212] mt-auto">
          <p className="text-[10px] text-[#6B7280] font-black uppercase tracking-[0.3em] font-mono">
            Sonikoma Creative Suite &bull; AI Powered Storyboard Pipeline
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CreativeSuiteLayout;
