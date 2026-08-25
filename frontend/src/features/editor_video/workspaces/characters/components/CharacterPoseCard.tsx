import React from "react";
import { Sparkles, Check } from "lucide-react";

interface CharacterPoseCardProps {
  pose: { id: string; title: string; tag: string; angle?: string; icon?: string };
  onApply: () => void;
}

export const CharacterPoseCard: React.FC<CharacterPoseCardProps> = ({
  pose,
  onApply,
}) => {
  const [applied, setApplied] = React.useState(false);

  const handleApply = () => {
    setApplied(true);
    onApply();
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div
      onClick={handleApply}
      className="p-3 rounded-2xl bg-[#090814] border border-white/5 hover:border-purple-500/40 flex items-center justify-between cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-[0_4px_20px_rgba(168,85,247,0.15)]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition-transform">
          {pose.icon || "🧍"}
        </div>
        <div className="min-w-0">
          <h5 className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors truncate">
            {pose.title}
          </h5>
          {pose.angle && (
            <p className="text-[9px] font-mono text-neutral-400 truncate">
              {pose.angle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[8.5px] font-bold font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/40 uppercase">
          {pose.tag}
        </span>
        <button
          type="button"
          className={`h-7 px-2.5 rounded-lg text-[10px] font-bold font-mono flex items-center gap-1 transition-all ${
            applied
              ? "bg-emerald-600 text-white"
              : "bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30"
          }`}
        >
          {applied ? (
            <>
              <Check className="w-3 h-3" /> Posed
            </>
          ) : (
            <>
              <Sparkles className="w-2.5 h-2.5" /> Apply
            </>
          )}
        </button>
      </div>
    </div>
  );
};

