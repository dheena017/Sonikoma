import React from "react";
import DashboardHeader from "@/features/app_dashboard/components/DashboardHeader";
import DashboardStats from "@/features/app_dashboard/components/DashboardStats";
import DashboardQuickLinks from "@/features/app_dashboard/components/DashboardQuickLinks";
import DashboardProjectSection from "@/features/app_dashboard/components/DashboardProjectSection";
import DashboardActivityFeed from "@/features/app_dashboard/components/DashboardActivityFeed";
import DashboardSidebar from "@/features/app_dashboard/components/DashboardSidebar";
import useDashboardPage from "@/features/app_dashboard/hooks/useDashboardPage";

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
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-7 relative overflow-hidden text-left">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
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
    </div>
  );
}
