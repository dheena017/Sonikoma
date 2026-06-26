import React from "react";
import {
  Sliders,
  Search,
  RefreshCw,
  CheckCircle,
  Check,
  Scale,
} from "lucide-react";

interface ModelRegistryExplorerProps {
  globalSelectedModel: string;
  compareModelList: string[];
  models: any[];
  loadingModels: boolean;
  modelsError: string | null;
  filterQuery: string;
  setFilterQuery: (q: string) => void;
  selectedProvider: "gemini" | "huggingface" | "openai" | "anthropic";
  handleProviderTabChange: (prov: "gemini" | "huggingface" | "openai" | "anthropic") => void;
  showFreeOnly: boolean;
  setShowFreeOnly: (v: boolean) => void;
  fetchModels: (prov?: any) => Promise<void>;
  handleToggleCompare: (modelId: string) => void;
  handleSetActiveModel: (modelId: string) => void;
  setPlaygroundModel: (modelId: string) => void;
  setPlaygroundProvider: (prov: string) => void;
  addNotification: (msg: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function ModelRegistryExplorer({
  globalSelectedModel,
  compareModelList,
  models,
  loadingModels,
  modelsError,
  filterQuery,
  setFilterQuery,
  selectedProvider,
  handleProviderTabChange,
  showFreeOnly,
  setShowFreeOnly,
  fetchModels,
  handleToggleCompare,
  handleSetActiveModel,
  setPlaygroundModel,
  setPlaygroundProvider,
  addNotification,
}: ModelRegistryExplorerProps) {
  return (
    <div className="bg-neutral-955/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-400" />
              Model Registry Explorer
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Browse and filter supported vision/chat models. Highlight a model to set as active or load into benchmark playground.
            </p>
          </div>
          {models.length > 0 && (
            <span className="text-[10px] font-mono bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg text-purple-300">
              {models.length} Models Found
            </span>
          )}
        </div>

        {/* Provider Tabs, Search, and Free Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 font-mono text-xs">
          {/* Tabs */}
          <div className="flex bg-neutral-900/60 p-1 rounded-xl border border-neutral-850 text-xs font-mono flex-1">
            {(["gemini", "huggingface", "openai", "anthropic"] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => handleProviderTabChange(prov)}
                className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer font-bold capitalize ${
                  selectedProvider === prov
                    ? "bg-purple-650 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {prov === "huggingface" ? "Hugging Face" : prov}
              </button>
            ))}
          </div>

          {/* Search & filters */}
          <div className="flex gap-2 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-neutral-500 my-auto" />
              <input
                type="text"
                placeholder={`Search ${selectedProvider === "huggingface" ? "HF" : selectedProvider} models...`}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            {selectedProvider === "gemini" && (
              <button
                onClick={() => setShowFreeOnly(!showFreeOnly)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 cursor-pointer shrink-0 ${
                  showFreeOnly
                    ? "bg-purple-950/40 text-purple-300 border-purple-500/40 font-bold"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {showFreeOnly ? "⚡ Free Tier Only" : "Show Free Only"}
              </button>
            )}
          </div>
        </div>

        {/* List Loader / Error / Empty States */}
        {loadingModels && (
          <div className="text-center py-12 text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            Querying {selectedProvider} dynamic capability list...
          </div>
        )}

        {!loadingModels && modelsError && (
          <div className="p-8 rounded-2xl border border-rose-500/10 bg-rose-955/10 text-rose-350 text-xs font-mono text-center space-y-2">
            <p>Failed to query API models for {selectedProvider}: {modelsError}</p>
            <button
              onClick={() => fetchModels(selectedProvider)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
            >
              Retry Query
            </button>
          </div>
        )}

        {!loadingModels && !modelsError && models.length === 0 && (
          <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/10 text-neutral-500 text-xs font-mono text-center">
            No active configurations loaded for {selectedProvider}. Ensure credentials are configured.
          </div>
        )}

        {/* Models Table */}
        {!loadingModels && !modelsError && models.length > 0 && (
          <div className="overflow-x-auto border border-neutral-900 rounded-2xl max-h-[400px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-880 text-neutral-450 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-[5]">
                  <th className="p-4">Model Name</th>
                  <th className="p-4">Model Identifier</th>
                  <th className="p-4">Tier / Pricing</th>
                  <th className="p-4">Token Limits</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models
                  .filter((m) => m.name.toLowerCase().includes(filterQuery.toLowerCase()))
                  .filter((m) => {
                    if (!showFreeOnly) return true;
                    if (selectedProvider !== "gemini") return true;
                    const name = m.name.toLowerCase();
                    return name.includes("flash") || name.includes("lite") || name.includes("8b") || name.includes("gemma") || name.includes("banana");
                  })
                  .map((m, idx) => {
                    const isCurrentlyActive = globalSelectedModel === m.name;
                    const isHuggingFace = selectedProvider === "huggingface";
                    const pricingBadge = isHuggingFace
                      ? { text: "Open-Source", className: "bg-emerald-950/40 text-emerald-450 border-emerald-800/30" }
                      : selectedProvider === "gemini" && !m.name.includes("pro")
                      ? { text: "Free Tier", className: "bg-purple-950/40 text-purple-300 border-purple-800/30" }
                      : { text: "Paid Model", className: "bg-amber-950/40 text-amber-450 border-amber-800/30" };

                    return (
                      <tr key={idx} className={`border-b border-neutral-900/60 hover:bg-neutral-900/20 transition-all ${isCurrentlyActive ? "bg-purple-950/5" : ""}`}>
                        <td className="p-4 font-bold text-white max-w-[200px] truncate" title={m.displayName || m.name}>
                          {m.displayName || m.name}
                        </td>
                        <td className="p-4 text-[10px] text-neutral-400 select-all max-w-[250px] truncate" title={m.fullName || m.name}>
                          {m.name}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${pricingBadge.className}`}>
                            {pricingBadge.text}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-400 text-[10px]">
                          {m.inputTokenLimit ? (
                            <span>In: {m.inputTokenLimit.toLocaleString()} | Out: {m.outputTokenLimit?.toLocaleString() || "N/A"}</span>
                          ) : (
                            <span className="text-neutral-600">Dynamic limit</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setPlaygroundModel(m.name);
                                setPlaygroundProvider(selectedProvider);
                                addNotification(`Loaded ${m.name} into Playground`, "info");
                                const element = document.getElementById("playground-section");
                                if (element) element.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-neutral-300 rounded-lg text-[10px] cursor-pointer transition-all"
                            >
                              Test Playground
                            </button>
                            <button
                              onClick={() => handleToggleCompare(m.name)}
                              className={`px-2.5 py-1 border rounded-lg text-[10px] cursor-pointer transition-all flex items-center gap-1 ${
                                compareModelList.includes(m.name)
                                  ? "bg-purple-950/60 border-purple-500/40 text-purple-300 font-bold"
                                  : "bg-neutral-900 hover:bg-neutral-855 border-neutral-855 text-neutral-450 hover:text-white"
                              }`}
                            >
                              {compareModelList.includes(m.name) ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-purple-400" /> Compared
                                </>
                              ) : (
                                <>
                                  <Scale className="h-3.5 w-3.5" /> Compare
                                </>
                              )}
                            </button>
                            {isCurrentlyActive ? (
                              <span className="bg-emerald-950/30 text-emerald-450 border border-emerald-800/30 text-[9px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Active
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetActiveModel(m.name)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                              >
                                Set Active
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
