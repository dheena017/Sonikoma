import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import {
  CHARACTER_SUB_TABS,
  DEFAULT_PROJECT_CHARACTERS,
  getDicebearAvatar,
} from "../../data/characterData";
import { CharacterItem } from "../../types/workspace.types";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { Plus, User, Sparkles, Wand2, Mic } from "lucide-react";
import { CharactersWorkspaceHeader } from "./components/CharactersWorkspaceHeader";
import { CharacterAiToolbar } from "./components/CharacterAiToolbar";
import { CharacterRosterCard } from "./components/CharacterRosterCard";

interface CharactersWorkspaceProps {
  onTriggerFeedback?: (msg: string) => void;
  appLogic?: any;
}

export const CharactersWorkspace: React.FC<CharactersWorkspaceProps> = ({
  onTriggerFeedback = () => {},
  appLogic,
}) => {
  const projectStore = useProjectStore();
  const activeData = projectStore?.activeProjectData;

  const [characters, setCharacters] = useState<CharacterItem[]>(() => {
    return (activeData as any)?.characters || DEFAULT_PROJECT_CHARACTERS;
  });

  const [activeTab, setActiveTab] = useState("Roster");
  const [searchQuery, setSearchQuery] = useState("");

  // New Character Creator Form State
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState<"Protagonist" | "Antagonist" | "Sidekick" | "Narrator">("Protagonist");
  const [newCharVoice, setNewCharVoice] = useState("Hiroshi (Anime Protagonist)");
  const [newCharStyle, setNewCharStyle] = useState<"adventurer" | "lorelei" | "bottts">("adventurer");

  const filteredCharacters = characters.filter((c) => {
    const matchSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.voiceActor && c.voiceActor.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newChar: CharacterItem = {
      id: `char-${Date.now()}`,
      name: newCharName.trim(),
      role: newCharRole,
      avatar: getDicebearAvatar(newCharName.trim(), newCharStyle),
      voiceActor: newCharVoice,
      badge: newCharRole,
    };

    const updated = [newChar, ...characters];
    setCharacters(updated);
    if (activeData) {
      projectStore.setActiveProject({
        ...activeData,
        characters: updated,
      } as any);
    }

    setNewCharName("");
    setActiveTab("Roster");
    onTriggerFeedback(`Added "${newChar.name}" to project cast roster!`);
  };

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <CharactersWorkspaceHeader
        characterCount={characters.length}
        onAddCharacter={() => setActiveTab("Character Creator")}
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
        {activeTab === "Roster" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Project Cast Roster ({filteredCharacters.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("Character Creator")}
                className="px-2.5 py-1 rounded-lg bg-[#2A2A2A] hover:bg-[#3B82F6] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>+ Add Cast</span>
              </button>
            </div>

            <div className="space-y-2">
              {filteredCharacters.map((char) => (
                <CharacterRosterCard
                  key={char.id}
                  character={char}
                  onSelect={() => {
                    if (appLogic?.setVoiceActor && char.voiceActor) {
                      appLogic.setVoiceActor(char.voiceActor);
                    }
                    onTriggerFeedback(`Linked voice: ${char.voiceActor} to active timeline`);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Character Creator with Live DiceBear Avatar Preview */}
        {activeTab === "Character Creator" && (
          <form onSubmit={handleAddCharacter} className="space-y-3 p-3 bg-neutral-900/80 rounded-2xl border border-[#2F2F2F] shadow-md font-mono text-xs">
            <h4 className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
              Create Project Character
            </h4>

            {/* Live DiceBear Avatar Preview */}
            <div className="flex items-center gap-3 p-2.5 bg-black/60 rounded-xl border border-white/10">
              <img
                src={getDicebearAvatar(newCharName || "Hero", newCharStyle)}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full border-2 border-[#60A5FA] bg-neutral-800 shrink-0 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm truncate">{newCharName || "Character Name"}</p>
                <p className="text-[#60A5FA] text-[10px]">{newCharRole} • {newCharVoice}</p>
                <span className="text-[8px] text-neutral-500 font-mono">Open DiceBear Anime Avatar</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[10px]">Character Name</label>
              <input
                type="text"
                placeholder="e.g. Sung Jin-Woo, Kageyama..."
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-[#60A5FA]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-neutral-400 text-[10px]">Story Role</label>
                <select
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                >
                  <option value="Protagonist">Protagonist</option>
                  <option value="Antagonist">Antagonist</option>
                  <option value="Sidekick">Sidekick</option>
                  <option value="Narrator">Narrator</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 text-[10px]">Avatar Style</label>
                <select
                  value={newCharStyle}
                  onChange={(e) => setNewCharStyle(e.target.value as any)}
                  className="w-full px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                >
                  <option value="adventurer">Anime Adventurer</option>
                  <option value="lorelei">Manga Heroine</option>
                  <option value="bottts">Sci-Fi Monster/Bot</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#3B82F6] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 mt-2"
            >
              <Plus className="h-4 w-4" /> Save Character to Project
            </button>
          </form>
        )}

        {/* Voice Cast Tab */}
        {activeTab === "Voice Cast" && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white font-mono uppercase">
              Voice Cast Mapping
            </h4>
            {characters.map((char) => (
              <div key={char.id} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-[#3B82F6]" />
                  <div>
                    <p className="text-xs font-bold text-white">{char.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">{char.voiceActor}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (appLogic?.setVoiceActor && char.voiceActor) {
                      appLogic.setVoiceActor(char.voiceActor);
                    }
                    onTriggerFeedback(`Set active studio voice to ${char.voiceActor}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#2A2A2A] hover:bg-[#3B82F6] border border-[#3B82F6]/40 text-white text-[10px] font-mono font-bold cursor-pointer"
                >
                  Bind Voice
                </button>
              </div>
            ))}
          </div>
        )}
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Character Engine • Open DiceBear Avatar API" />
    </WorkspaceLayout>
  );
};
