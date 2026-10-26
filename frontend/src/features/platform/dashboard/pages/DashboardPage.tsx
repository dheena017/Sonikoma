import React from "react";
import {
  DashboardHeader,
  DashboardStats,
  DashboardProjectSection,
  DashboardOnboardingGuide,
} from "../components";
import { useDashboardPage } from "../hooks";

export default function DashboardPage() {
  const {
    themeMode,
    projects,
    loading,
    error,
    searchQuery,
    onboardingTasks,
    openMenuId,
    renamingProjectId,
    filteredProjects,
    activeTab,
    setActiveTab,
    aiSeriesList,
    filteredAiSeries,
    loadingAiSeries,
    stats,
    handleRetry,
    handleNewSeries,
    handleOpenProject,
    handleOpenCreativeSuite,
    handleDeleteProject,
    handleDeleteAiSeries,
    handleExport,
    handleRename,
    toggleMenu,
    saveProjectName,
  } = useDashboardPage();

  return (
    <div className="w-full flex-1 flex flex-col text-[#E5E5E5] animate-fade-in relative z-10 py-4 sm:py-6 max-w-7xl mx-auto">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* 1. Header with CTAs */}
        <div className="relative z-10">
          <DashboardHeader
            themeMode={themeMode}
            onNewSeries={handleNewSeries}
          />
        </div>

        {/* 2. Top Metric Statistics Cards */}
        <div className="relative z-10">
          <DashboardStats stats={stats} loading={loading} />
        </div>

        {/* 3. Getting Started Pipeline Guide */}
        <div className="relative z-10">
          <DashboardOnboardingGuide
            tasks={onboardingTasks}
            onNewSeries={handleNewSeries}
          />
        </div>

        {/* 4. Recent Series Workspace (Normal Projects & AI Series tabs) */}
        <div className="relative z-10">
          <DashboardProjectSection
            themeMode={themeMode}
            loading={loading}
            error={error}
            projects={filteredProjects}
            hasProjects={projects.length > 0}
            searchQuery={searchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            aiSeriesList={aiSeriesList}
            filteredAiSeries={filteredAiSeries}
            loadingAiSeries={loadingAiSeries}
            openMenuId={openMenuId}
            renamingProjectId={renamingProjectId}
            onRetry={handleRetry}
            onNewSeries={handleNewSeries}
            onOpenProject={handleOpenProject}
            onRename={handleRename}
            onExport={handleExport}
            onOpenCreativeSuite={handleOpenCreativeSuite}
            onDelete={handleDeleteProject}
            onDeleteAiSeries={handleDeleteAiSeries}
            onToggleMenu={toggleMenu}
            onSaveRename={saveProjectName}
          />
        </div>
      </div>
    </div>
  );
}
