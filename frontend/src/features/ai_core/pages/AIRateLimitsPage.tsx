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

const ALL_PROVIDER_SPEC: ProviderFullSpec = {
  id: "all",
  name: "All Providers",
  group: "foundation",
  icon: Layers,
  badge: "All AI Engines",
  color: "from-blue-600 to-indigo-600",
  borderHover: "hover:border-blue-500",
  docsUrl: "#",
  resetInfo: "Resets every minute / daily at 00:00 UTC",
  priorityFeature: {
    title: "Priority Speed Queue",
    description: "Fast-track processing for high-volume jobs",
    toggleLabel: "Priority Mode",
    activeText: "Fast Priority Active",
    standardText: "Standard Queue",
  },
  batchFeature: {
    title: "Batch Processing",
    discount: "50% Savings",
    highlight: "Non-Urgent Tasks",
    subtext: "Process multiple chapters in the background at half cost",
  },
  tiers: [
    { id: "free", label: "Free Plan", qualification: "Default sandbox", spend10Min: "$0", billingCap: "Free Rate Limits" },
    { id: "tier1", label: "Creator (Tier 1)", qualification: "Active account", spend10Min: "$50", billingCap: "Standard Paid Limits" },
    { id: "tier2", label: "Pro (Tier 2)", qualification: "Verified creator", spend10Min: "$500", billingCap: "High Concurrency" },
    { id: "tier3", label: "Studio (Tier 3)", qualification: "Studio tier", spend10Min: "$5,000", billingCap: "Unlimited / Custom" },
  ],
};

export default function AIRateLimitsPage({ addNotification }: AIRateLimitsPageProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [selectedTierId, setSelectedTierId] = useState<string>("tier1");
  const [isPriorityInference, setIsPriorityInference] = useState<boolean>(false);
  const [models, setModels] = useState<AIModelCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load models dynamically from REST API
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
    const interval = setInterval(loadModels, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentProviderSpec: ProviderFullSpec =
    selectedProviderId === "all"
      ? ALL_PROVIDER_SPEC
      : PROVIDER_FULL_SPECS.find((p) => p.id === selectedProviderId) || PROVIDER_FULL_SPECS[0];

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
            `Refreshed live rate limits for ${currentProviderSpec.name}!`,
            "success"
          );
        }
      }
    } catch {
      addNotification?.("Could not refresh live rate limits.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isMatchProvider = (m: AIModelCardData, providerId: string) => {
    if (providerId === "all") return true;
    const p = (m.provider || "").toLowerCase();
    const id = (m.id || "").toLowerCase();
    const target = providerId.toLowerCase();

    if (target === "gemini" || target === "google") {
      return p === "gemini" || p === "google" || id.includes("gemini") || id.includes("imagen");
    }
    if (target === "openai") {
      return p === "openai" || id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("dall");
    }
    if (target === "anthropic") {
      return p === "anthropic" || id.includes("claude");
    }
    if (target === "groq") {
      return p === "groq" || id.includes("groq");
    }
    if (target === "deepseek") {
      return p === "deepseek" || id.includes("deepseek");
    }
    if (target === "elevenlabs") {
      return p === "elevenlabs" || id.includes("eleven");
    }
    if (target === "deepl") {
      return p === "deepl";
    }
    return p === target;
  };

  const allSpecsList = [ALL_PROVIDER_SPEC, ...PROVIDER_FULL_SPECS];

  const visibleProviders =
    selectedGroupFilter === "all"
      ? allSpecsList
      : PROVIDER_FULL_SPECS.filter((p) => p.group === selectedGroupFilter);

  const providerModels = models.filter((m) => isMatchProvider(m, selectedProviderId));

  const filteredModels = providerModels.filter((m) =>
    searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.provider && m.provider.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const activeTier =
    currentProviderSpec.tiers.find((t) => t.id === selectedTierId) || currentProviderSpec.tiers[0];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200 text-left text-[#E5E5E5]">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* ── STEP 1: TOP-LEVEL PROVIDER SELECTION MATRIX ── */}
        <div className="space-y-4 p-5 rounded-2xl bg-[#181818] border border-[#2F2F2F] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                Select AI Engine
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
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[#0E0E0E] text-neutral-400 hover:text-neutral-200 border border-[#2F2F2F]"
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
            {visibleProviders.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedProviderId === tab.id;
              const modelCount =
                tab.id === "all"
                  ? models.length
                  : models.filter((m) => isMatchProvider(m, tab.id)).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedProviderId(tab.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${
                    isSelected
                      ? "bg-[#141414] border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-[#141414] border-[#2F2F2F] hover:border-neutral-500 hover:bg-[#181818]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 bg-[#0E0E0E] px-2 py-0.5 rounded border border-[#2F2F2F]">
                      {modelCount} {modelCount === 1 ? "model" : "models"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white font-sans truncate">
                      {tab.name}
                    </h4>
                    <span className="text-[10px] font-medium text-blue-400 block mt-0.5 truncate">
                      {tab.badge}
                    </span>
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
          onTogglePriorityInference={() =>
            setIsPriorityInference(!isPriorityInference)
          }
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
    </div>
  );
}
