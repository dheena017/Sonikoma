import type {
  ChangeEvent,
  Dispatch,
  MouseEvent,
  RefObject,
  SetStateAction,
} from "react";
import { useShortcutFilters } from "./hooks/useShortcutFilters";
import { useShortcutRecording } from "./hooks/useShortcutRecording";
import { useShortcutPersistence } from "./hooks/useShortcutPersistence";
import { Category, ShortcutsPageProps } from "./shortcutTypes";

export interface UseShortcutsPageResult {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  recordingActionId: string | null;
  conflictMsg: string | null;
  activeCategory: Category;
  setActiveCategory: Dispatch<SetStateAction<Category>>;
  fileInputRef: RefObject<HTMLInputElement>;
  filteredShortcuts: [string, string][];
  handleResetToDefaults: () => Promise<void>;
  handleResetSingle: (id: string, event: MouseEvent) => void;
  handleDisableSingle: (id: string, event: MouseEvent) => void;
  handleExport: () => void;
  handleImport: (event: ChangeEvent<HTMLInputElement>) => void;
  handleClearFilters: () => void;
  handleStartRecording: (id: string) => void;
  handleCancelRecording: () => void;
}

export function useShortcutsPage({
  shortcuts,
  setShortcuts,
  defaultShortcuts,
  addNotification,
  audioFeedback,
}: Omit<ShortcutsPageProps, "onNavigateHome">): UseShortcutsPageResult {
  const {
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    filteredShortcuts,
    handleClearFilters,
  } = useShortcutFilters(shortcuts);

  const {
    recordingActionId,
    conflictMsg,
    handleStartRecording,
    handleCancelRecording,
  } = useShortcutRecording({
    shortcuts,
    setShortcuts,
    addNotification,
  });

  const {
    fileInputRef,
    handleResetToDefaults,
    handleResetSingle,
    handleDisableSingle,
    handleExport,
    handleImport,
  } = useShortcutPersistence({
    shortcuts,
    setShortcuts,
    defaultShortcuts,
    addNotification,
    audioFeedback,
  });

  return {
    searchQuery,
    setSearchQuery,
    recordingActionId,
    conflictMsg,
    activeCategory,
    setActiveCategory,
    fileInputRef,
    filteredShortcuts,
    handleResetToDefaults,
    handleResetSingle,
    handleDisableSingle,
    handleExport,
    handleImport,
    handleClearFilters,
    handleStartRecording,
    handleCancelRecording,
  };
}
