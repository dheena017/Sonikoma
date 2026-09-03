import React from "react";
import { Mic } from "lucide-react";
import { CharacterItem } from "../../../types/workspace.types";

interface CharacterRosterCardProps {
  character: CharacterItem;
  onSelect: () => void;
}

export const CharacterRosterCard: React.FC<CharacterRosterCardProps> = ({
  character,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className="p-3 rounded-[1.75rem] bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/30 cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_48px_rgba(59,130,246,0.22)]"
    >
      <div className="flex items-center gap-3">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-12 h-12 rounded-full object-cover border border-[#3B82F6]/40"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="text-sm font-semibold text-white group-hover:text-[#3B82F6] truncate">
              {character.name}
            </h4>
            <span className="text-[9px] font-semibold font-mono bg-[#2A2A2A] text-[#3B82F6] px-2 py-0.5 rounded-full border border-[#3B82F6]/20 shrink-0">
              {character.role}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-1">
            <Mic className="h-3 w-3 text-[#3B82F6]" />
            <span>{character.voiceActor}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
