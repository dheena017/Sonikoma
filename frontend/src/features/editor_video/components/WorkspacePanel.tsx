import React, { useState, useCallback } from "react";
import { MiniSidebar, WorkspaceId } from "./MiniSidebar";
import { MediaWorkspace } from "../workspaces/media/MediaWorkspace";
import { CharactersWorkspace } from "../workspaces/characters/CharactersWorkspace";
import { StoryWorkspace } from "../workspaces/story/StoryWorkspace";
import { ElementsWorkspace } from "../workspaces/elements/ElementsWorkspace";
import { TextWorkspace } from "../workspaces/text/TextWorkspace";
import { AudioWorkspace } from "../workspaces/audio/AudioWorkspace";
import { AiWorkspace } from "../workspaces/ai/AiWorkspace";
import { TemplatesWorkspace } from "../workspaces/templates/TemplatesWorkspace";
import { ResourcesWorkspace } from "../workspaces/resources/ResourcesWorkspace";
import { MarketplaceWorkspace } from "../workspaces/marketplace/MarketplaceWorkspace";
import { AppsWorkspace } from "../workspaces/apps/AppsWorkspace";

const WORKSPACE_MAP: Record<WorkspaceId, React.ElementType<{ onTriggerFeedback: (msg: string) => void }>> = {
  media:       MediaWorkspace,
  characters:  CharactersWorkspace,
  story:       StoryWorkspace,
  elements:    ElementsWorkspace,
  text:        TextWorkspace,
  audio:       AudioWorkspace,
  ai:          AiWorkspace,
  templates:   TemplatesWorkspace,
  resources:   ResourcesWorkspace,
  marketplace: MarketplaceWorkspace,
  apps:        AppsWorkspace,
};

interface FeedbackToast {
  id: number;
  msg: string;
}

interface WorkspacePanelProps {
  defaultWorkspace?: WorkspaceId;
  onBackToApp?: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ defaultWorkspace = "media", onBackToApp }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(defaultWorkspace);
  const [toasts, setToasts] = useState<FeedbackToast[]>([]);

  const triggerFeedback = useCallback((msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const ActiveWorkspaceComponent = WORKSPACE_MAP[activeWorkspace];

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Toast Layer */}
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

      {/* Mini Sidebar */}
      <MiniSidebar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onBackToApp={onBackToApp}
      />

      {/* Workspace Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "rgba(12,10,24,0.98)" }}>
        <ActiveWorkspaceComponent onTriggerFeedback={triggerFeedback} />
      </div>
    </div>
  );
};
