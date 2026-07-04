import { useCallback, useEffect, useState } from "react";

export interface UseProjectsMenuState {
  openMenuId: string | null;
  renamingProjectId: string | null;
  toggleMenu: (e: React.MouseEvent, projectId: string) => void;
  closeMenu: () => void;
  setRenamingProjectId: (id: string | null) => void;
  saveProjectName: (projectId: string, newName: string) => Promise<void>;
}

export function useProjectsMenu(): UseProjectsMenuState {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setOpenMenuId((current) => (current === projectId ? null : projectId));
  }, []);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  const saveProjectName = useCallback(
    async (projectId: string, newName: string) => {
      if (!newName.trim()) {
        setRenamingProjectId(null);
        return;
      }

      console.log(`Renaming project ${projectId} to ${newName}`);
      setRenamingProjectId(null);
    },
    []
  );

  return {
    openMenuId,
    renamingProjectId,
    toggleMenu,
    closeMenu,
    setRenamingProjectId,
    saveProjectName,
  };
}
