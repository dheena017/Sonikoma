import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { CHARACTER_SUB_TABS, MOCK_CHARACTERS, CHARACTER_EXPRESSIONS, CHARACTER_POSES } from "../../data/characterData";
import { User, Mic, Sparkles, Plus } from "lucide-react";

interface CharactersWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const CharactersWorkspace: React.FC<CharactersWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Library");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Characters Workspace" />
      <WorkspaceLayout.Tabs tabs={CHARACTER_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search character roster, expressions, poses..." />
      <WorkspaceLayout.Content>
        {/* Character Library View */}
        {activeTab === "Library" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Project Cast Roster</span>
              <button
                onClick={() => onTriggerFeedback("New character prompt modal opened")}
                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>New Cast</span>
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  onClick={() => onTriggerFeedback(`Selected Character: ${char.name}`)}
                  className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <img src={char.avatar} alt={char.name} className="w-10 h-10 rounded-full object-cover border border-purple-500/40" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300">{char.name}</h4>
                        <span className="text-[8px] font-mono bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30">{char.role}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <Mic className="h-3 w-3 text-purple-400" />
                        <span>{char.voiceActor}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expressions View */}
        {activeTab === "Expressions" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Facial Cutout Expressions</h4>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_EXPRESSIONS.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onTriggerFeedback(`Applied expression: ${exp.name}`)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <img src={exp.img} alt={exp.name} className="w-16 h-16 rounded-lg object-cover" />
                  <span className="text-[9px] font-bold text-center text-white">{exp.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poses View */}
        {activeTab === "Poses" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Action Pose Presets</h4>
            <div className="space-y-1.5">
              {CHARACTER_POSES.map((pose) => (
                <div
                  key={pose.id}
                  onClick={() => onTriggerFeedback(`Applied pose: ${pose.title}`)}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{pose.title}</span>
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">{pose.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default fallback for remaining character subtabs */}
        {["Voice", "Consistency", "AI Character", "Relationships"].includes(activeTab) && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-2">
            <Sparkles className="h-6 w-6 text-purple-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">{activeTab} Engine Active</h4>
            <p className="text-[10px] text-neutral-400">Configure character seed consistency and automated voice mappings for your scene.</p>
            <button
              onClick={() => onTriggerFeedback(`Ran ${activeTab} synthesizer`)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-mono font-bold"
            >
              Run {activeTab} Engine
            </button>
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Character Consistency System" />
    </WorkspaceLayout>
  );
};
