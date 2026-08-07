import React from "react";
import { Mic } from "lucide-react";
import { CharacterItem } from "../../../types/workspace.types";

interface CharacterRosterCardProps {
  character: CharacterItem;
  onSelect: () => void;
}

export const CharacterRosterCard: React.FC<CharacterRosterCardProps> = ({ character, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
    >
      <div className="flex items-center gap-3">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-bold text-white group-hover:text-purple-300">{character.name}</h4>
            <span className="text-[8px] font-mono bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/30">
              {character.role}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Mic className="h-3 w-3 text-purple-400" />
            <span>{character.voiceActor}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
