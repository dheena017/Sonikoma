import { useMemo } from "react";
import type { Project } from "./ProjectTypes";

export interface UseProjectsComputedState {
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  uniqueGenres: string[];
  filteredProjects: Project[];
}

export function useProjectsComputed(
  projects: Project[],
  searchQuery: string,
  statusFilter: string,
  genreFilter: string,
  sortBy: string
): UseProjectsComputedState {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status?.toLowerCase() === "completed"
    ).length;
    const totalPanels = projects.reduce(
      (acc, p) => acc + (p.panels_count || 0),
      0
    );
    return { totalProjects, completedProjects, totalPanels };
  }, [projects]);

  const uniqueGenres = useMemo(() => {
    const genres = projects.map((p) => p.genre).filter(Boolean) as string[];
    return ["All", ...Array.from(new Set(genres))];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.author || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (p) =>
          (p.status || "Draft").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (genreFilter !== "All") {
      result = result.filter((p) => p.genre === genreFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "Newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortBy === "Oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sortBy === "Most Panels")
        return (b.panels_count || 0) - (a.panels_count || 0);
      if (sortBy === "A-Z") return (a.title || "").localeCompare(b.title || "");
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, genreFilter, sortBy]);

  return {
    stats,
    uniqueGenres,
    filteredProjects,
  };
}
