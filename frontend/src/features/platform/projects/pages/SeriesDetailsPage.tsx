import React from "react";
import { AlertCircle } from "lucide-react";
import { SeriesDetailsSkeleton } from "@/features/platform/projects/components/SeriesDetailsSkeleton";
import SeriesEditModal from "@/features/platform/projects/components/SeriesEditModal";
import SeriesDetailsHeader from "@/features/platform/projects/components/SeriesDetailsHeader";
import SeriesDetailsToolbar from "@/features/platform/projects/components/SeriesDetailsToolbar";
import SeriesDetailsChapters from "@/features/platform/projects/components/SeriesDetailsChapters";
import { useSeriesDetails } from "@/features/platform/projects/hooks/useSeriesDetails";

interface SeriesDetailsPageProps {
  onNavigateHome: () => void;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: typeof fetch;
}

export default function SeriesDetailsPage({
  onNavigateHome,
  navigateTo,
  fetchWithInterceptor,
}: SeriesDetailsPageProps) {
  const details = useSeriesDetails({
    navigateTo,
    fetchWithInterceptor,
  });

  const {
    series,
    setSeries,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    isSortOpen,
    setIsSortOpen,
    sortRef,
    viewMode,
    setViewMode,
    isFavorite,
    setIsFavorite,
    selectedProjectIds,
    isBatchMode,
    openMenuId,
    renamingProjectId,
    setRenamingProjectId,
    isEditModalOpen,
    setIsEditModalOpen,
    actions,
    filteredChapters,
    handleToggleMenu,
    handleSaveRename,
    handleNewChapter,
    handleSaveSeriesMetadata,
    toggleSelectChapter,
  } = details;

  if (loading) {
    return <SeriesDetailsSkeleton />;
  }

  const isInvalidSeries =
    !series ||
    error ||
    Boolean(
      series.title && series.title.toLowerCase().includes("connect error")
    );

  if (isInvalidSeries) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Unable to load this series
        </h3>
        <p className="text-neutral-400 mb-6 font-mono max-w-md text-center text-xs">
          {error}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => navigateTo("/projects")}
            className="px-6 py-2.5 bg-[#2A2A2A] hover:bg-[#333333] text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex-1 flex flex-col items-center justify-start py-4 sm:py-6 lg:py-8 animate-fade-in relative z-10 text-left">
      <div className="w-full max-w-7xl mx-auto rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        <section className="w-full space-y-7 text-left" aria-label="Series details">
          {/* Header & Meta Card */}
          <SeriesDetailsHeader
            series={series}
            isFavorite={isFavorite}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            onNavigateBack={() => navigateTo("/projects")}
            onNewChapter={handleNewChapter}
            onNavigateAudioStudio={() => navigateTo("/creative-suite")}
          />

          {/* Filter, Search, Sort & View Mode Toolbar */}
          <SeriesDetailsToolbar
            filteredCount={filteredChapters.length}
            totalCount={series.chapterCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            isSortOpen={isSortOpen}
            onToggleSortOpen={() => setIsSortOpen((prev) => !prev)}
            sortRef={sortRef}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Chapters Grid / List / Empty State */}
          <SeriesDetailsChapters
            chapters={filteredChapters}
            viewMode={viewMode}
            isBatchMode={isBatchMode}
            selectedProjectIds={selectedProjectIds}
            openMenuId={openMenuId}
            renamingProjectId={renamingProjectId}
            actions={actions}
            onToggleSelectChapter={toggleSelectChapter}
            onToggleMenu={handleToggleMenu}
            onSaveRename={handleSaveRename}
            onSetRenamingProjectId={setRenamingProjectId}
            onChapterDeleted={(pid) => {
              setSeries((prev) =>
                prev
                  ? {
                      ...prev,
                      chapters: prev.chapters.filter((c) => c.project_id !== pid),
                    }
                  : null
              );
            }}
            onNewChapter={handleNewChapter}
          />

          {/* Modals */}
          <SeriesEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            series={{
              id: series.id,
              slug: series.slug,
              title: series.title,
              author: series.author,
              genre: series.genre,
              synopsis: series.synopsis,
              cover: series.cover,
            }}
            onSave={handleSaveSeriesMetadata}
          />
        </section>
      </div>
    </div>
  );
}
