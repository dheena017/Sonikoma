import React from "react";
import { ElementItem } from "../../../types/workspace.types";

interface ElementGridCardProps {
  element: ElementItem;
  onAdd: () => void;
}

export const ElementGridCard: React.FC<ElementGridCardProps> = ({ element, onAdd }) => {
  return (
    <div
      onClick={onAdd}
      className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 h-32 cursor-pointer group hover:border-purple-500/60 transition-all flex flex-col justify-between p-2 shadow-sm"
    >
      {element.img && (
        <img
          src={element.img}
          alt={element.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
        />
      )}
      {element.emoji && (
        <div className="absolute inset-0 flex items-center justify-center text-4xl select-none group-hover:scale-110 transition-transform">
          {element.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      <div className="relative z-10 flex justify-between items-center">
        {element.badge && (
          <span className="text-[8px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded border border-white/10">
            {element.badge}
          </span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-white truncate drop-shadow">{element.title}</p>
        {element.desc && <p className="text-[8px] text-neutral-300 truncate">{element.desc}</p>}
      </div>
    </div>
  );
};
