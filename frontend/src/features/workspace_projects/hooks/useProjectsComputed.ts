import { useMemo } from "react";
import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";
import {
  groupProjectsIntoSeries,
  Series,
} from "@/features/workspace_projects/utils/seriesGrouping";

export interface UseProjectsComputedState {
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  uniqueGenres: string[];
  filteredSeries: Series[];
  filteredProjects: Project[]; // Still return filtered projects for some legacy references
}

export function useProjectsComputed(
  projects: Project[],
  searchQuery: string,
  statusFilter: string,
  genreFilter: string,
  sortBy: string
): UseProjectsComputedState {
  // Group all projects into series first
  const allSeries = useMemo(
    () => groupProjectsIntoSeries(projects),
    [projects]
  );

  const stats = useMemo(() => {
    // Stats apply to series now, but we can maintain total panels correctly
    const totalProjects = allSeries.length;

    // Series is completed if all chapters are completed (or just use latest chapter status for now)
    const completedProjects = allSeries.filter(
      (s) => s.latestChapter?.status?.toLowerCase() === "completed"
    ).length;

    const totalPanels = projects.reduce(
      (acc, p) => acc + (p.panels_count || p.imported_assets_count || 0),
      0
    );
    return { totalProjects, completedProjects, totalPanels };
  }, [projects, allSeries]);

  const uniqueGenres = useMemo(() => {
    const genres = allSeries.map((s) => s.genre).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(genres))];
  }, [allSeries]);

  const filteredSeries = useMemo(() => {
    let result = [...allSeries];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.title || "").toLowerCase().includes(q) ||
          (s.author || "").toLowerCase().includes(q) ||
          // Also search within chapter titles
          s.chapters.some((c) => (c.title || "").toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (s) =>
          (s.latestChapter?.status || "Draft").toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    if (genreFilter !== "All") {
      result = result.filter((s) => s.genre === genreFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "Newest")
        return (
          (b.latestUpdatedAt ? new Date(b.latestUpdatedAt).getTime() : 0) -
          (a.latestUpdatedAt ? new Date(a.latestUpdatedAt).getTime() : 0)
        );
      if (sortBy === "Oldest")
        return (
          (a.latestUpdatedAt ? new Date(a.latestUpdatedAt).getTime() : 0) -
          (b.latestUpdatedAt ? new Date(b.latestUpdatedAt).getTime() : 0)
        );
      if (sortBy === "Most Panels") {
        const countA = a.chapters.reduce(
          (acc, c) => acc + (c.panels_count || c.imported_assets_count || 0),
          0
        );
        const countB = b.chapters.reduce(
          (acc, c) => acc + (c.panels_count || c.imported_assets_count || 0),
          0
        );
        return countB - countA;
      }
      if (sortBy === "A-Z") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [allSeries, searchQuery, statusFilter, genreFilter, sortBy]);

  // Keep filtered projects for compatibility where needed (like select all)
  const filteredProjects = useMemo(() => {
    // Flatten filtered series back to projects for select all, etc.
    return filteredSeries.flatMap((s) => s.chapters);
  }, [filteredSeries]);

  return {
    stats,
    uniqueGenres,
    filteredSeries,
    filteredProjects,
  };
}
