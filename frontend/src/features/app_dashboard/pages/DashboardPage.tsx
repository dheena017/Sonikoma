import React from "react";
import DashboardHeader from "@/features/app_dashboard/components/DashboardHeader";
import DashboardStats from "@/features/app_dashboard/components/DashboardStats";
import DashboardQuickLinks from "@/features/app_dashboard/components/DashboardQuickLinks";
import DashboardProjectSection from "@/features/app_dashboard/components/DashboardProjectSection";
import DashboardActivityFeed from "@/features/app_dashboard/components/DashboardActivityFeed";
import useDashboardPage from "@/features/app_dashboard/hooks/useDashboardPage";
import {
  WelcomeUserModal,
  WelcomeBackUserModal,
  ComeBackUserModal,
} from "@/shared/ui/modal";
import CreateSeriesModal from "@/features/editor_series/components/CreateSeriesModal";

export default function DashboardPage() {
  const [isCreateSeriesModalOpen, setIsCreateSeriesModalOpen] = React.useState(false);
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
    const isNew =
      sessionStorage.getItem("sonikoma_show_welcome_user") === "true";
    const isBack =
      sessionStorage.getItem("sonikoma_show_welcome_back") === "true";

    if (isNew) {
      setShowWelcomeUser(true);
      setShowWelcomeBack(false);
    } else if (isBack) {
      setShowWelcomeBack(true);
      setShowWelcomeUser(false);
    }
  }, []);

  const [showComeBack, setShowComeBack] = React.useState(() => {
    const isReturning =
      localStorage.getItem("sonikoma_returning_user") === "true";
    const alreadyShown =
      sessionStorage.getItem("sonikoma_comeback_shown") === "true";
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
    <div className="w-full min-w-0 flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-6 sm:py-8 max-w-7xl mx-auto">
      <main className="w-full space-y-8 text-left">
        <DashboardHeader
          themeMode={themeMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewSeries={() => setIsCreateSeriesModalOpen(true)}
        />

        <DashboardStats
          projectsCount={projects.length}
          completedCount={completedCount}
          processingCount={processingCount}
          totalPanels={totalPanels}
          loading={loading}
        />

        <DashboardQuickLinks
          onGoToAudioLab={() =>
            (window as any).navigateTo?.("/creative-suite/ai-voice")
          }
          onGoToPanelAssistant={() =>
            (window as any).navigateTo?.("/creative-suite/panel-assistant")
          }
          onGoToVideoOptimizer={() =>
            (window as any).navigateTo?.("/creative-suite/ai-optimizer")
          }
        />

        <div className="space-y-8">
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
            onNewSeries={() => setIsCreateSeriesModalOpen(true)}
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
      </main>

      {/* AI Multi-Chapter Series Studio Modal */}
      <CreateSeriesModal
        isOpen={isCreateSeriesModalOpen}
        onClose={() => setIsCreateSeriesModalOpen(false)}
      />

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
