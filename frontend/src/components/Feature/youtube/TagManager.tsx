import React from "react";
import { Tag, Plus, X } from "lucide-react";

interface TagManagerProps {
  tags: string[];
  tagInput: string;
  setTagInput: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onAddSuggestedTag: (tag: string) => void;
  suggestedTags: string[];
}

export default function TagManager({
  tags,
  tagInput,
  setTagInput,
  onAddTag,
  onRemoveTag,
  onAddSuggestedTag,
  suggestedTags,
}: TagManagerProps) {
  const tagsCharactersCount = tags.join(",").length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      onAddTag();
    }
  };

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex justify-between items-center text-xs font-mono">
        <label className="text-neutral-300 font-bold flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-purple-400" />
          Video Tags ({tags.length})
        </label>
        <span
          className={`font-semibold text-[11px] font-mono ${
            tagsCharactersCount > 500 ? "text-red-400" : "text-neutral-500"
          }`}
        >
          {tagsCharactersCount}/500 chars
        </span>
      </div>

      <div className="bg-neutral-950/40 backdrop-blur-sm border border-neutral-900 rounded-2xl p-4.5 space-y-4 shadow-sm">
        {/* Render Tag Badges */}
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin pr-1">
          {tags.length === 0 ? (
            <span className="text-[11px] text-neutral-550 font-mono italic py-1 pl-1">
              No tags added yet. Enter a keyword below.
            </span>
          ) : (
            tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-purple-950/20 border border-purple-900/40 text-purple-300 rounded-lg px-3 py-1 text-[10.5px] font-mono select-none hover:bg-purple-900/20 transition-all duration-200 animate-fade-in"
              >
                <span>{tag}</span>
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="text-purple-400 hover:text-purple-200 cursor-pointer transition-colors"
                  title={`Remove tag: ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tag Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter tag and press Enter or comma..."
            className="flex-1 bg-neutral-950/30 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none font-mono shadow-inner"
          />
          <button
            onClick={onAddTag}
            className="px-4.5 bg-neutral-900 hover:bg-purple-955/20 border border-neutral-850 hover:border-purple-500/35 text-neutral-300 hover:text-purple-300 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Suggested tags bank based on genre */}
        {suggestedTags.length > 0 && (
          <div className="pt-3 border-t border-neutral-900/60 space-y-2">
            <span className="text-[10px] font-mono text-neutral-500 block font-bold">
              🏷️ AI Suggest Tags (Click to add):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.map((tag) => {
                const isAdded = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => !isAdded && onAddSuggestedTag(tag)}
                    disabled={isAdded}
                    className={`px-3 py-1 rounded-lg font-mono text-[9.5px] font-medium border transition-all duration-200 cursor-pointer ${
                      isAdded
                        ? "bg-neutral-950/20 text-neutral-650 border-neutral-900/40 cursor-not-allowed opacity-40"
                        : "bg-neutral-900/30 hover:bg-purple-950/10 text-neutral-450 hover:text-purple-300 border-neutral-850/60 hover:border-purple-900/35"
                    }`}
                  >
                    +{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
