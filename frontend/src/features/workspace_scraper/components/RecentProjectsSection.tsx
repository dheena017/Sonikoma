import React from "react";
import {
  History,
  Search,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpenCheck,
  Plus,
} from "lucide-react";
import ProjectCard from "@/features/workspace_projects/components/ProjectCard";
import { ProjectCardSkeleton } from "@/shared/ui/loading";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";

interface StoredProject {
  imported_assets_count: number;
  project_id: string;
  url?: string;
  series_slug?: string | null;
  chapter_slug?: string | null;
  title?: string;
  genre?: string;
  author?: string;
  cover_image?: string;
  episode?: string;
  status?: string;
  panels_count?: number;
  created_at?: string;
  updated_at?: string;
  video_url?: string | null;
  synopsis?: string | null;
}

interface RecentProjectsSectionProps {
  recentProjects: StoredProject[];
  loadingProjects: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showAll: boolean;
  setShowAll: (value: boolean | ((current: boolean) => boolean)) => void;
  filteredProjects: StoredProject[];
  displayedProjects: StoredProject[];
  fetchProjects: () => Promise<void> | void;
  navigateTo?: (path: string) => void;
  handleOpenProject: (project: Project) => void;
  handleRenameProject: (e: React.MouseEvent, project: Project) => void;
  handleDeleteProject: (e: React.MouseEvent, projectId: string) => void;
  handleExportProject: (e: React.MouseEvent, project: Project) => void;
  handleCopyLink: (e: React.MouseEvent, project: Project) => void;
  openMenuId: string | null;
  handleToggleMenu: (e: React.MouseEvent, projectId: string) => void;
  renamingProjectId: string | null;
  onSaveRename: (projectId: string, newName: string) => Promise<void>;
}

const RecentProjectsSection: React.FC<RecentProjectsSectionProps> = ({
  recentProjects,
  loadingProjects,
  searchQuery,
  setSearchQuery,
  showAll,
  setShowAll,
  filteredProjects,
  displayedProjects,
  fetchProjects,
  navigateTo,
  handleOpenProject,
  handleRenameProject,
  handleDeleteProject,
  handleExportProject,
  handleCopyLink,
  openMenuId,
  handleToggleMenu,
  renamingProjectId,
  onSaveRename,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#2A2A2A] flex items-center justify-center border border-[#3B82F6]/30">
            <History className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Recent Projects
          </h3>
          {!loadingProjects && (
            <span className="px-2 py-0.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-full text-[10px] font-black text-[#3B82F6]">
              {filteredProjects.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAll(false);
              }}
              className="pl-8 pr-3 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-[#3B82F6]/40 w-44 transition-colors"
            />
          </div>
          <button
            onClick={() => fetchProjects()}
            title="Refresh projects"
            className="p-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/10 transition-all cursor-pointer text-neutral-500 hover:text-[#60A5FA]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingProjects ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigateTo?.("/projects")}
            className="text-xs font-bold text-[#3B82F6] hover:text-[#93C5FD] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {loadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProjectCardSkeleton count={3} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-neutral-900/20 border border-neutral-800/60 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
          {searchQuery ? (
            <>
              <Search className="h-8 w-8 text-neutral-700" />
              <p className="text-sm font-bold text-neutral-400">
                No projects match "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#3B82F6] hover:text-[#93C5FD] font-bold cursor-pointer"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <BookOpenCheck className="h-8 w-8 text-neutral-700" />
              <p className="text-sm font-bold text-neutral-400">
                No projects yet
              </p>
              <p className="text-xs text-neutral-600 max-w-xs">
                Scrape a URL above or click Video Studio to create your first
                webtoon project.
              </p>
              <button
                onClick={() => {
                  const tempId = `temp_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 10)}`;
                  navigateTo?.(`/scraper/editor?id=${tempId}`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] hover:bg-[#333333] border border-[#2F2F2F] hover:border-[#3B82F6] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> New Project
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {displayedProjects.map((project) => {
              const projectCardItem: Project = {
                project_id: project.project_id,
                title: project.title || "Untitled Series",
                url: project.url || "",
                created_at: project.created_at || "",
                status: project.status || "ready",
                panels_count: project.panels_count ?? 0,
                imported_assets_count: project.imported_assets_count,
                series_slug: project.series_slug || undefined,
                chapter_slug: project.chapter_slug || undefined,
                genre: project.genre || undefined,
                author: project.author || undefined,
                cover_image: project.cover_image || undefined,
                synopsis: project.synopsis || undefined,
                episode: project.episode || undefined,
              };
              return (
                <ProjectCard
                  key={project.project_id}
                  project={projectCardItem}
                  onOpenProject={handleOpenProject}
                  onRename={handleRenameProject}
                  onDelete={handleDeleteProject}
                  onExport={handleExportProject}
                  onCopyLink={handleCopyLink}
                  openMenuId={openMenuId}
                  onToggleMenu={handleToggleMenu}
                  renamingProjectId={renamingProjectId}
                  onSaveRename={onSaveRename}
                />
              );
            })}
          </div>
          {filteredProjects.length > 6 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex items-center gap-2 px-5 py-2.5 border border-neutral-800 bg-neutral-900/60 hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/5 rounded-xl text-xs font-bold text-neutral-400 hover:text-[#93C5FD] transition-all cursor-pointer"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> Show{" "}
                    {filteredProjects.length - 6} More Projects
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentProjectsSection;
