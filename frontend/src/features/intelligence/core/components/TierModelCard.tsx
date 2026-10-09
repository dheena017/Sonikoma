import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Zap,
  ShieldCheck,
  Layers,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  Activity,
  X,
  Filter,
} from "lucide-react";
import CyberSelect from "@/shared/ui/common/CyberSelect";

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
  tags?: string[];
  is_free_tier?: boolean;
  free_tier?: boolean | { rpm?: number; tpm?: number; rpd?: number };
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
  requiredTag?: string;
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
    bg: "rgba(59, 130, 246, 0.15)",
    text: "#60a5fa",
    border: "rgba(59, 130, 246, 0.35)",
  },
  edgetts: {
    name: "EDGE TTS",
    bg: "rgba(75, 85, 99, 0.25)",
    text: "#9ca3af",
    border: "rgba(75, 85, 99, 0.4)",
  },
  groq: {
    name: "GROQ CLOUD",
    bg: "rgba(249, 115, 22, 0.15)",
    text: "#fb923c",
    border: "rgba(249, 115, 22, 0.35)",
  },
  whisper: {
    name: "WHISPER AI",
    bg: "rgba(16, 185, 129, 0.15)",
    text: "#34d399",
    border: "rgba(16, 185, 129, 0.35)",
  },
  flux: {
    name: "FLUX / HF",
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#fbbf24",
    border: "rgba(245, 158, 11, 0.35)",
  },
  replicate: {
    name: "REPLICATE",
    bg: "rgba(168, 85, 247, 0.15)",
    text: "#c084fc",
    border: "rgba(168, 85, 247, 0.35)",
  },
  pollinations: {
    name: "POLLINATIONS AI",
    bg: "rgba(168, 85, 247, 0.15)",
    text: "#c084fc",
    border: "rgba(168, 85, 247, 0.35)",
  },
  video_kinetic: {
    name: "KINETIC & VIDEO",
    bg: "rgba(245, 158, 11, 0.15)",
    text: "#fbbf24",
    border: "rgba(245, 158, 11, 0.35)",
  },
  voice_cloning: {
    name: "VOICE DUBBING",
    bg: "rgba(16, 185, 129, 0.15)",
    text: "#34d399",
    border: "rgba(16, 185, 129, 0.35)",
  },
  enhancer: {
    name: "4K ENHANCER",
    bg: "rgba(6, 182, 212, 0.15)",
    text: "#22d3ee",
    border: "rgba(6, 182, 212, 0.35)",
  },
};

export const isProviderKeyConfiguredInVault = (providerKey: string = "") => {
  const p = providerKey.toLowerCase();
  if (
    p === "edgetts" ||
    p === "edge_tts" ||
    p === "stable_diffusion" ||
    p === "stablediffusion" ||
    p === "whisper" ||
    p === "pollinations" ||
    p === "video_kinetic" ||
    p === "voice_cloning" ||
    p === "enhancer" ||
    p === "gemini" ||
    p === "google" ||
    p === "huggingface" ||
    p === "flux"
  ) {
    return true;
  }
  if (p === "openai") {
    return Boolean(
      localStorage.getItem("user_openai_key") ||
        localStorage.getItem("sonikoma_key_openai")
    );
  }
  if (p === "anthropic") {
    return Boolean(
      localStorage.getItem("user_anthropic_key") ||
        localStorage.getItem("sonikoma_key_anthropic")
    );
  }
  if (p === "groq") {
    return Boolean(
      localStorage.getItem("user_groq_key") ||
        localStorage.getItem("sonikoma_key_groq")
    );
  }
  if (p === "deepseek") {
    return Boolean(
      localStorage.getItem("user_deepseek_key") ||
        localStorage.getItem("sonikoma_key_deepseek")
    );
  }
  if (p === "elevenlabs") {
    return Boolean(
      localStorage.getItem("user_elevenlabs_key") ||
        localStorage.getItem("sonikoma_key_elevenlabs")
    );
  }
  if (p === "deepl") {
    return Boolean(
      localStorage.getItem("user_deepl_key") ||
        localStorage.getItem("sonikoma_key_deepl")
    );
  }
  if (p === "huggingface" || p === "flux") {
    return Boolean(
      localStorage.getItem("user_huggingface_key") ||
        localStorage.getItem("sonikoma_key_huggingface")
    );
  }
  return false;
};

