import React, { useState, useCallback } from "react";
import { MiniSidebar } from "./MiniSidebar";
import { WorkspaceId } from "../types/workspace.types";
import { WORKSPACE_REGISTRY } from "../registry/workspaceRegistry";
import { editorEventBus, useEditorEvent } from "../events/editorEventBus";

interface WorkspacePanelProps {
  defaultWorkspace?: WorkspaceId;
  onBackToApp?: () => void;
  showContent?: boolean;
  appLogic?: any;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  defaultWorkspace = "imported_assets",
  onBackToApp,
  showContent = true,
  appLogic,
}) => {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceId>(defaultWorkspace);

  // ── Listen for OPEN_WORKSPACE events from Timeline track buttons ──────────
  const handleOpenWorkspace = useCallback(
    ({ workspaceId }: { workspaceId: string }) => {
      const id = workspaceId as WorkspaceId;
      if (WORKSPACE_REGISTRY[id]) {
        setActiveWorkspace(id);
      }
    },
    []
  );
  useEditorEvent("OPEN_WORKSPACE", handleOpenWorkspace);

  const config =
    WORKSPACE_REGISTRY[activeWorkspace] ||
    WORKSPACE_REGISTRY["imported_assets"] ||
    WORKSPACE_REGISTRY["media"];
  const ActiveWorkspaceComponent = config.component;

  return (
    <div className="w-full flex h-full overflow-hidden relative">
      <MiniSidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onBackToApp={onBackToApp}
      />

      {showContent && (
        <div className="flex-1 w-full min-w-0 flex flex-col h-full bg-[#0c0d16]/75 backdrop-blur-2xl border-r border-white/10 shadow-[inset_0_0_32px_rgba(0,0,0,0.22)]">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <ActiveWorkspaceComponent
              appLogic={appLogic}
              onTriggerFeedback={(msg) => {
                editorEventBus.publish("MEDIA_ADDED", {
                  assetId: "ast-" + Date.now(),
                  title: msg,
                  type: "generic",
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
