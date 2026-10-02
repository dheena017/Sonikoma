import React from "react";

interface TemplateInfoBannerProps {
  text?: string;
}

export const TemplateInfoBanner: React.FC<TemplateInfoBannerProps> = ({
  text = "Templates are fully modular. Every element can be individually customized on your timeline after applying.",
}) => {
  return (
    <div className="rounded-xl bg-amber-950/30 border border-amber-900/40 p-2.5 flex items-start gap-2 shrink-0">
      <span className="text-amber-400 text-sm shrink-0">📐</span>
      <p className="text-[10px] text-amber-200/80 leading-snug">
        <span className="font-bold text-amber-300">Modular Templates: </span>
        {text}
      </p>
    </div>
  );
};
