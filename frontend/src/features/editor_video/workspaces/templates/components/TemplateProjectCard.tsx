import React from "react";
import { Star, Play } from "lucide-react";
import { TemplateProject } from "../../../types/workspace.types";

interface TemplateProjectCardProps {
  template: TemplateProject;
  onApply: () => void;
}

export const TemplateProjectCard: React.FC<TemplateProjectCardProps> = ({ template, onApply }) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all ${template.accent}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-90`} />
      <div className="relative z-10 p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-black text-white leading-tight">{template.title}</h4>
          <Star className="h-3.5 w-3.5 text-neutral-400 hover:text-amber-400 shrink-0 cursor-pointer" />
        </div>
        <p className="text-[10px] text-neutral-300 leading-snug">{template.desc}</p>
        <div className="flex items-center justify-between pt-1">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${template.accent}`}>
            {template.badge}
          </span>
          <button
            onClick={onApply}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Play className="h-3 w-3" /> Use Template
          </button>
        </div>
      </div>
    </div>
  );
};
