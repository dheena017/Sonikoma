import React, { useState, useCallback } from "react";
import { MiniSidebar } from "./MiniSidebar";
import { WorkspaceId } from "../types/workspace.types";
import { WORKSPACE_REGISTRY } from "../registry/workspaceRegistry";
import { editorEventBus, useEditorEvent } from "../events/editorEventBus";

interface FeedbackToast {
  id: number;
  msg: string;
}

interface WorkspacePanelProps {
  defaultWorkspace?: WorkspaceId;
  onBackToApp?: () => void;
  showContent?: boolean;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  defaultWorkspace = "story",
  onBackToApp,
  showContent = true,
}) => {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceId>(defaultWorkspace);

  const config =
    WORKSPACE_REGISTRY[activeWorkspace] || WORKSPACE_REGISTRY["story"];
  const ActiveWorkspaceComponent = config.component;

  return (
    <div className="w-full flex h-full overflow-hidden relative">

      <MiniSidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onBackToApp={onBackToApp}
      />

      {showContent && (
        <div
          className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-[#0c0d16]/75 backdrop-blur-2xl border-r border-white/10 shadow-[inset_0_0_32px_rgba(0,0,0,0.22)]"
        >
          <ActiveWorkspaceComponent
            onTriggerFeedback={(msg) => {
              editorEventBus.publish("MEDIA_ADDED", {
                assetId: "ast-" + Date.now(),
                title: msg,
                type: "generic",
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
