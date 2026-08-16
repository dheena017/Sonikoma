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
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);

  const triggerFeedback = useCallback((msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2800
    );
  }, []);

  useEditorEvent("MEDIA_ADDED", (data) => {
    triggerFeedback(
      `[EventBus] Media Added: "${data.title}" -> Timeline & Preview refreshed`
    );
  });

  useEditorEvent("TIMELINE_UPDATED", (data) => {
    triggerFeedback(
      `[EventBus] Timeline Sync -> History saved (${
        data.clipsCount ?? 1
      } clips)`
    );
  });

  useEditorEvent("INSPECTOR_REFRESH", (data) => {
    triggerFeedback(
      `[EventBus] Inspector Refresh -> Selected: ${data.layerName ?? "Layer"}`
    );
  });

  useEditorEvent("SCENE_CHANGED", (data) => {
    triggerFeedback(
      `[EventBus] Scene Changed -> Scene #${data.sceneNumber}: ${data.title}`
    );
  });

  useEditorEvent("AI_TASK_TRIGGERED", (data) => {
    triggerFeedback(`[EventBus] AI Task Started -> ${data.toolName}`);
  });

  const config =
    WORKSPACE_REGISTRY[activeWorkspace] || WORKSPACE_REGISTRY["story"];
  const ActiveWorkspaceComponent = config.component;

  return (
    <div className="flex h-full overflow-hidden relative">
      <div className="pointer-events-none absolute bottom-4 left-16 right-0 z-50 flex flex-col gap-2 items-start px-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-purple-900/90 border border-purple-500/50 text-white text-xs font-mono px-3 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            ✓ {t.msg}
          </div>
        ))}
      </div>

      <MiniSidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onBackToApp={onBackToApp}
      />

      {showContent && (
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0c0d16]/75 backdrop-blur-2xl border-r border-white/10 shadow-[inset_0_0_32px_rgba(0,0,0,0.22)]"
          style={{
            width: config.defaultWidth ? config.defaultWidth - 64 : undefined,
          }}
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
