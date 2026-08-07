import React from "react";

interface CharacterPoseCardProps {
  pose: { id: string; title: string; tag: string };
  onApply: () => void;
}

export const CharacterPoseCard: React.FC<CharacterPoseCardProps> = ({ pose, onApply }) => {
  return (
    <div
      onClick={onApply}
      className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 flex items-center justify-between cursor-pointer transition-all shadow-sm"
    >
      <span className="text-xs font-bold text-white">{pose.title}</span>
      <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
        {pose.tag}
      </span>
    </div>
  );
};
