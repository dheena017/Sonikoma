import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { AI_ENGINE_SUB_TABS, MOCK_AI_TOOLS } from "../../data/aiData";
import { AiWorkspaceHeader } from "./components/AiWorkspaceHeader";
import { AiToolCard } from "./components/AiToolCard";

interface AiWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AiWorkspace: React.FC<AiWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Generate");
  const [prompt, setPrompt] = useState("");

  const activeTools = MOCK_AI_TOOLS.filter(
    (t) => t.engine === activeTab.toLowerCase()
  );

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs inside */}
      <AiWorkspaceHeader
        activeEngine={activeTab}
        tabs={AI_ENGINE_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery=""
        onSearchChange={() => {}}
      />

      {/* Prompt box visible only for Generate */}
      {activeTab === "Generate" && (
        <WorkspaceLayout.PromptBox
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => {
            onTriggerFeedback(
              `AI generating from: "${prompt.slice(0, 40)}..."`
            );
            setPrompt("");
          }}
          placeholder='Describe your scene, e.g. "Shadow Monarch reveals his army to the shocked A-rank hunters..."'
        />
      )}

      <WorkspaceLayout.Content>
        {/* Tools Grid */}
        <div className="space-y-2">
          {activeTools.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No tools for this engine yet.
            </div>
          )}
          {activeTools.map((tool) => (
            <AiToolCard
              key={tool.id}
              tool={tool}
              onRun={(title) => onTriggerFeedback(`Running: ${title}`)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Powered by Sonikoma AI Engine" />
    </WorkspaceLayout>
  );
};
