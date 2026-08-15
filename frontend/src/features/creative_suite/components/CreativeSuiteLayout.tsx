import React, { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, Square } from "lucide-react";
import CreativeSuiteHeader from "@/features/creative_suite/components/CreativeSuiteHeader";
import CreativeSuiteMiniSidebar from "@/features/creative_suite/components/CreativeSuiteMiniSidebar";
import CreativeSuiteSidebar from "@/features/creative_suite/components/CreativeSuiteSidebar";
import { useProjectStore } from "@/store/useProjectStore";

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
    window.addEventListener("sonikoma-skill-request-count", updateActiveSkillRequests);

    return () => {
      window.removeEventListener("sonikoma-skill-request-count", updateActiveSkillRequests);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);



  // Normalize sub-route path naming for breadcrumbs
  const getBreadcrumbName = () => {
    if (
      currentPath === "/creative-suite" ||
      currentPath === "/creative-suite/" ||
      currentPath === "/creative-suite-dashboard"
    ) {
      return "Overview Hub";
    }

    const cleanPath = currentPath.split("?")[0];

    // Map paths directly to clean labels
    const pathMap: Record<string, string> = {
      "/creative-suite/ai-optimizer": "Video Optimizer",
      "/creative-suite/panel-assistant": "Panel Assistant",
      "/creative-suite/ai-thumbnails": "Thumbnail Studio",
      "/creative-suite/ai-analytics": "CTR Predictor",
      "/creative-suite/ai-voice": "Voice & Sound Studio",
      "/creative-suite/ai-characters": "Character Database",
      "/creative-suite/youtube": "YouTube Publisher",
      "/ai-optimizer": "Video Optimizer",
      "/panel-assistant": "Panel Assistant",
      "/ai-thumbnails": "Thumbnail Studio",
      "/ai-analytics": "CTR Predictor",
      "/ai-voice": "Voice & Sound Studio",
      "/ai-characters": "Character Database",
      "/youtube": "YouTube Publisher",
    };

    return pathMap[cleanPath] || cleanPath.split("/").pop() || "Creative Suite";
  };

  const activeBreadcrumb = getBreadcrumbName();

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900/80 pb-5 mb-6">
      <div className="space-y-2">
        {/* Breadcrumb pills */}
        <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
          <button
            onClick={() => navigateTo("/dashboard")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-purple-950/40 border border-neutral-800/80 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
          >
            <span>Main Dashboard</span>
          </button>
          <span className="text-neutral-600 font-bold">&rsaquo;</span>
          <button
            onClick={() => navigateTo("/creative-suite")}
            className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-purple-950/40 border border-neutral-800/80 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm"
          >
            <span>Creative Suite</span>
          </button>
          <span className="text-neutral-600 font-bold">&rsaquo;</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
            {activeBreadcrumb}
          </span>
        </div>

        {/* Title and subtitle */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="p-2.5 bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-500/10 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-sans">
              Creative Tools Workspace
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Access AI-assisted video editing, audio composition, translations, and publisher tools
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
        {activeSkillRequests > 0 && (
          <button
            onClick={() => window.__sonikomaAbortAllSkillRequests?.()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/70 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-rose-950/40 active:scale-95"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop Generation
          </button>
        )}
        <button
          onClick={() => navigateTo("/dashboard")}
          className="group flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-800/90 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md hover:shadow-lg active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Main App</span>
        </button>
      </div>
    </div>
  );

  const isOverviewHub =
    currentPath === "/creative-suite" ||
    currentPath === "/creative-suite/" ||
    currentPath === "/creative-suite-dashboard";

  if (hideSidebarAndHeader) {
    return (
      <div className="flex-grow w-full flex flex-col min-h-full">
        {!isOverviewHub && renderHeader()}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col selection:bg-purple-500/30">
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
        <main className="flex-1 px-6 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8">
          <div className="w-full animate-[fadeIn_0.3s_ease-out]">

            {renderHeader()}
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-neutral-900 text-center bg-[#070709]/40 mt-auto">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] font-mono">
            Sonikoma Creative Suite &bull; AI Powered Storyboard Pipeline
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CreativeSuiteLayout;
