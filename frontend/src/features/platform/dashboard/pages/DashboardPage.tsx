import React from "react";
import DashboardHeader from "@/features/platform/dashboard/components/DashboardHeader";
import DashboardStats from "@/features/platform/dashboard/components/DashboardStats";
import DashboardQuickIngest from "@/features/platform/dashboard/components/DashboardQuickIngest";
import DashboardOnboardingGuide from "@/features/platform/dashboard/components/DashboardOnboardingGuide";
import DashboardProjectSection from "@/features/platform/dashboard/components/DashboardProjectSection";
import useDashboardPage from "@/features/platform/dashboard/hooks/useDashboardPage";

export default function DashboardPage() {
  const {
    themeMode,
    projects,
    loading,
    error,
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
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* 1. Header with Search and CTAs */}
        <div className="relative z-10">
          <DashboardHeader
            themeMode={themeMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewSeries={handleNewSeries}
          />
        </div>

        {/* 2. Top Metric Statistics Cards */}
        <div className="relative z-10">
          <DashboardStats
            projectsCount={projects.length}
            completedCount={completedCount}
            processingCount={processingCount}
            totalPanels={totalPanels}
            loading={loading}
          />
        </div>

        {/* 3. Direct Chapter & Strip URL Ingestion Bar */}
        <div className="relative z-10">
          <DashboardQuickIngest />
        </div>

        {/* 4. Recent Series Workspace (Normal Projects & AI Series tabs) */}
        <div className="relative z-10">
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
        </div>

        {/* 5. Getting Started Checklist (Only for new creators with no active projects) */}
        {!loading && projects.length === 0 && (
          <div className="relative z-10">
            <DashboardOnboardingGuide
              tasks={onboardingTasks}
              onNewSeries={handleNewSeries}
            />
          </div>
        )}
      </div>
    </div>
  );
}
