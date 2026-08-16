import React from "react";
import DashboardHeader from "@/features/app_dashboard/components/DashboardHeader";
import DashboardStats from "@/features/app_dashboard/components/DashboardStats";
import DashboardQuickLinks from "@/features/app_dashboard/components/DashboardQuickLinks";
import DashboardProjectSection from "@/features/app_dashboard/components/DashboardProjectSection";
import DashboardActivityFeed from "@/features/app_dashboard/components/DashboardActivityFeed";
import DashboardAIPipeline from "@/features/app_dashboard/components/DashboardAIPipeline";
import DashboardSidebar from "@/features/app_dashboard/components/DashboardSidebar";
import useDashboardPage, {
  Project,
} from "@/features/app_dashboard/hooks/useDashboardPage";

export default function DashboardPage() {
  const {
    themeMode,
    projects,
    loading,
    error,
    latency,
    analytics,
    metrics,
    searchQuery,
    setSearchQuery,
    onboardingTasks,
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

  return (
    <div className="w-full flex-1 flex flex-col text-neutral-100 animate-fade-in relative z-10 py-6 max-w-7xl mx-auto">
      <DashboardHeader
        themeMode={themeMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewSeries={handleNewSeries}
      />

      <DashboardStats
        projectsCount={projects.length}
        completedCount={completedCount}
        processingCount={processingCount}
        totalPanels={totalPanels}
      />

      <DashboardQuickLinks
        onGoToWorkspace={handleNewSeries}
        onGoToAudioLab={() =>
          (window as any).navigateTo?.("/creative-suite/ai-voice")
        }
        onGoToCharacters={() => (window as any).navigateTo?.("/characters")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
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

          <DashboardAIPipeline />
        </div>

        <div className="lg:col-span-4">
          <DashboardSidebar
            onboardingTasks={onboardingTasks}
            latency={latency}
            metrics={metrics}
            analytics={analytics}
            onNavigate={(path) => (window as any).navigateTo?.(path)}
          />
        </div>
      </div>
    </div>
  );
}
