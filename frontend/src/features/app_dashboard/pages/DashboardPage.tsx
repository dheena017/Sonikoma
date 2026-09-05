import React from "react";
import DashboardHeader from "@/features/app_dashboard/components/DashboardHeader";
import DashboardStats from "@/features/app_dashboard/components/DashboardStats";
import DashboardQuickLinks from "@/features/app_dashboard/components/DashboardQuickLinks";
import DashboardProjectSection from "@/features/app_dashboard/components/DashboardProjectSection";
import DashboardActivityFeed from "@/features/app_dashboard/components/DashboardActivityFeed";
import useDashboardPage from "@/features/app_dashboard/hooks/useDashboardPage";
import { WelcomeUserModal, WelcomeBackUserModal, ComeBackUserModal } from "@/shared/ui/modal";

export default function DashboardPage() {
  const {
    themeMode,
    projects,
    loading,
    error,
    analytics,
    searchQuery,
    setSearchQuery,
    openMenuId,
    renamingProjectId,
    filteredProjects,
    completedCount,
    processingCount,
    totalPanels,
    handleRetry,
    handleNewSeries,
    handleOpenProject,
    handleOpenCreativeSuite,
    handleDeleteProject,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  } = useDashboardPage();

  const [showWelcomeUser, setShowWelcomeUser] = React.useState(() => {
    return sessionStorage.getItem("sonikoma_show_welcome_user") === "true";
  });

  const [showWelcomeBack, setShowWelcomeBack] = React.useState(() => {
    return sessionStorage.getItem("sonikoma_show_welcome_back") === "true";
  });

  React.useEffect(() => {
    const isNew = sessionStorage.getItem("sonikoma_show_welcome_user") === "true";
    const isBack = sessionStorage.getItem("sonikoma_show_welcome_back") === "true";

    if (isNew) {
      setShowWelcomeUser(true);
      setShowWelcomeBack(false);
    } else if (isBack) {
      setShowWelcomeBack(true);
      setShowWelcomeUser(false);
    }
  }, []);

  const [showComeBack, setShowComeBack] = React.useState(() => {
    const isReturning = localStorage.getItem("sonikoma_returning_user") === "true";
    const alreadyShown = sessionStorage.getItem("sonikoma_comeback_shown") === "true";
    return isReturning && !alreadyShown && !showWelcomeUser && !showWelcomeBack;
  });

  const handleConfirmWelcomeUser = () => {
    sessionStorage.removeItem("sonikoma_show_welcome_user");
    setShowWelcomeUser(false);
  };

  const handleConfirmWelcomeBack = () => {
    sessionStorage.removeItem("sonikoma_show_welcome_back");
    setShowWelcomeBack(false);
  };

  const handleConfirmComeBack = () => {
    sessionStorage.setItem("sonikoma_comeback_shown", "true");
    setShowComeBack(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        <div className="relative z-10">
          <DashboardHeader
            themeMode={themeMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewSeries={handleNewSeries}
          />
        </div>

        <div className="relative z-10">
          <DashboardStats
            projectsCount={projects.length}
            completedCount={completedCount}
            processingCount={processingCount}
            totalPanels={totalPanels}
            loading={loading}
          />
        </div>

        <div className="relative z-10">
          <DashboardQuickLinks
            onGoToWorkspace={handleNewSeries}
            onGoToAudioLab={() =>
              (window as any).navigateTo?.("/creative-suite/ai-voice")
            }
            onGoToCharacters={() => (window as any).navigateTo?.("/characters")}
          />
        </div>

        {/* ── MAIN CONTENT WORKSPACE (PROJECTS & RECENT PRODUCTION FEED) ── */}
        <div className="space-y-10 relative z-10">
          <DashboardProjectSection
            themeMode={themeMode}
            loading={loading}
            error={error}
            projects={projects}
            searchQuery={searchQuery}
            filteredProjects={filteredProjects}
            openMenuId={openMenuId}
            renamingProjectId={renamingProjectId}
            onRetry={handleRetry}
            onNewSeries={handleNewSeries}
            onOpenProject={handleOpenProject}
            onRename={handleRename}
            onExport={handleExport}
            onOpenCreativeSuite={handleOpenCreativeSuite}
            onDelete={handleDeleteProject}
            onToggleMenu={toggleMenu}
            onSaveRename={saveProjectName}
          />

          <DashboardActivityFeed analytics={analytics} />
        </div>
      </div>

      {/* New User Welcome Onboarding Modal */}
      <WelcomeUserModal
        isOpen={showWelcomeUser}
        onConfirm={handleConfirmWelcomeUser}
        onCancel={handleConfirmWelcomeUser}
      />

      {/* Returning User Welcome Back Login Modal */}
      <WelcomeBackUserModal
        isOpen={showWelcomeBack}
        onConfirm={handleConfirmWelcomeBack}
        onCancel={handleConfirmWelcomeBack}
      />

      {/* Come Back User Re-engagement Modal */}
      <ComeBackUserModal
        isOpen={showComeBack}
        onConfirm={handleConfirmComeBack}
        onCancel={() => {
          sessionStorage.setItem("sonikoma_comeback_shown", "true");
          setShowComeBack(false);
        }}
      />
    </div>
  );
}
