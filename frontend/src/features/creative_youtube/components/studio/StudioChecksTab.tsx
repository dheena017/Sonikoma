import React from "react";
import { ShieldCheck, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export interface StudioChecksTabProps {
  seoScore: number;
  tags: string[];
  tagInput: string;
  setTagInput: (val: string) => void;
  suggestedTags: string[];
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleAddSuggestedTag: (tag: string) => void;
  ratings: {
    noLanguage: boolean;
    noViolence: boolean;
    noAdultContent: boolean;
    noHarmfulActs: boolean;
  };
  setRatings: React.Dispatch<
    React.SetStateAction<{
      noLanguage: boolean;
      noViolence: boolean;
      noAdultContent: boolean;
      noHarmfulActs: boolean;
    }>
  >;
  onBack: () => void;
  onNext: () => void;
}

export default function StudioChecksTab({
  seoScore,
  tags,
  tagInput,
  setTagInput,
  suggestedTags,
  handleAddTag,
  handleRemoveTag,
  handleAddSuggestedTag,
  ratings,
  setRatings,
  onBack,
  onNext,
}: StudioChecksTabProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="border-b border-neutral-800 pb-4">
        <h3 className="text-base font-black text-white font-sans tracking-tight">Checks</h3>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          We'll let you know if there are any issues with your video before publishing
        </p>
      </div>

      {/* Copyright check banner */}
      <div className="p-4 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 flex items-center gap-4">
        <div className="p-2.5 bg-emerald-600/20 rounded-xl border border-emerald-500/30 shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-sans">Copyright check</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
              No issues found
            </span>
          </div>
          <p className="text-[10.5px] text-neutral-400 font-mono mt-0.5">
            No copyright claims detected in your video or audio tracks.
          </p>
        </div>
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      </div>

      {/* SEO score bar */}
      <div className="space-y-2 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white font-sans">SEO score</span>
          <span
            className={`text-xs font-black font-mono ${
              seoScore >= 70 ? "text-emerald-400" : seoScore >= 40 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {seoScore}/100
          </span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              seoScore >= 70
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : seoScore >= 40
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-red-600 to-red-400"
            }`}
            style={{ width: `${seoScore}%` }}
          />
        </div>
        <p className="text-[10.5px] text-neutral-400 font-mono">
          {seoScore >= 70
            ? "Great! Your video is well-optimized for search."
            : seoScore >= 40
            ? "Add more tags and a longer description to improve ranking."
            : "Add a title, description, and tags to improve discoverability."}
        </p>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
            Tags
          </label>
          <span
            className={`text-[10px] font-mono ${
              tags.join(",").length > 450 ? "text-amber-400" : "text-neutral-600"
            }`}
          >
            {tags.join(",").length}/500 chars
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag and press Enter or comma"
            className="flex-1 bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono rounded-xl transition-all cursor-pointer"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {suggestedTags.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Suggested</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags
                .filter((t) => !tags.includes(t))
                .slice(0, 10)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddSuggestedTag(tag)}
                    className="px-2.5 py-1 rounded-full border border-neutral-700 hover:border-red-500/60 text-neutral-400 hover:text-white text-[10px] font-mono transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Self-certification */}
      <div className="space-y-3 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <span className="text-xs font-bold text-white font-sans">Self-certification</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            Optional
          </span>
        </div>
        <p className="text-[10.5px] text-neutral-400 font-mono leading-relaxed">
          Certify your video doesn't contain the following content to get a better audience match.
        </p>
        <div className="space-y-2">
          {(Object.entries(ratings) as [keyof typeof ratings, boolean][]).map(([key, val]) => {
            const labels: Record<string, string> = {
              noLanguage: "No strong language or profanity",
              noViolence: "No graphic violence or disturbing imagery",
              noAdultContent: "No sexual content or nudity",
              noHarmfulActs: "No dangerous or harmful acts",
            };
            return (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() => setRatings((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="accent-red-600 w-3.5 h-3.5 shrink-0"
                />
                <span className="text-xs text-neutral-300 font-mono group-hover:text-white transition-colors">
                  {labels[key]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
        >
          <span>Next: Visibility</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
