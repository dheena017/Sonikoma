import { useCallback, useState, useMemo } from "react";
import type { Project } from "./ProjectTypes.js";

export interface UseProjectsSelectionState {
  selectedProjects: Set<string>;
  toggleSelection: (e: React.MouseEvent, projectId: string) => void;
  toggleSelectAll: (filteredProjects: Project[]) => void;
  clearSelection: () => void;
  setSelectedProjects: (projects: Set<string>) => void;
}

export function useProjectsSelection(): UseProjectsSelectionState {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );

  const toggleSelection = useCallback(
    (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      setSelectedProjects((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) next.delete(projectId);
        else next.add(projectId);
        return next;
      });
    },
    []
  );

  const toggleSelectAll = useCallback((filteredProjects: Project[]) => {
    setSelectedProjects((prev) => {
      if (
        prev.size === filteredProjects.length &&
        filteredProjects.length > 0
      ) {
        return new Set();
      }
      return new Set(filteredProjects.map((p) => p.project_id));
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProjects(new Set());
  }, []);

  return {
    selectedProjects,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    setSelectedProjects,
  };
}
