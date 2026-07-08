import React, { useState } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import CreativeSuiteHeader from "./CreativeSuiteHeader";
import CreativeSuiteMiniSidebar from "./CreativeSuiteMiniSidebar";
import CreativeSuiteSidebar from "./CreativeSuiteSidebar";

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
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    
    // Map paths directly to clean labels
    const pathMap: Record<string, string> = {
      "/ai-optimizer": "Video Optimizer",
      "/panel-assistant": "Panel Assistant",
      "/ai-thumbnails": "Thumbnail Studio",
      "/ai-analytics": "CTR Predictor",
      "/ai-audio-lab": "Sound Design Lab",
      "/ai-voice": "Voice Studio",
      "/ai-characters": "Character Database",
      "/ai-translation": "Translation Studio",
      "/ai-engagement": "Community Coach",
      "/youtube": "YouTube Publisher",
    };
    
    return pathMap[currentPath] || currentPath.split("/").pop() || "Creative Suite";
  };

  const activeBreadcrumb = getBreadcrumbName();

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col selection:bg-purple-500/30">
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
        panels={panels}
        onOpenSidebar={toggleSidebar}
      />

      {/* Sidebar drawer (collapsible drawer for mobile and expandable option) */}
      <CreativeSuiteSidebar
        currentPath={currentPath}
        navigateTo={navigateTo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        panels={panels}
      />

      {/* Main page offset container */}
      <div className="flex-1 flex flex-col pt-16 lg:pl-20 min-h-screen transition-all duration-300">
        <main className="flex-1 px-6 pb-6 pt-0 md:px-8 md:pb-8 md:pt-0">
          <div className="max-w-7xl mx-auto animate-[fadeIn_0.3s_ease-out]">
            
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

              <button
                onClick={() => navigateTo("/dashboard")}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-md self-start sm:self-center active:scale-95"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Main App
              </button>
            </div>
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-purple-900/10 text-center bg-[#0a0a0e]/40 mt-auto">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] font-mono">
            Sonikoma Creative Suite &bull; AI Powered Storyboard Pipeline
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CreativeSuiteLayout;
