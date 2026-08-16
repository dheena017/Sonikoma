import React from "react";

interface TextQuickAddBarProps {
  onAddText: (type: string) => void;
}

export const TextQuickAddBar: React.FC<TextQuickAddBarProps> = ({
  onAddText,
}) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 pb-2 border-b border-neutral-800">
      <button
        onClick={() => onAddText("Plain Heading Text")}
        className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-xs font-bold text-white text-center cursor-pointer transition-colors shadow-sm"
      >
        + Heading
      </button>
      <button
        onClick={() => onAddText("Subheading Text")}
        className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-[11px] font-semibold text-neutral-200 text-center cursor-pointer transition-colors shadow-sm"
      >
        + Subtitle
      </button>
      <button
        onClick={() => onAddText("Body Text")}
        className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-[10px] font-medium text-neutral-400 text-center cursor-pointer transition-colors shadow-sm"
      >
        + Body
      </button>
    </div>
  );
};
