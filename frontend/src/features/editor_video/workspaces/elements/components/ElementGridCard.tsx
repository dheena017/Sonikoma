import React from "react";
import { VectorElementItem } from "../../../data/elementData";
import { MangaVectorGraphic } from "./MangaVectorGraphic";
import { Plus } from "lucide-react";

interface ElementGridCardProps {
  element: VectorElementItem;
  onAdd: () => void;
}

export const ElementGridCard: React.FC<ElementGridCardProps> = ({
  element,
  onAdd,
}) => {
  return (
    <div
      onClick={onAdd}
      className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950/90 h-36 cursor-pointer group hover:border-[#3B82F6]/80 hover:bg-neutral-900 transition-all flex flex-col justify-between p-2.5 shadow-md"
    >
      {/* SVG Graphic Canvas */}
      <div className="flex-1 flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-300">
        <MangaVectorGraphic type={element.svgType} className="w-full h-20" />
      </div>

      {/* Badges & Description */}
      <div className="relative z-10 pt-1 border-t border-white/5 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-white truncate group-hover:text-[#93C5FD] transition-colors">
            {element.title}
          </p>
          <p className="text-[8px] text-neutral-400 font-mono truncate">{element.badge}</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="h-6 w-6 rounded-lg bg-neutral-800 hover:bg-[#3B82F6] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer ml-1"
          title="Add to Current Frame"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
