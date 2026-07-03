import React from "react";

export type Category = "all" | "nav" | "trigger" | "playback" | "editor" | "deck";

export interface ShortcutsPageProps {
  shortcuts: Record<string, string>;
  setShortcuts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  defaultShortcuts: Record<string, string>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  audioFeedback?: any;
}

export interface ShortcutActionDetails {
  label: string;
  scope: string;
  icon: React.ReactNode;
  category: Category;
}
