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
        <label className="text-neutral-400 font-bold flex items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-purple-400" />
          Video Tags ({tags.length})
        </label>
        <span
          className={`font-semibold ${
            tagsCharactersCount > 500 ? "text-red-400" : "text-neutral-500"
          }`}
        >
          {tagsCharactersCount}/500 chars
        </span>
      </div>

      <div className="bg-black/40 border border-neutral-850 rounded-xl p-3.5 space-y-3">
        {/* Render Tag Badges */}
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {tags.length === 0 ? (
            <span className="text-[10px] text-neutral-600 font-mono italic">
              No tags added yet. Enter a keyword below.
            </span>
          ) : (
            tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-purple-950/40 border border-purple-900/60 text-purple-300 rounded-lg px-2.5 py-1 text-[10px] font-mono select-none hover:bg-purple-900/40 transition-colors animate-fade-in"
              >
                <span>{tag}</span>
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="text-purple-400 hover:text-purple-200 cursor-pointer"
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
            className="flex-1 bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-650 focus:outline-none focus:border-purple-500/60 font-mono"
          />
          <button
            onClick={onAddTag}
            className="px-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Suggested tags bank based on genre */}
        {suggestedTags.length > 0 && (
          <div className="pt-2 border-t border-neutral-900/40 space-y-1">
            <span className="text-[9.5px] font-mono text-neutral-550 block font-bold">
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
                    className={`px-2 py-0.5 rounded font-mono text-[9px] border transition-all cursor-pointer ${
                      isAdded
                        ? "bg-neutral-955 text-neutral-650 border-neutral-900 cursor-not-allowed opacity-40"
                        : "bg-neutral-900/50 hover:bg-purple-950/20 text-neutral-450 hover:text-purple-300 border-neutral-800 hover:border-purple-900/40"
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
