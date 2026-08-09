import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ProjectMetadata {
  project_id: string;
  title: string;
  url: string;
  video_url?: string | null;
  series_slug?: string | null;
  chapter_slug?: string | null;
  author?: string | null;
  cover_image?: string | null;
  synopsis?: string | null;
  genre?: string | null;
  episode?: string | null;
  audio_settings?: any;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface ActiveProjectData {
  project: ProjectMetadata;
  panels: any[];
  scrapedImages?: string[];
}

export interface ProjectStoreState {
  activeProjectData: ActiveProjectData | null;
  setActiveProject: (data: ActiveProjectData | null) => void;
  clearActiveProject: () => void;
  isEpisodeCollapsed: boolean;
  setIsEpisodeCollapsed: (v: boolean) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      activeProjectData: null,
      setActiveProject: (data) => set({ activeProjectData: data }),
      clearActiveProject: () => set({ activeProjectData: null }),
      isEpisodeCollapsed: false,
      setIsEpisodeCollapsed: (v: boolean) => set({ isEpisodeCollapsed: v }),
    }),
    {
      name: "sonikoma-active-project-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeProjectData: state.activeProjectData,
      }),
    }
  )
);
