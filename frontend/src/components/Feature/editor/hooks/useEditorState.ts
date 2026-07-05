import { create } from 'zustand';

// Temporary mock types, these will be replaced with real types later
type Project = any;
type Panel = any;

interface EditorState {
  // Global Project State
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Panels/Storyboard State
  panels: Panel[];
  setPanels: (panels: Panel[]) => void;
  selectedPanelIds: string[];
  setSelectedPanelIds: (ids: string[]) => void;

  // Media State (Audio/Video Engine)
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  volume: number;
  setVolume: (volume: number) => void;

  // Right-Sidebar UI State
  activeTool: 'workspace' | 'autocrop' | 'bubbleclean' | 'audiolab' | 'cuts';
  setActiveTool: (tool: 'workspace' | 'autocrop' | 'bubbleclean' | 'audiolab' | 'cuts') => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

export const useEditorState = create<EditorState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  panels: [],
  setPanels: (panels) => set({ panels }),
  selectedPanelIds: [],
  setSelectedPanelIds: (ids) => set({ selectedPanelIds: ids }),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  volume: 1,
  setVolume: (volume) => set({ volume }),

  activeTool: 'workspace',
  setActiveTool: (tool) => set({ activeTool: tool }),
  isSidebarExpanded: true,
  setIsSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
}));
