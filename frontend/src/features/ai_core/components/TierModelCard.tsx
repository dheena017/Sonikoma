import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  ShieldCheck,
  Layers,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  DollarSign,
  Gauge,
  Activity,
  Cpu,
  X,
} from "lucide-react";

export interface DynamicModelOption {
  id: string;
  name: string;
  provider: string;
  provider_name: string;
  category?: string;
  speed_rating?: string;
  cost_per_1m_prompt?: number;
  cost_per_1m_completion?: number;
  price_per_image?: number;
  price_per_1k_chars?: number;
  context_window?: number | string;
  max_output_tokens?: number;
  capabilities?: string[];
  status?: string;
  recommended_for?: string[];
}

export type TierType = "primary" | "fallback" | "tertiary";

interface TierModelCardProps {
  tierType: TierType;
  modelId: string;
  availableModels: DynamicModelOption[];
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const TIER_CONFIG: Record<
  TierType,
  {
    title: string;
    subtitle: string;
    color: string;
    bgAccent: string;
    borderAccent: string;
    icon: React.ElementType;
    badgeBg: string;
  }
> = {
  primary: {
    title: "Tier 1 · Primary",
    subtitle: "Active Default Engine",
    color: "#3B82F6", // Electric Blue
    bgAccent: "rgba(59, 130, 246, 0.08)",
    borderAccent: "rgba(59, 130, 246, 0.35)",
    icon: Zap,
    badgeBg: "rgba(59, 130, 246, 0.18)",
  },
  fallback: {
    title: "Tier 2 · Fallback",
    subtitle: "High-Speed Backup",
    color: "#10B981", // Emerald
    bgAccent: "rgba(16, 185, 129, 0.08)",
    borderAccent: "rgba(16, 185, 129, 0.35)",
    icon: ShieldCheck,
    badgeBg: "rgba(16, 185, 129, 0.18)",
  },
  tertiary: {
    title: "Tier 3 · Emergency",
    subtitle: "Failover Redundancy",
    color: "#F59E0B", // Amber
    bgAccent: "rgba(245, 158, 11, 0.08)",
    borderAccent: "rgba(245, 158, 11, 0.35)",
    icon: Layers,
    badgeBg: "rgba(245, 158, 11, 0.18)",
  },
};

const PROVIDER_THEMES: Record<
  string,
  { name: string; bg: string; text: string; border: string }
> = {
  anthropic: {
    name: "ANTHROPIC",
    bg: "rgba(217, 119, 6, 0.15)",
    text: "#fbbf24",
    border: "rgba(217, 119, 6, 0.35)",
  },
  openai: {
    name: "OPENAI",
    bg: "rgba(16, 185, 129, 0.15)",
    text: "#34d399",
    border: "rgba(16, 185, 129, 0.35)",
  },
  gemini: {
    name: "GOOGLE GEMINI",
    bg: "rgba(99, 102, 241, 0.15)",
    text: "#818cf8",
    border: "rgba(99, 102, 241, 0.35)",
  },
  google: {
    name: "GOOGLE",
    bg: "rgba(99, 102, 241, 0.15)",
    text: "#818cf8",
    border: "rgba(99, 102, 241, 0.35)",
  },
  elevenlabs: {
    name: "ELEVENLABS",
    bg: "rgba(236, 72, 153, 0.15)",
    text: "#f472b6",
    border: "rgba(236, 72, 153, 0.35)",
  },
  deepl: {
    name: "DEEPL",
    bg: "rgba(14, 165, 233, 0.15)",
    text: "#38bdf8",
    border: "rgba(14, 165, 233, 0.35)",
  },
  huggingface: {
    name: "HUGGINGFACE / FLUX",
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#fbbf24",
    border: "rgba(245, 158, 11, 0.35)",
  },
  deepseek: {
    name: "DEEPSEEK",
    bg: "rgba(59, 130, 246, 0.15)",
    text: "#60a5fa",
    border: "rgba(59, 130, 246, 0.35)",
  },
  stablediffusion: {
    name: "STABLE DIFFUSION",
    bg: "rgba(168, 85, 247, 0.15)",
    text: "#c084fc",
    border: "rgba(168, 85, 247, 0.35)",
  },
  edgetts: {
    name: "EDGE TTS",
    bg: "rgba(75, 85, 99, 0.25)",
    text: "#9ca3af",
    border: "rgba(75, 85, 99, 0.4)",
  },
};

export default function TierModelCard({
  tierType,
  modelId,
  availableModels,
  onModelChange,
  disabled = false,
}: TierModelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cfg = TIER_CONFIG[tierType];
  const TierIcon = cfg.icon;

  // Infer provider key directly from modelId if selectedModel is missing or incomplete
  const inferProvider = (id: string = "") => {
    const lower = id.toLowerCase();
    if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
    if (
      lower.includes("gpt") ||
      lower.includes("o1") ||
      lower.includes("o3") ||
      lower.includes("openai") ||
      lower.includes("dall")
    )
      return "openai";
    if (
      lower.includes("gemini") ||
      lower.includes("imagen") ||
      lower.includes("google")
    )
      return "gemini";
    if (
      lower.includes("groq") ||
      lower.includes("llama") ||
      lower.includes("mixtral")
    )
      return "groq";
    if (lower.includes("deepseek")) return "deepseek";
    if (lower.includes("eleven")) return "elevenlabs";
    if (lower.includes("deepl")) return "deepl";
    return "gemini";
  };

  // Selected model details
  const selectedModel = availableModels.find((m) => m.id === modelId);
  const providerKey =
    selectedModel?.provider?.toLowerCase() || inferProvider(modelId);
  const provTheme = PROVIDER_THEMES[providerKey] || {
    name:
      selectedModel?.provider_name?.toUpperCase() ||
      providerKey.toUpperCase(),
    bg: "rgba(139, 92, 246, 0.15)",
    text: "#a78bfa",
    border: "rgba(139, 92, 246, 0.35)",
  };

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const [providerFilter, setProviderFilter] = useState<string>(providerKey);

  // Sync provider filter with selected model provider when opened
  useEffect(() => {
    if (isOpen) {
      setProviderFilter(providerKey);
    }
  }, [isOpen, providerKey]);

  // Extract unique providers in catalog
  const availableProviders = React.useMemo(() => {
    const set = new Set<string>();
    availableModels.forEach((m) => {
      const p = m.provider?.toLowerCase() || inferProvider(m.id);
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [availableModels]);

  const filteredModels = availableModels.filter((m) => {
    const p = m.provider?.toLowerCase() || inferProvider(m.id);
    const matchesProvider =
      providerFilter === "all" || p === providerFilter;
    const matchesSearch =
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()));
    return matchesProvider && matchesSearch;
  });

  // Format pricing string
  const getPricingLabel = (m?: any) => {
    if (!m) return "$0.00";
    if (m.price_per_image !== undefined && m.price_per_image > 0) {
      return `$${m.price_per_image.toFixed(3)}/img`;
    }
    if (m.price_per_1k_chars !== undefined && m.price_per_1k_chars > 0) {
      return `$${m.price_per_1k_chars.toFixed(2)}/1K char`;
    }
    const cost1m = m.cost_per_1m_prompt ?? m.prompt_price_per_1m;
    if (cost1m !== undefined && cost1m > 0) {
      return `$${Number(cost1m).toFixed(2)}/1M`;
    }
    return "Included / Free";
  };

  // Format context label
  const getContextLabel = (m?: any) => {
    if (!m) return "General";
    if (typeof m.context_window === "number") {
      if (m.context_window >= 1000000)
        return `${(m.context_window / 1000000).toFixed(1)}M ctx`;
      if (m.context_window >= 1000)
        return `${Math.round(m.context_window / 1000)}K ctx`;
      return `${m.context_window} ctx`;
    }
    return m.category || "General";
  };

  // Format speed label
  const getSpeedLabel = (m?: any) => {
    if (!m) return "Fast";
    if (m.speed_rating) {
      return m.speed_rating.split("(")[0].trim();
    }
    const idLower = (m.id || "").toLowerCase();
    if (idLower.includes("flash") || idLower.includes("mini") || idLower.includes("haiku") || idLower.includes("turbo")) {
      return "Ultra Fast";
    }
    return "Standard";
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative flex flex-col rounded-2xl border transition-all duration-200 overflow-visible ${
        isOpen ? "z-40" : "z-10"
      }`}
      style={{
        backgroundColor: "#141414",
        borderColor: isOpen ? cfg.color : cfg.borderAccent,
        boxShadow: isOpen
          ? `0 0 20px ${cfg.color}33, 0 0 0 1px ${cfg.color}`
          : "none",
      }}
    >
      {/* ── CARD HEADER (TIER BADGE & ROLE) ── */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b gap-2"
        style={{
          backgroundColor: cfg.bgAccent,
          borderColor: "#2F2F2F",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="flex items-center justify-center w-5 h-5 rounded-lg text-xs shrink-0"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}
          >
            <TierIcon className="w-3.5 h-3.5" />
          </span>
          <span
            className="text-[11px] font-bold font-mono tracking-wider uppercase truncate leading-none"
            style={{ color: cfg.color }}
          >
            {cfg.title}
          </span>
        </div>
        <span className="text-[10px] text-[#9CA3AF] font-sans truncate font-medium">
          {selectedModel?.category || "Specialized Engine"}
        </span>
      </div>

      {/* ── CARD BODY (SELECT-TYPE TRIGGER & TELEMETRY) ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        {/* ── SELECT TYPE TRIGGER BOX ── */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full text-left p-2.5 rounded-xl border bg-neutral-950/70 hover:bg-neutral-900 transition-all duration-150 cursor-pointer shadow-inner group"
          style={{
            borderColor: isOpen ? cfg.color : "#2F2F2F",
            boxShadow: isOpen ? `0 0 14px ${cfg.color}33` : "none",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* 1. PROVIDER BADGE */}
            <span
              className="text-[8.5px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase shrink-0"
              style={{
                backgroundColor: provTheme.bg,
                color: provTheme.text,
                borderColor: provTheme.border,
              }}
            >
              {provTheme.name}
            </span>

            {/* Dropdown Chevron indicator */}
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-neutral-400 group-hover:text-white"
              style={{
                color: isOpen ? cfg.color : undefined,
                transform: isOpen ? "rotate(180deg)" : "none",
              }}
            />
          </div>

          {/* 2. SELECTED MODEL NAME */}
          <div className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
            {selectedModel?.name || modelId || "Select Model"}
          </div>
        </button>

        {/* Telemetry & Live Specs Metric Pills */}
        <div className="grid grid-cols-3 gap-1.5 py-0.5 text-[10px] font-mono">
          {/* Speed */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2F2F2F] bg-[#121212] truncate"
            title={selectedModel?.speed_rating || "Fast inference"}
          >
            <Gauge className="w-3 h-3 text-[#F59E0B] shrink-0" />
            <span className="text-[#E5E5E5] truncate">
              {getSpeedLabel(selectedModel)}
            </span>
          </div>

          {/* Pricing */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2F2F2F] bg-[#121212] truncate"
            title="Estimated Prompt / Token Cost"
          >
            <DollarSign className="w-3 h-3 text-[#10B981] shrink-0" />
            <span className="text-[#E5E5E5] truncate">
              {getPricingLabel(selectedModel)}
            </span>
          </div>

          {/* Context Window */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2F2F2F] bg-[#121212] truncate"
            title="Maximum Token Context"
          >
            <Cpu className="w-3 h-3 text-[#3B82F6] shrink-0" />
            <span className="text-[#E5E5E5] truncate">
              {getContextLabel(selectedModel)}
            </span>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE DROPDOWN FLYOUT ── */}
      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: "#181818",
            borderColor: `${cfg.color}55`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.8), 0 0 15px ${cfg.color}25`,
          }}
        >
          {/* Enhanced Cyber Search Box */}
          <div className="p-2.5 border-b border-white/10 bg-neutral-950/80">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border transition-all duration-200"
              style={{
                borderColor: search ? cfg.color : "#2F2F2F",
                boxShadow: search ? `0 0 12px ${cfg.color}22` : "none",
              }}
            >
              <Search
                className="w-3.5 h-3.5 transition-colors shrink-0"
                style={{ color: search ? cfg.color : "#737373" }}
              />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models by name, role, or ID..."
                className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none border-none ring-0 focus:outline-none focus:ring-0 font-sans"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[9px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 select-none">
                  ESC
                </span>
              )}
            </div>
          </div>

          {/* Provider Filter Tabs */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 border-b overflow-x-auto no-scrollbar"
            style={{ backgroundColor: "rgba(10, 10, 10, 0.7)", borderColor: "#2F2F2F" }}
          >
            {availableProviders.map((p) => {
              const pTheme = PROVIDER_THEMES[p] || PROVIDER_THEMES.gemini;
              const count = availableModels.filter(
                (m) => (m.provider?.toLowerCase() || inferProvider(m.id)) === p
              ).length;
              const isActive = providerFilter === p;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProviderFilter(p)}
                  className="px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  style={{
                    backgroundColor: isActive ? pTheme.bg : "rgba(255, 255, 255, 0.04)",
                    color: isActive ? pTheme.text : "#9ca3af",
                    border: `1px solid ${isActive ? pTheme.border : "rgba(255, 255, 255, 0.06)"}`,
                  }}
                >
                  <span>{pTheme.name}</span>
                  <span className="opacity-60 text-[8.5px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* List of Models */}
          <div
            className="max-h-56 overflow-y-auto divide-y divide-white/5"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: `${cfg.color}44 transparent`,
            }}
          >
            {filteredModels.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-neutral-500">
                No matching models found
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = m.id === modelId;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onModelChange(m.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-all duration-100 cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? `${cfg.color}18`
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(255, 255, 255, 0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold truncate"
                          style={{
                            color: isSelected ? "#ffffff" : "#e5e7eb",
                          }}
                        >
                          {m.name}
                        </span>
                      </div>

                      <div className="text-[10px] text-neutral-400 flex items-center gap-2 font-mono">
                        <span>{m.category || m.provider_name}</span>
                        <span>·</span>
                        <span>{getPricingLabel(m)}</span>
                        {m.speed_rating && (
                          <>
                            <span>·</span>
                            <span>{m.speed_rating.split("(")[0].trim()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        className="flex items-center justify-center w-5 h-5 rounded-full"
                        style={{
                          backgroundColor: cfg.color,
                          color: "#000000",
                        }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
