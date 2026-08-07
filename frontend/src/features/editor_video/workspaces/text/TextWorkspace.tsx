import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEXT_SUB_TABS, MOCK_TEXT_PRESETS } from "../../data/textData";
import { TextWorkspaceHeader } from "./components/TextWorkspaceHeader";
import { TextAiToolbar } from "./components/TextAiToolbar";
import { TextQuickAddBar } from "./components/TextQuickAddBar";
import { TextPresetCard } from "./components/TextPresetCard";

interface TextWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const TextWorkspace: React.FC<TextWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Titles");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <TextWorkspaceHeader
        tabs={TEXT_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contextual AI Action Bar Component */}
      <TextAiToolbar onTriggerFeedback={onTriggerFeedback} />
      <WorkspaceLayout.Content>
        {/* Quick Add Buttons Component */}
        <TextQuickAddBar onAddText={(type) => onTriggerFeedback(`Added ${type}`)} />

        {/* Text Presets List using TextPresetCard Component */}
        <div className="space-y-2 pt-2">
          {MOCK_TEXT_PRESETS.map((preset) => (
            <TextPresetCard
              key={preset.id}
              preset={preset}
              onSelect={() => onTriggerFeedback(`Added "${preset.title}" lockup`)}
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Typography Engine" />
    </WorkspaceLayout>
  );
};
