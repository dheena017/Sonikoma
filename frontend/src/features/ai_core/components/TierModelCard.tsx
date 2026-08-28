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

  // Selected model details
  const selectedModel = availableModels.find((m) => m.id === modelId);
  const providerKey = selectedModel?.provider?.toLowerCase() || "gemini";
  const provTheme = PROVIDER_THEMES[providerKey] || {
    name: selectedModel?.provider_name?.toUpperCase() || "AI PROVIDER",
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

  const filteredModels = availableModels.filter(
    (m) =>
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
  );

  // Format pricing string
  const getPricingLabel = (m?: DynamicModelOption) => {
    if (!m) return "$0.00";
    if (m.price_per_image !== undefined && m.price_per_image > 0) {
      return `$${m.price_per_image.toFixed(3)}/img`;
    }
    if (m.price_per_1k_chars !== undefined && m.price_per_1k_chars > 0) {
      return `$${m.price_per_1k_chars.toFixed(2)}/1K char`;
    }
    if (m.cost_per_1m_prompt !== undefined && m.cost_per_1m_prompt > 0) {
      return `$${m.cost_per_1m_prompt.toFixed(2)}/1M`;
    }
    return "Included / Free";
  };

  // Format context label
  const getContextLabel = (m?: DynamicModelOption) => {
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

  return (
    <div
      ref={dropdownRef}
      className="relative flex flex-col rounded-2xl border transition-all duration-200 overflow-visible"
      style={{
        backgroundColor: "#141414",
        borderColor: isOpen ? cfg.color : cfg.borderAccent,
        boxShadow: isOpen
          ? `0 0 20px ${cfg.color}33, 0 0 0 1px ${cfg.color}`
          : "none",
      }}
    >
      {/* ── CARD HEADER (TIER BADGE & HEALTH STATUS) ── */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b"
        style={{
          backgroundColor: cfg.bgAccent,
          borderColor: "#2F2F2F",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center w-5 h-5 rounded-lg text-xs"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}
          >
            <TierIcon className="w-3.5 h-3.5" />
          </span>
          <div>
            <span
              className="text-[11px] font-bold font-mono tracking-wider uppercase block leading-none"
              style={{ color: cfg.color }}
            >
              {cfg.title}
            </span>
          </div>
        </div>

        {/* Live Health Status Dot */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#121212] border border-[#10B981]/30 text-[9px] font-mono text-[#10B981]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>READY</span>
        </div>
      </div>

      {/* ── CARD BODY (PROVIDER, MODEL NAME & SPECS) ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        {/* Provider badge & Model Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-black font-mono tracking-wider px-2 py-0.5 rounded-md border uppercase"
              style={{
                backgroundColor: provTheme.bg,
                color: provTheme.text,
                borderColor: provTheme.border,
              }}
            >
              {provTheme.name}
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-sans truncate">
              {selectedModel?.category || "Specialized Engine"}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#E5E5E5] truncate tracking-tight pt-0.5">
            {selectedModel?.name || modelId || "Select Model"}
          </h4>
        </div>

        {/* Telemetry & Live Specs Metric Pills */}
        <div className="grid grid-cols-3 gap-1.5 py-1 text-[10px] font-mono">
          {/* Speed */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#2F2F2F] bg-[#121212] truncate"
            title={selectedModel?.speed_rating || "Fast inference"}
          >
            <Gauge className="w-3 h-3 text-[#F59E0B] shrink-0" />
            <span className="text-[#E5E5E5] truncate">
              {selectedModel?.speed_rating
                ? selectedModel.speed_rating.split("(")[0].trim()
                : "Ultra Fast"}
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

        {/* ── SELECTOR BUTTON ── */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer text-left font-mono"
          style={{
            backgroundColor: isOpen ? `${cfg.color}15` : "#181818",
            borderColor: isOpen ? cfg.color : "#2F2F2F",
            color: isOpen ? "#ffffff" : "#E5E5E5",
          }}
        >
          <span className="truncate text-[11px]">
            {isOpen ? "Choose Replacement Engine" : "Change Model / Engine"}
          </span>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200 shrink-0"
            style={{
              color: cfg.color,
              transform: isOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>
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
          {/* Search Box */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 border-b"
            style={{ borderColor: "#2F2F2F" }}
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, provider, or capability..."
              className="flex-1 bg-transparent text-xs text-neutral-200 placeholder-neutral-500 outline-none font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 font-mono"
              >
                CLEAR
              </button>
            )}
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
                const pKey = m.provider?.toLowerCase() || "gemini";
                const pTheme = PROVIDER_THEMES[pKey] || PROVIDER_THEMES.gemini;

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
                          className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase"
                          style={{
                            backgroundColor: pTheme.bg,
                            color: pTheme.text,
                            borderColor: pTheme.border,
                          }}
                        >
                          {pTheme.name}
                        </span>
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
