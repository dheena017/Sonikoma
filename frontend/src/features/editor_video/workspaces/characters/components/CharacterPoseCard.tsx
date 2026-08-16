import React from "react";

interface CharacterPoseCardProps {
  pose: { id: string; title: string; tag: string };
  onApply: () => void;
}

export const CharacterPoseCard: React.FC<CharacterPoseCardProps> = ({
  pose,
  onApply,
}) => {
  return (
    <div
      onClick={onApply}
      className="p-3 rounded-[1.5rem] bg-[#07060f] border border-white/5 hover:border-purple-500/30 flex items-center justify-between cursor-pointer transition-all shadow-[0_14px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_40px_rgba(168,85,247,0.2)]"
    >
      <span className="text-sm font-semibold text-white">{pose.title}</span>
      <span className="text-[9px] font-semibold font-mono text-purple-100 bg-purple-500/12 px-2 py-1 rounded-full border border-purple-500/20">
        {pose.tag}
      </span>
    </div>
  );
};
