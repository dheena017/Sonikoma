import React from "react";
import { Search, ExternalLink } from "lucide-react";
import { ProviderFullSpec } from "../../data/providerSpecs";
import AIModelCard, { AIModelCardData } from "../AIModelCard";

interface ProviderInteractiveLimitsProps {
  currentProvider: ProviderFullSpec;
  filteredModels: AIModelCardData[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTierId: string;
  isPriorityInference: boolean;
}

export default function ProviderInteractiveLimits({
  currentProvider,
  filteredModels,
  searchQuery,
  onSearchChange,
  selectedTierId,
  isPriorityInference,
}: ProviderInteractiveLimitsProps) {
  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${currentProvider.name} models by name...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#181818] border border-[#2F2F2F] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {currentProvider.docsUrl !== "#" && (
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>{currentProvider.name} Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Model Cards Grid */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map((m) => (
            <AIModelCard
              key={m.id}
              model={m}
              tier={selectedTierId as any}
              isPriorityInference={isPriorityInference}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-[#2F2F2F] bg-[#181818] text-center space-y-2">
          <p className="text-sm font-bold text-neutral-300">
            No models found matching "{searchQuery}" under {currentProvider.name}
          </p>
          <span className="text-xs text-neutral-500">
            Try searching another model name or clearing the search query.
          </span>
        </div>
      )}
    </div>
  );
}
