import React from "react";
import {
  Image,
  Users,
  BookOpen,
  Shapes,
  Type,
  Music,
  Wand2,
  LayoutTemplate,
  Package,
  ShoppingBag,
  AppWindow,
  Star,
  History,
} from "lucide-react";

import { WorkspaceId } from "../types/workspace.types";
import { FavoritesWorkspace } from "../workspaces/favorites/FavoritesWorkspace";
import { RecentWorkspace } from "../workspaces/recent/RecentWorkspace";
import { ImportedAssetsWorkspace } from "../workspaces/imported_assets/ImportedAssetsWorkspace";
import { CharactersWorkspace } from "../workspaces/characters/CharactersWorkspace";
import { StoryWorkspace } from "../workspaces/story/StoryWorkspace";
import { ElementsWorkspace } from "../workspaces/elements/ElementsWorkspace";
import { TextWorkspace } from "../workspaces/text/TextWorkspace";
import { AudioWorkspace } from "../workspaces/audio/AudioWorkspace";
import { TemplatesWorkspace } from "../workspaces/templates/TemplatesWorkspace";
import { ResourcesWorkspace } from "../workspaces/resources/ResourcesWorkspace";
import { MarketplaceWorkspace } from "../workspaces/marketplace/MarketplaceWorkspace";
import { AppsWorkspace } from "../workspaces/apps/AppsWorkspace";

export type WorkspaceGroup = "primary" | "favorites" | "secondary" | "utility";

export interface WorkspaceConfig {
  id: WorkspaceId;
  title: string;
  group: WorkspaceGroup;
  icon: React.ElementType;
  component: React.ComponentType<{
    onTriggerFeedback: (msg: string) => void;
    appLogic?: any;
  }>;
  defaultWidth?: number;
  supportsSearch?: boolean;
  supportsDragDrop?: boolean;
  supportsAI?: boolean;
}

export const WORKSPACE_REGISTRY: Record<WorkspaceId, WorkspaceConfig> = {
  imported_assets: {
    id: "imported_assets",
    title: "Imported Assets",
    group: "primary",
    icon: Image,
    component: ImportedAssetsWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: true,
  },
  media: {
    id: "media",
    title: "Imported Assets",
    group: "primary",
    icon: Image,
    component: ImportedAssetsWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: true,
  },
  story: {
    id: "story",
    title: "Story",
    group: "primary",
    icon: BookOpen,
    component: StoryWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: true,
  },
  characters: {
    id: "characters",
    title: "Characters",
    group: "secondary",
    icon: Users,
    component: CharactersWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: true,
  },
  text: {
    id: "text",
    title: "Text",
    group: "secondary",
    icon: Type,
    component: TextWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: true,
  },
  favorites: {
    id: "favorites",
    title: "Favorites",
    group: "favorites",
    icon: Star,
    component: FavoritesWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: false,
  },
  recent: {
    id: "recent",
    title: "Recent",
    group: "favorites",
    icon: History,
    component: RecentWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: false,
  },
  elements: {
    id: "elements",
    title: "Elements",
    group: "secondary",
    icon: Shapes,
    component: ElementsWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: false,
  },
  audio: {
    id: "audio",
    title: "Audio",
    group: "secondary",
    icon: Music,
    component: AudioWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: true,
  },
  templates: {
    id: "templates",
    title: "Templates",
    group: "secondary",
    icon: LayoutTemplate,
    component: TemplatesWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: false,
  },
  resources: {
    id: "resources",
    title: "Resources",
    group: "secondary",
    icon: Package,
    component: ResourcesWorkspace,
    defaultWidth: 380,
    supportsSearch: true,
    supportsDragDrop: true,
    supportsAI: false,
  },
  marketplace: {
    id: "marketplace",
    title: "Marketplace",
    group: "utility",
    icon: ShoppingBag,
    component: MarketplaceWorkspace,
    defaultWidth: 340,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: false,
  },
  apps: {
    id: "apps",
    title: "Apps",
    group: "utility",
    icon: AppWindow,
    component: AppsWorkspace,
    defaultWidth: 340,
    supportsSearch: true,
    supportsDragDrop: false,
    supportsAI: false,
  },
};

/**
 * Returns workspaces grouped by Primary, Secondary, Utility
 */
export const getGroupedWorkspaces = () => {
  const configs = Object.values(WORKSPACE_REGISTRY).filter(
    (c) => c.id !== "media"
  );
  return [
    {
      name: "Primary",
      items: configs.filter((c) => c.group === "primary"),
    },
    {
      name: "Saved",
      items: configs.filter((c) => c.group === "favorites"),
    },
    {
      name: "Secondary",
      items: configs.filter((c) => c.group === "secondary"),
    },
    {
      name: "Utility",
      items: configs.filter((c) => c.group === "utility"),
    },
  ];
};
