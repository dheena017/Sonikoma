import React from "react";

interface CharacterExpressionCardProps {
  expression: { id: string; name: string; img: string };
  onApply: () => void;
}

export const CharacterExpressionCard: React.FC<CharacterExpressionCardProps> = ({ expression, onApply }) => {
  return (
    <div
      onClick={onApply}
      className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 flex flex-col items-center gap-1 cursor-pointer transition-all shadow-sm"
    >
      <img src={expression.img} alt={expression.name} className="w-16 h-16 rounded-lg object-cover" />
      <span className="text-[9px] font-bold text-center text-white">{expression.name}</span>
    </div>
  );
};
