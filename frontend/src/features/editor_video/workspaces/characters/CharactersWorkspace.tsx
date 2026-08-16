import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import {
  CHARACTER_SUB_TABS,
  MOCK_CHARACTERS,
  CHARACTER_EXPRESSIONS,
  CHARACTER_POSES,
} from "../../data/characterData";
import { Sparkles, Plus } from "lucide-react";
import { CharactersWorkspaceHeader } from "./components/CharactersWorkspaceHeader";
import { CharacterAiToolbar } from "./components/CharacterAiToolbar";
import { CharacterRosterCard } from "./components/CharacterRosterCard";
import { CharacterExpressionCard } from "./components/CharacterExpressionCard";
import { CharacterPoseCard } from "./components/CharacterPoseCard";

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
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <CharactersWorkspaceHeader
        characterCount={MOCK_CHARACTERS.length}
        onAddCharacter={() =>
          onTriggerFeedback("New character prompt modal opened")
        }
        tabs={CHARACTER_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contextual AI Action Bar Component */}
      <CharacterAiToolbar onTriggerFeedback={onTriggerFeedback} />
      <WorkspaceLayout.Content>
        {/* Character Library View */}
        {activeTab === "Library" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Project Cast Roster
              </span>
              <button
                onClick={() =>
                  onTriggerFeedback("New character prompt modal opened")
                }
                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>New Cast</span>
              </button>
            </div>
            <div className="space-y-2">
              {MOCK_CHARACTERS.map((char) => (
                <CharacterRosterCard
                  key={char.id}
                  character={char}
                  onSelect={() =>
                    onTriggerFeedback(`Selected Character: ${char.name}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Expressions View */}
        {activeTab === "Expressions" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase">
              Facial Cutout Expressions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_EXPRESSIONS.map((exp) => (
                <CharacterExpressionCard
                  key={exp.id}
                  expression={exp}
                  onApply={() =>
                    onTriggerFeedback(`Applied expression: ${exp.name}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Poses View */}
        {activeTab === "Poses" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase">
              Action Pose Presets
            </h4>
            <div className="space-y-1.5">
              {CHARACTER_POSES.map((pose) => (
                <CharacterPoseCard
                  key={pose.id}
                  pose={pose}
                  onApply={() =>
                    onTriggerFeedback(`Applied pose: ${pose.title}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Default fallback for remaining character subtabs */}
        {["Voice", "Consistency", "AI Character", "Relationships"].includes(
          activeTab
        ) && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center space-y-2">
            <Sparkles className="h-6 w-6 text-purple-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">
              {activeTab} Engine Active
            </h4>
            <p className="text-[10px] text-neutral-400">
              Configure character seed consistency and automated voice mappings
              for your scene.
            </p>
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
