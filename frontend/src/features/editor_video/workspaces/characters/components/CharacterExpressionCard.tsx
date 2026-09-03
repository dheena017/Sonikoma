import React from "react";

interface CharacterExpressionCardProps {
  expression: { id: string; name: string; img: string };
  onApply: () => void;
}

export const CharacterExpressionCard: React.FC<
  CharacterExpressionCardProps
> = ({ expression, onApply }) => {
  return (
    <div
      onClick={onApply}
      className="p-3 rounded-[1.5rem] bg-[#07060f] border border-white/5 hover:border-[#3B82F6]/30 flex flex-col items-center gap-3 cursor-pointer transition-all shadow-[0_14px_30px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_40px_rgba(59,130,246,0.2)]"
    >
      <img
        src={expression.img}
        alt={expression.name}
        className="w-16 h-16 rounded-2xl object-cover"
      />
      <span className="text-[10px] font-semibold text-white text-center">
        {expression.name}
      </span>
    </div>
  );
};
