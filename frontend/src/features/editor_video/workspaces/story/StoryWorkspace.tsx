import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { STORY_SUB_TABS, MOCK_STORY_SCENES } from "../../data/storyData";
import { BookOpen, FileText, Scan } from "lucide-react";
import { StoryWorkspaceHeader } from "./components/StoryWorkspaceHeader";
import { StoryPipelineBreadcrumb } from "./components/StoryPipelineBreadcrumb";
import { StoryAiToolbar } from "./components/StoryAiToolbar";
import { StorySceneCard } from "./components/StorySceneCard";

interface StoryWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryWorkspace: React.FC<StoryWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Scenes");
  const [searchQuery, setSearchQuery] = useState("");

  const pipelineSteps = [
    { label: "Project", active: true },
    { label: "Story", active: true },
    {
      label: "Scenes",
      active: activeTab === "Scenes" || activeTab === "Storyboard",
    },
    { label: "Panels", active: activeTab === "Storyboard" },
    { label: "Timeline", active: activeTab === "Timeline" },
    { label: "Video", active: false },
  ];

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <StoryWorkspaceHeader
        tabs={STORY_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Visual Narrative Pipeline Breadcrumb Component */}
      <StoryPipelineBreadcrumb steps={pipelineSteps} />

      {/* Contextual AI Action Bar Component */}
      <StoryAiToolbar onTriggerFeedback={onTriggerFeedback} />

      <WorkspaceLayout.Content>
        {/* Scenes / Storyboard / Script View */}
        {(activeTab === "Scenes" ||
          activeTab === "Storyboard" ||
          activeTab === "Script") && (
          <div className="space-y-3">
            {/* Header Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  {activeTab === "Script"
                    ? "Full Narrative Script"
                    : "Scene Sequence Breakdown"}
                </span>
              </div>
              <button
                onClick={() =>
                  onTriggerFeedback(
                    "AI Vision scanning pages & building scene breakdown..."
                  )
                }
                className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              >
                <Scan className="h-3 w-3" />
                <span>Auto-Parse Story</span>
              </button>
            </div>

            {/* Scenes List using StorySceneCard Component */}
            <div className="space-y-2">
              {MOCK_STORY_SCENES.map((scene) => (
                <StorySceneCard
                  key={scene.id}
                  scene={scene}
                  onSelectScene={() =>
                    onTriggerFeedback(
                      `Selected Scene #${scene.sceneNumber}: ${scene.title}`
                    )
                  }
                  onJumpToScene={(e) => {
                    e.stopPropagation();
                    onTriggerFeedback(
                      `Jumped timeline playhead to Scene #${scene.sceneNumber}`
                    );
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Story Subtabs */}
        {["Timeline", "Narration", "Dialogue", "Notes"].includes(activeTab) && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center mx-auto">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {activeTab} Manager
              </h4>
              <p className="text-[10px] text-neutral-400 mt-1">
                Refine story flow, narration voiceovers, dialogue captions, and
                director notes.
              </p>
            </div>
            <button
              onClick={() => onTriggerFeedback(`Updated ${activeTab} details`)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)]"
            >
              Save {activeTab} Changes
            </button>
          </div>
        )}
      </WorkspaceLayout.Content>

      <WorkspaceLayout.Footer text="Sonikoma Narrative Engine — Story Drives Everything" />
    </WorkspaceLayout>
  );
};