export const isModelFree = (m?: DynamicModelOption | any) => {
  if (!m) return false;
  if (m.is_free_tier === true || m.free_tier === true) return true;
  const p = (m.provider || "").toLowerCase();
  if (p === "pollinations" || p === "edgetts" || p === "whisper" || m.id === "parallax") return true;
  if (
    (m.price_per_image === 0 || m.price_per_image === undefined) &&
    (m.cost_per_1m_prompt === 0 || m.cost_per_1m_prompt === undefined) &&
    (m.price_per_1k_chars === 0 || m.price_per_1k_chars === undefined)
  ) {
    if (m.prompt_price_per_1m === 0 && m.completion_price_per_1m === 0) return true;
  }
  return false;
};

export const renderTagBadge = (tag: string) => {
  const tagColors: Record<string, { bg: string; text: string; border: string }> = {
    "Text-to-Image": { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.35)" },
    "Image-to-Text": { bg: "rgba(6, 182, 212, 0.15)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.35)" },
    "Text-to-Text": { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.35)" },
    "Text-to-Video": { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.35)" },
    "Image-to-Video": { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "rgba(249, 115, 22, 0.35)" },
    "Text-to-Speech": { bg: "rgba(236, 72, 153, 0.15)", text: "#f472b6", border: "rgba(236, 72, 153, 0.35)" },
    "Speech-to-Text": { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.35)" },
    "Translation": { bg: "rgba(14, 165, 233, 0.15)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.35)" },
  };
  const color = tagColors[tag] || { bg: "rgba(255, 255, 255, 0.08)", text: "#e5e7eb", border: "rgba(255, 255, 255, 0.15)" };
  return (
    <span
      key={tag}
      className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider shrink-0"
      style={{ backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}
    >
      {tag}
    </span>
  );
};

export default function TierModelCard({
  tierType,
  modelId,
  availableModels,
  onModelChange,
  disabled = false,
  requiredTag,
}: TierModelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cfg = TIER_CONFIG[tierType];
  const TierIcon = cfg.icon;

  // Infer provider key directly from modelId
  const inferProvider = (id: string = "") => {
    const lower = id.toLowerCase();
    if (!id || lower === "") return "none";
    if (lower.includes("claude") || lower.includes("anthropic"))
      return "anthropic";
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
    if (lower.includes("edgetts") || lower.includes("edge_tts"))
      return "edgetts";
    if (lower.includes("stable") || lower.includes("sdxl"))
      return "stablediffusion";
    if (lower.includes("whisper")) return "whisper";
    if (lower.includes("flux") || lower.includes("huggingface"))
      return "huggingface";
    return "gemini";
  };

  // Selected model details
  const selectedModel = availableModels.find((m) => m.id === modelId);
  const hasModel = Boolean(modelId && modelId.trim() !== "");
  const providerKey = hasModel
    ? selectedModel?.provider?.toLowerCase() || inferProvider(modelId)
    : "none";
  const provTheme = (hasModel && PROVIDER_THEMES[providerKey]) || {
    name: hasModel
      ? providerKey !== "none"
        ? providerKey.toUpperCase()
        : "AI ENGINE"
      : "NO MODEL",
    bg: "rgba(99, 102, 241, 0.15)",
    text: "#818cf8",
    border: "rgba(99, 102, 241, 0.35)",
  };
  const isKeyConfigured = hasModel
    ? isProviderKeyConfiguredInVault(providerKey)
    : false;

  // Handle ESC key and lock background scroll when side panel is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const [providerFilter, setProviderFilter] = useState<string>("all");

  // Show all tier models when drawer is opened
  useEffect(() => {
    if (isOpen) {
      setProviderFilter("all");
    }
  }, [isOpen]);

  // Extract unique providers in catalog
  const availableProviders = React.useMemo(() => {
    const set = new Set<string>();
    availableModels.forEach((m) => {
      const p = m.provider?.toLowerCase() || inferProvider(m.id);
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [availableModels]);

  // Provider options for codebase CyberSelect
  const providerOptions = React.useMemo(() => {
    const allOpt = {
      value: "all",
      label: "All Providers",
      badge: `${availableModels.length}`,
      icon: <Filter className="w-3 h-3 text-[#3B82F6]" />,
    };

    const provOpts = availableProviders.map((p) => {
      const pTheme = PROVIDER_THEMES[p] || PROVIDER_THEMES.gemini;
      const count = availableModels.filter(
        (m) => (m.provider?.toLowerCase() || inferProvider(m.id)) === p
      ).length;
      const hasKey = isProviderKeyConfiguredInVault(p);
      return {
        value: p,
        label: pTheme.name,
        badge: `${count}`,
        icon: (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: hasKey ? "#10B981" : "#F59E0B" }}
            title={hasKey ? "Key configured in vault" : "Key required"}
          />
        ),
      };
    });

    return [allOpt, ...provOpts];
  }, [availableModels, availableProviders]);

  const filteredModels = availableModels.filter((m) => {
    const p = m.provider?.toLowerCase() || inferProvider(m.id);
    const matchesProvider = providerFilter === "all" || p === providerFilter;
    const matchesSearch =
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.provider_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()));
    return matchesProvider && matchesSearch;
  });

  // Format pricing string for dropdown items
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
          {hasModel
            ? selectedModel?.category || "Specialized Engine"
            : "Unassigned"}
        </span>
      </div>

      {/* ── CARD BODY (SELECT-TYPE TRIGGER & TELEMETRY) ── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        {/* ── SELECT TYPE TRIGGER BOX ── */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer shadow-inner group ${
            !hasModel
              ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
              : !isKeyConfigured
              ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
              : "bg-neutral-950/70 hover:bg-neutral-900 border-[#2F2F2F]"
          }`}
          style={{
            borderColor: isOpen ? cfg.color : undefined,
            boxShadow: isOpen ? `0 0 14px ${cfg.color}33` : "none",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            {/* 1. PROVIDER BADGE & MODALITY BADGES */}
            {hasModel ? (
              <div className="flex items-center gap-1.5 flex-wrap">
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
                {selectedModel?.tags?.[0] && renderTagBadge(selectedModel.tags[0])}
                {!isKeyConfigured && (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    KEY REQUIRED
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[8.5px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/15 border-amber-500/30 text-amber-400 uppercase shrink-0">
                EMPTY · NO MODEL
              </span>
            )}

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
          <div
            className={`text-xs sm:text-sm font-bold truncate tracking-tight ${
              hasModel ? "text-white" : "text-neutral-400 italic"
            }`}
          >
            {hasModel
              ? selectedModel?.name || modelId
              : "No Model Selected (Click to choose)"}
          </div>
        </button>
      </div>

      {/* ── SLIDE-OVER SIDE PANEL VIA PORTAL ── */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-out Drawer Panel */}
            <div
              className="relative w-full sm:w-[500px] md:w-[560px] max-w-full h-full bg-[#121212] border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 text-white"
              style={{
                boxShadow: `-10px 0 50px rgba(0, 0, 0, 0.85), 0 0 30px ${cfg.color}15`,
              }}
            >
              {/* ── UNIFIED DRAWER HEADER ── */}
              <div
                className="p-4 sm:p-5 border-b space-y-3.5 shrink-0"
                style={{
                  backgroundColor: cfg.bgAccent,
                  borderColor: `${cfg.color}33`,
                }}
              >
                {/* Top Row: Icon, Title, Modality Tag & Close Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                      style={{ backgroundColor: cfg.badgeBg, color: cfg.color }}
                    >
                      <TierIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="text-sm font-bold font-mono tracking-wider uppercase truncate"
                          style={{ color: cfg.color }}
                        >
                          {cfg.title}
                        </h3>
                        {requiredTag && (
                          <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/35 text-purple-300 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                            {requiredTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {cfg.subtitle} · {hasModel ? (selectedModel?.name || modelId) : "No Model Assigned"}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Provider Filter Dropdown + Close Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Provider Dropdown (via codebase CyberSelect) */}
                    <div className="w-40 sm:w-48 shrink-0">
                      <CyberSelect
                        value={providerFilter}
                        onChange={(val) => setProviderFilter(val)}
                        options={providerOptions}
                        variant="blue"
                        size="sm"
                        ariaLabel="Filter models by provider"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="Close side panel (Esc)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 border transition-all duration-200"
                  style={{
                    borderColor: search ? cfg.color : "#2F2F2F",
                    boxShadow: search ? `0 0 14px ${cfg.color}22` : "none",
                  }}
                >
                  <Search
                    className="w-4 h-4 transition-colors shrink-0"
                    style={{ color: search ? cfg.color : "#737373" }}
                  />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search models by name, provider, role, or ID..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none border-none ring-0 focus:outline-none focus:ring-0 font-sans"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 select-none">
                      ESC
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Model List */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: `${cfg.color}44 transparent`,
                }}
              >
                {/* Option 1: None / Keep Empty */}
                <button
                  type="button"
                  onClick={() => {
                    onModelChange("");
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer border ${
                    !hasModel
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      : "bg-white/[0.02] border-white/5 text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <X className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400">
                        None / Keep Empty (No Model)
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Disable this tier or leave slot unassigned
                      </div>
                    </div>
                  </div>
                  {!hasModel && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </button>

                {/* Filtered Models */}
                {filteredModels.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 text-xs">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No models matching "{search}"
                  </div>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = m.id === modelId;
                    const mProvider =
                      m.provider?.toLowerCase() || inferProvider(m.id);
                    const hasKey = isProviderKeyConfiguredInVault(mProvider);
                    const pTheme = PROVIDER_THEMES[mProvider] || PROVIDER_THEMES.gemini;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onModelChange(m.id);
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`w-full flex items-start justify-between gap-3 p-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer border ${
                          isSelected
                            ? "border-transparent"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? `${cfg.color}15`
                            : undefined,
                          borderColor: isSelected ? `${cfg.color}55` : undefined,
                          boxShadow: isSelected
                            ? `0 0 12px ${cfg.color}20`
                            : undefined,
                        }}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          {/* Name + Provider + Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className="text-xs font-bold"
                              style={{
                                color: isSelected ? "#ffffff" : "#f3f4f6",
                              }}
                            >
                              {m.name}
                            </span>
                            <span
                              className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0"
                              style={{
                                backgroundColor: pTheme.bg,
                                color: pTheme.text,
                                borderColor: pTheme.border,
                              }}
                            >
                              {pTheme.name}
                            </span>
                            {m.tags && m.tags.map((t: string) => renderTagBadge(t))}
                            {!hasKey && (
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                                Key Required
                              </span>
                            )}
                          </div>

                          {/* Category and details */}
                          <div className="text-[10px] text-neutral-400 flex items-center gap-2 font-mono flex-wrap">
                            <span className="text-neutral-300 font-medium">
                              {m.category || m.provider_name}
                            </span>
                            {m.speed_rating && (
                              <>
                                <span>·</span>
                                <span className="text-neutral-400">
                                  {m.speed_rating.split("(")[0].trim()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <span
                            className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 shadow-md mt-0.5"
                            style={{
                              backgroundColor: cfg.color,
                              color: "#000000",
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Drawer Bottom Footer */}
              <div className="px-5 py-3 border-t border-white/10 bg-[#161616] flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <div className="font-mono text-[11px]">
                  Showing <span className="text-white font-bold">{filteredModels.length}</span> models
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
