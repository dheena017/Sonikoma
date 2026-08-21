import React, { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { AIModelCardData } from "../components/AIModelCard";
import {
  PROVIDER_GROUPS,
  PROVIDER_FULL_SPECS,
  ProviderFullSpec,
} from "../data/providerSpecs";
import ProviderHeroBanner from "../components/rate_limits/ProviderHeroBanner";
import ProviderTierMetrics from "../components/rate_limits/ProviderTierMetrics";
import ProviderInteractiveLimits from "../components/rate_limits/ProviderInteractiveLimits";

interface AIRateLimitsPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

export default function AIRateLimitsPage({ addNotification }: AIRateLimitsPageProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("gemini");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [selectedTierId, setSelectedTierId] = useState<string>("tier1");
  const [isPriorityInference, setIsPriorityInference] = useState<boolean>(false);
  const [models, setModels] = useState<AIModelCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load models dynamically from REST API with live telemetry
  const loadModels = async () => {
    try {
      const res = await fetch("/api/v1/ai/models");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.models_breakdown)) {
          setModels(data.models_breakdown);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadModels();
    // Live streaming telemetry auto-polling every 4 seconds
    const interval = setInterval(loadModels, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentProviderSpec: ProviderFullSpec =
    PROVIDER_FULL_SPECS.find((p) => p.id === selectedProviderId) || PROVIDER_FULL_SPECS[0];

  // Auto-adjust active tier if the new provider has different tier IDs
  useEffect(() => {
    const exists = currentProviderSpec.tiers.some((t) => t.id === selectedTierId);
    if (!exists && currentProviderSpec.tiers.length > 0) {
      setSelectedTierId(currentProviderSpec.tiers[0].id);
    }
  }, [selectedProviderId, currentProviderSpec]);

  const handleSyncLiveQuotas = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/ai/models/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.models_breakdown)) {
            setModels(data.models_breakdown);
          }
          addNotification?.(
            `🔄 Synchronized live speed limits and quota meters for ${currentProviderSpec.name}!`,
            "success"
          );
        }
      }
    } catch {
      addNotification?.("Failed to synchronize live speed limits.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const visibleProviders =
    selectedGroupFilter === "all"
      ? PROVIDER_FULL_SPECS
      : PROVIDER_FULL_SPECS.filter((p) => p.group === selectedGroupFilter);

  const providerModels = models.filter(
    (m) => m.provider.toLowerCase() === selectedProviderId.toLowerCase()
  );

  const filteredModels = providerModels.filter((m) =>
    searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const activeTier =
    currentProviderSpec.tiers.find((t) => t.id === selectedTierId) || currentProviderSpec.tiers[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── STEP 1: TOP-LEVEL PROVIDER SELECTION MATRIX ────────────────────── */}
      <div className="space-y-3 p-5 rounded-2xl bg-[#121212] border border-neutral-850 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              Select AI Engine Provider
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PROVIDER_GROUPS.map((grp) => (
              <button
                key={grp.id}
                onClick={() => setSelectedGroupFilter(grp.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGroupFilter === grp.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>
        </div>

        {/* 11 Provider Selection Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {visibleProviders.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedProviderId === tab.id;
            const modelCount = models.filter((m) => m.provider.toLowerCase() === tab.id.toLowerCase()).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedProviderId(tab.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#222222] border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10 scale-[1.02]"
                    : `bg-[#161616] border-neutral-850 ${tab.borderHover} hover:bg-[#1a1a1a]`
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${tab.color} text-white shadow-sm`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {modelCount} {modelCount === 1 ? "model" : "models"}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white font-sans truncate">{tab.name}</h4>
                  <span className="text-[10px] font-mono text-purple-400 block mt-0.5 truncate">{tab.badge}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: ACTIVE PROVIDER HERO BANNER ───────────────────────────── */}
      <ProviderHeroBanner
        currentProvider={currentProviderSpec}
        isRefreshing={isRefreshing}
        onSyncLiveQuotas={handleSyncLiveQuotas}
      />

      {/* ── STEP 3: ACTIVE PROVIDER TIERS & SPEND METRICS (4 CARDS) ───────── */}
      <ProviderTierMetrics
        currentProvider={currentProviderSpec}
        selectedTierId={selectedTierId}
        onSelectTierId={setSelectedTierId}
        isPriorityInference={isPriorityInference}
        onTogglePriorityInference={() => setIsPriorityInference(!isPriorityInference)}
        activeTier={activeTier}
      />

      {/* ── STEP 4: MODEL INTERACTIVE LIMITS (RPM / TPM / RPD) ───────────── */}
      <ProviderInteractiveLimits
        currentProvider={currentProviderSpec}
        filteredModels={filteredModels}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTierId={selectedTierId}
        isPriorityInference={isPriorityInference}
      />
    </div>
  );
}
