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

  const panelRequiredPaths = [
    "/ai-optimizer",
    "/panel-assistant",
    "/ai-voice",
  ];
  const requiresPanels = panelRequiredPaths.some(
    (path) =>
      currentPath === path ||
      currentPath.startsWith(path + "?") ||
      currentPath.startsWith(path + "/")
  );
  const hasActiveProject = Boolean(activeProjectData);
  const allowWithoutActiveProject =
    currentPath === "/creative-suite" ||
    currentPath === "/creative-suite/" ||
    currentPath === "/creative-suite-dashboard" ||
    !requiresPanels;
  const shouldShowFallbackUI = !hasActiveProject && !allowWithoutActiveProject;

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

  const FallbackUI = () => (
    <div className="flex-grow flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-[#0b0b0e] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 mb-6 shadow-lg shadow-purple-500/5">
          <Sparkles className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight mb-2">
          No Active Project Selected
        </h3>

        <p className="text-sm text-neutral-400 leading-relaxed font-sans mb-6">
          To use the Creative Suite tools (such as the Video Optimizer, Sound Lab, and Voice Studio), you must select and open a project from the Projects page first.
        </p>

        <button
          onClick={() => navigateTo("/projects")}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg shadow-purple-950/30 cursor-pointer border border-transparent"
        >
          Choose Project
        </button>
      </div>
    </div>
  );

  // Normalize sub-route path naming for breadcrumbs
  const getBreadcrumbName = () => {
    if (
      currentPath === "/creative-suite" ||
      currentPath === "/creative-suite/" ||
      currentPath === "/creative-suite-dashboard"
    ) {
      return "Overview Hub";
    }

    // Map paths directly to clean labels
    const pathMap: Record<string, string> = {
      "/ai-optimizer": "Video Optimizer",
      "/panel-assistant": "Panel Assistant",
      "/ai-thumbnails": "Thumbnail Studio",
      "/ai-analytics": "CTR Predictor",
      "/ai-voice": "Voice & Sound Studio",
      "/ai-characters": "Character Database",
      "/youtube": "YouTube Publisher",
    };

    return pathMap[currentPath] || currentPath.split("/").pop() || "Creative Suite";
  };

  const activeBreadcrumb = getBreadcrumbName();

  if (hideSidebarAndHeader) {
    return (
      <div className="flex-grow w-full px-6 py-6 md:px-8 md:py-8 flex flex-col min-h-full">
        {/* Standard layout header for all Creative Suite pages */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={() => navigateTo("/dashboard")}
              >
                Main Dashboard
              </span>
              <span>&gt;</span>
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={() => navigateTo("/creative-suite")}
              >
                Creative Suite
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">{activeBreadcrumb}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
              Creative Tools Workspace
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Access AI-assisted video editing, audio composition, translations, and publisher tools
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {activeSkillRequests > 0 && (
              <button
                onClick={() => window.__sonikomaAbortAllSkillRequests?.()}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/70 rounded-xl text-[11px] font-mono transition-all cursor-pointer font-bold shadow-md active:scale-95"
              >
                <Square className="h-3.5 w-3.5" />
                Stop generation
              </button>
            )}
            <button
              onClick={() => navigateTo("/dashboard")}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Main App
            </button>
          </div>
        </div>
        {shouldShowFallbackUI ? <FallbackUI /> : children}
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

            {/* Standard layout header for all Creative Suite pages */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
                  <span
                    className="hover:text-purple-400 cursor-pointer"
                    onClick={() => navigateTo("/dashboard")}
                  >
                    Main Dashboard
                  </span>
                  <span>&gt;</span>
                  <span
                    className="hover:text-purple-400 cursor-pointer"
                    onClick={() => navigateTo("/creative-suite")}
                  >
                    Creative Suite
                  </span>
                  <span>&gt;</span>
                  <span className="text-purple-400">{activeBreadcrumb}</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  Creative Tools Workspace
                </h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Access AI-assisted video editing, audio composition, translations, and publisher tools
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {activeSkillRequests > 0 && (
                  <button
                    onClick={() => window.__sonikomaAbortAllSkillRequests?.()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500/70 rounded-xl text-[11px] font-mono transition-all cursor-pointer font-bold shadow-md active:scale-95"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop generation
                  </button>
                )}
                <button
                  onClick={() => navigateTo("/dashboard")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md active:scale-95"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Main App
                </button>
              </div>
            </div>
            {shouldShowFallbackUI ? <FallbackUI /> : children}
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
