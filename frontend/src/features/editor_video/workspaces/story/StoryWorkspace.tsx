import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { STORY_SUB_TABS, MOCK_STORY_SCENES } from "../../data/storyData";
import { BookOpen, FileText, Scan, Clock, Sparkles } from "lucide-react";

interface StoryWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryWorkspace: React.FC<StoryWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Scenes");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Story Workspace" />
      <WorkspaceLayout.Tabs tabs={STORY_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search script, scenes, dialogue lines..." />
      <WorkspaceLayout.Content>
        {/* Scenes / Breakdown View */}
        {(activeTab === "Scenes" || activeTab === "Storyboard" || activeTab === "Script") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Scene Script Sequence</span>
              <button
                onClick={() => onTriggerFeedback("OCR Speech Extractor scanning page...")}
                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Scan className="h-3 w-3" />
                <span>Run OCR Scan</span>
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_STORY_SCENES.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => onTriggerFeedback(`Opened Scene #${scene.sceneNumber}: ${scene.title}`)}
                  className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                      Scene #{scene.sceneNumber}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scene.duration} • {scene.panelCount} Panels
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-purple-300">{scene.title}</h4>
                  <div className="space-y-1 text-[10px]">
                    <p className="text-neutral-300 font-mono italic">“{scene.dialogue}”</p>
                    <p className="text-neutral-400 leading-tight">{scene.narration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Story Subtabs */}
        {["Timeline", "Narration", "Dialogue", "Notes"].includes(activeTab) && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-2">
            <FileText className="h-6 w-6 text-purple-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">{activeTab} Editor Active</h4>
            <p className="text-[10px] text-neutral-400">Edit panel text, narration monologues, and scene timing details.</p>
            <button
              onClick={() => onTriggerFeedback(`Updated ${activeTab}`)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-mono font-bold"
            >
              Save {activeTab} Edits
            </button>
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Script & Narration Engine" />
    </WorkspaceLayout>
  );
};
