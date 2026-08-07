import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { TEXT_SUB_TABS, MOCK_TEXT_PRESETS } from "../../data/textData";
import { Type, Sparkles } from "lucide-react";

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
      <WorkspaceLayout.Header title="Text Workspace" />
      <WorkspaceLayout.Tabs tabs={TEXT_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search titles, captions, speech dialogue..." />
      <WorkspaceLayout.Content>
        {/* Quick Add Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pb-2 border-b border-neutral-800">
          <button
            onClick={() => onTriggerFeedback("Added Plain Heading Text")}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-xs font-bold text-white text-center cursor-pointer"
          >
            + Heading
          </button>
          <button
            onClick={() => onTriggerFeedback("Added Subheading Text")}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-[11px] font-semibold text-neutral-200 text-center cursor-pointer"
          >
            + Subtitle
          </button>
          <button
            onClick={() => onTriggerFeedback("Added Body Text")}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-[10px] font-medium text-neutral-400 text-center cursor-pointer"
          >
            + Body
          </button>
        </div>

        {/* Text Presets List */}
        <div className="space-y-2 pt-2">
          {MOCK_TEXT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onTriggerFeedback(`Added "${preset.title}" lockup`)}
              className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all flex flex-col justify-between space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-purple-400">{preset.title}</span>
                <span className="text-[8px] font-mono font-bold bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {preset.badge}
                </span>
              </div>
              <p className={`text-sm ${preset.styleClass}`}>{preset.previewText}</p>
            </div>
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Typography Engine" />
    </WorkspaceLayout>
  );
};
