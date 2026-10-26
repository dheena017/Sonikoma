import React, { useEffect, useState, useMemo } from "react";
import { ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import * as api from "@/shared/api";
import {
  AdminActivityPage,
  AdminAnalyticsPage,
  AdminAnnouncementsPage,
  AdminConsolePage,
  AdminContentPage,
  AdminCreditsPage,
  AdminExplorerPage,
  AdminFinancePage,
  AdminHealthPage,
  AdminJobsPage,
  AdminScrapersPage,
  AdminSettingsPage,
  AdminTrainingPage,
  AdminUsagePage,
  AdminUsersPage,
} from "./index";
import AdminDashboardPage from "./AdminDashboardPage";
import { isUserAdmin, selfPromoteToAdmin } from "../utils/adminAuth";
import { getTabMetadata } from "../utils/adminConstants";

export interface AdminPageProps {
  user?: any;
  navigateTo: (path: string) => void;
  currentPath: string;
  isAuthenticated: boolean;
  fetchWithInterceptor: (
    url: string,
    options?: RequestInit
  ) => Promise<Response>;
  addNotification?: any;
  audioFeedback?: any;
}

const AdminPage = React.memo(
  ({
    user,
    navigateTo,
    currentPath,
    isAuthenticated,
    fetchWithInterceptor,
    addNotification,
    audioFeedback,
  }: AdminPageProps) => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const activeSection = useMemo(() => {
      if (currentPath === "/admin" || currentPath === "/admin/")
        return "overview";
      return currentPath.split("/").pop() || "overview";
    }, [currentPath]);

    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await api.adminGetAnalytics(fetchWithInterceptor);
        if (data.success) setAnalytics(data.analytics);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    useEffect(() => {
      if (isAuthenticated) {
        fetchAnalytics();
      }
    }, [isAuthenticated, fetchWithInterceptor]);

    useEffect(() => {
      if (
        activeSection === "analytics" ||
        activeSection === "finance" ||
        activeSection === "usage"
      ) {
        fetchAnalytics();
      }
    }, [activeSection]);

    // High-end "Access Denied" security screen
    const userIsAdmin = isUserAdmin(user);
    if (!isAuthenticated || (user && !userIsAdmin)) {
      return (
        <div className="fixed inset-0 z-50 w-full h-full bg-[#050507] flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-[#050507] to-[#050507] pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-[#0a0a0e]/80 backdrop-blur-xl border border-rose-900/30 p-8 rounded-3xl shadow-2xl text-center animate-[fadeIn_0.4s_ease-out]">
            <div className="w-20 h-20 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-rose-500/20 shadow-[inset_0_0_20px_rgba(244,63,94,0.2)]">
              <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" /> Access Restricted
            </h2>

            <p className="text-neutral-400 mt-3 text-sm leading-relaxed">
              You are attempting to access a secured administrative zone. Valid
              high-level authorization is required.
            </p>

            <div className="mt-8 pt-6 border-t border-rose-900/20 space-y-3">
              <button
                onClick={() => navigateTo("/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Safety
              </button>
              <button
                onClick={async () => {
                  const success = await selfPromoteToAdmin();
                  if (success) {
                    window.location.reload();
                  } else {
                    alert("Failed to self-promote to admin");
                  }
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                🛡️ Self-Promote to Admin (Dev Bypass)
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isOverview = activeSection === "overview";
    const sectionInfo = getTabMetadata(activeSection);

    const renderActivePage = () => {
      switch (activeSection) {
        case "overview":
          return (
            <AdminDashboardPage
              user={user}
              navigateTo={navigateTo}
              isAuthenticated={isAuthenticated}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              audioFeedback={audioFeedback}
              isTab={true}
            />
          );
        case "announcements":
          return (
            <AdminAnnouncementsPage
              fetchWithInterceptor={fetchWithInterceptor}
            />
          );
        case "users":
          return (
            <AdminUsersPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "credits":
          return (
            <AdminCreditsPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "content":
          return (
            <AdminContentPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "usage":
          return (
            <AdminUsagePage
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          );
        case "scrapers":
          return (
            <AdminScrapersPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "jobs":
          return (
            <AdminJobsPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "finance":
          return (
            <AdminFinancePage
              fetchWithInterceptor={fetchWithInterceptor}
              analytics={analytics}
            />
          );
        case "analytics":
          return (
            <AdminAnalyticsPage
              fetchWithInterceptor={fetchWithInterceptor}
            />
          );
        case "console":
          return <AdminConsolePage />;
        case "settings":
          return (
            <AdminSettingsPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        case "health":
          return <AdminHealthPage fetchWithInterceptor={fetchWithInterceptor} />;
        case "activity":
          return (
            <AdminActivityPage fetchWithInterceptor={fetchWithInterceptor} />
          );
        case "explorer":
          return (
            <AdminExplorerPage fetchWithInterceptor={fetchWithInterceptor} />
          );
        case "training":
          return (
            <AdminTrainingPage
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
            />
          );
        default:
          return (
            <AdminDashboardPage
              user={user}
              navigateTo={navigateTo}
              isAuthenticated={isAuthenticated}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={addNotification}
              audioFeedback={audioFeedback}
              isTab={true}
            />
          );
      }
    };

    return (
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-6 animate-fade-in relative z-10 text-left">
        {isOverview ? (
          renderActivePage()
        ) : (
          <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-7 relative overflow-hidden text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2F2F2F] pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#E5E5E5] tracking-tight">
                  {sectionInfo.title}
                </h1>
                <p className="text-xs text-[#9CA3AF] font-sans mt-1">
                  {sectionInfo.desc}
                </p>
              </div>
            </div>
            {renderActivePage()}
          </div>
        )}
      </div>
    );
  }
);

export default AdminPage;
