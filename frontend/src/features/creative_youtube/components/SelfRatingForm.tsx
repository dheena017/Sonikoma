import React from "react";
import { FileCheck, ChevronDown, ChevronUp } from "lucide-react";

interface SelfRatingFormProps {
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
  showSelfRating: boolean;
  setShowSelfRating: (val: boolean) => void;
}

export default function SelfRatingForm({
  ratings,
  setRatings,
  showSelfRating,
  setShowSelfRating,
}: SelfRatingFormProps) {
  return (
    <div className="border border-neutral-900 rounded-2xl overflow-hidden animate-fade-in transition-all duration-300 hover:border-neutral-800">
      <button
        onClick={() => setShowSelfRating(!showSelfRating)}
        className="w-full bg-neutral-950/40 backdrop-blur-sm px-4 py-3.5 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors border-b border-neutral-900/60"
      >
        <span className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-purple-400" />
          Monetization Self-Rating Checklist
        </span>
        {showSelfRating ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {showSelfRating && (
        <div className="p-5 bg-neutral-950/20 backdrop-blur-sm space-y-4 text-xs font-sans text-neutral-400 animate-slide-down">
          <p className="text-[10.5px] text-neutral-500 leading-relaxed border-b border-neutral-900 pb-3">
            Review your video content suitability to ensure advertiser-friendly
            guidelines are met:
          </p>

          <div className="space-y-3 pt-1 font-mono text-[11px]">
            <label className="flex items-start gap-3 cursor-pointer hover:text-neutral-200 group">
              <input
                type="checkbox"
                checked={ratings.noLanguage}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    noLanguage: e.target.checked,
                  }))
                }
                className="accent-purple-500 rounded mt-0.5 cursor-pointer h-4 w-4 transition-all duration-200 group-hover:scale-105"
              />
              <span className="transition-colors duration-200">
                Inappropriate Language (Zero profanity or adult slurs)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer hover:text-neutral-200 group">
              <input
                type="checkbox"
                checked={ratings.noViolence}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    noViolence: e.target.checked,
                  }))
                }
                className="accent-purple-500 rounded mt-0.5 cursor-pointer h-4 w-4 transition-all duration-200 group-hover:scale-105"
              />
              <span className="transition-colors duration-200">
                Graphic Violence (No real-world gore or graphic depictions)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer hover:text-neutral-200 group">
              <input
                type="checkbox"
                checked={ratings.noAdultContent}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    noAdultContent: e.target.checked,
                  }))
                }
                className="accent-purple-500 rounded mt-0.5 cursor-pointer h-4 w-4 transition-all duration-200 group-hover:scale-105"
              />
              <span className="transition-colors duration-200">
                Adult Content (No sexually suggestive panel clippings)
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer hover:text-neutral-200 group">
              <input
                type="checkbox"
                checked={ratings.noHarmfulActs}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    noHarmfulActs: e.target.checked,
                  }))
                }
                className="accent-purple-500 rounded mt-0.5 cursor-pointer h-4 w-4 transition-all duration-200 group-hover:scale-105"
              />
              <span className="transition-colors duration-200">
                Harmful or Dangerous Acts (Zero encouragement of danger)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
