import React from "react";
import DashboardHeader from "@/features/app_dashboard/components/DashboardHeader";
import DashboardStats from "@/features/app_dashboard/components/DashboardStats";
import DashboardQuickLinks from "@/features/app_dashboard/components/DashboardQuickLinks";
import DashboardProjectSection from "@/features/app_dashboard/components/DashboardProjectSection";
import DashboardActivityFeed from "@/features/app_dashboard/components/DashboardActivityFeed";
import useDashboardPage from "@/features/app_dashboard/hooks/useDashboardPage";

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

  return (
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#263934] bg-gradient-to-b from-[#17221f] via-[#111a18] to-[#0b1210] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
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
    </div>
  );
}
