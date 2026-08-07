import React from "react";
import { WORKSPACE_REGISTRY, WorkspaceConfig } from "../registry/workspaceRegistry";

// ─── Plugin Types ─────────────────────────────────────────────────────────────
export interface InspectorSectionPlugin {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ComponentType;
  defaultOpen?: boolean;
}

export interface ToolbarActionPlugin {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  tooltip?: string;
}

export interface TimelineActionPlugin {
  id: string;
  label: string;
  icon: React.ElementType;
  onExecute: (selectedClips: any[]) => void;
}

export interface ExporterPlugin {
  id: string;
  name: string;
  extension: string;
  badge?: string;
  exportHandler: (projectData: any) => Promise<{ downloadUrl: string; size: string }>;
}

export interface SonikomaPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  init?: (api: PluginManager) => void;
}

// ─── Plugin Manager Implementation ───────────────────────────────────────────
class PluginManager {
  private registeredPlugins: Map<string, SonikomaPlugin> = new Map();
  private inspectorSections: InspectorSectionPlugin[] = [];
  private toolbarActions: ToolbarActionPlugin[] = [];
  private timelineActions: TimelineActionPlugin[] = [];
  private exporters: ExporterPlugin[] = [];

  /**
   * Register a custom workspace (e.g. 3D Pose Studio, Voice Clone Lab)
   */
  public registerWorkspace(config: WorkspaceConfig): void {
    WORKSPACE_REGISTRY[config.id] = config;
    console.log(`[Sonikoma Plugin API] Registered Workspace: "${config.title}" (${config.id})`);
  }

  /**
   * Register a custom right inspector accordion section
   */
  public registerInspector(section: InspectorSectionPlugin): void {
    this.inspectorSections.push(section);
    console.log(`[Sonikoma Plugin API] Registered Inspector Section: "${section.label}"`);
  }

  /**
   * Register a custom header/topbar action button
   */
  public registerToolbar(action: ToolbarActionPlugin): void {
    this.toolbarActions.push(action);
    console.log(`[Sonikoma Plugin API] Registered Toolbar Action: "${action.label}"`);
  }

  /**
   * Register a custom NLE timeline track/clip action
   */
  public registerTimelineAction(action: TimelineActionPlugin): void {
    this.timelineActions.push(action);
    console.log(`[Sonikoma Plugin API] Registered Timeline Action: "${action.label}"`);
  }

  /**
   * Register a custom export format provider (e.g., Animated WebP, Premiere XML, Webtoon 9:16 MP4)
   */
  public registerExporter(exporter: ExporterPlugin): void {
    this.exporters.push(exporter);
    console.log(`[Sonikoma Plugin API] Registered Exporter: "${exporter.name}" (.${exporter.extension})`);
  }

  /**
   * Load and initialize a plugin instance
   */
  public loadPlugin(plugin: SonikomaPlugin): void {
    if (this.registeredPlugins.has(plugin.id)) {
      console.warn(`[Sonikoma Plugin API] Plugin "${plugin.id}" is already loaded.`);
      return;
    }
    this.registeredPlugins.set(plugin.id, plugin);
    if (plugin.init) {
      plugin.init(this);
    }
    console.log(`[Sonikoma Plugin API] Plugin "${plugin.name}" v${plugin.version} loaded successfully.`);
  }

  // Getters for registered extensions
  public getInspectorSections(): InspectorSectionPlugin[] {
    return this.inspectorSections;
  }

  public getToolbarActions(): ToolbarActionPlugin[] {
    return this.toolbarActions;
  }

  public getTimelineActions(): TimelineActionPlugin[] {
    return this.timelineActions;
  }

  public getExporters(): ExporterPlugin[] {
    return this.exporters;
  }
}

export const pluginManager = new PluginManager();

// ─── Convenience Exported Functions ──────────────────────────────────────────
export const registerWorkspace = (config: WorkspaceConfig) => pluginManager.registerWorkspace(config);
export const registerInspector = (section: InspectorSectionPlugin) => pluginManager.registerInspector(section);
export const registerToolbar = (action: ToolbarActionPlugin) => pluginManager.registerToolbar(action);
export const registerTimelineAction = (action: TimelineActionPlugin) => pluginManager.registerTimelineAction(action);
export const registerExporter = (exporter: ExporterPlugin) => pluginManager.registerExporter(exporter);
