import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  ChevronDown,
  Zap,
  Layers,
  Cpu,
  Bot,
  Sliders,
  DollarSign,
  Gauge,
  ExternalLink,
  Activity,
  Workflow,
  Mic2,
  Globe,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAIModelStore, AIModelInfo } from "@/features/ai_core/hooks/useAIModelStore";

export interface AIModelSelectorProps {
  className?: string;
  compact?: boolean;
  value?: string;
  selectedModel?: string;
  onChange?: (modelId: string) => void;
  fullWidth?: boolean;
}

// Full Comic Pipeline Task Definitions (Matching backend 11 Capabilities)
const PIPELINE_TASKS = [
  {
    id: "storyboard_narrative",
    name: "Storyboard & Script Narration",
    category: "Creative Narration",
    emoji: "📖",
    color: "#a855f7",
    desc: "Episodic comic script & emotional voice acting cues",
  },
  {
    id: "panel_analysis",
    name: "Panel Visual OCR & Reading Flow",
    category: "Vision & Extraction",
    emoji: "🔍",
    color: "#06b6d4",
    desc: "Speech bubble coordinates & visual reading flow",
  },
  {
    id: "scraper_blueprint",
    name: "Universal Scraper Blueprint",
    category: "Vision & Extraction",
    emoji: "🕸️",
    color: "#06b6d4",
    desc: "Chapter metadata & page extraction blueprints",
  },
  {
    id: "image_diffusion",
    name: "Image Diffusion & Inpainting",
    category: "Image Diffusion",
    emoji: "🎨",
    color: "#ec4899",
    desc: "Character art generation & bubble redrawing",
  },
  {
    id: "speech_synthesis",
    name: "Voiceover & Speech Narration",
    category: "Audio & Speech",
    emoji: "🎙️",
    color: "#f59e0b",
    desc: "Multilingual TTS dialogue & narration synthesis",
  },
  {
    id: "translate",
    name: "Manga Dialogue Translation",
    category: "Creative Narration",
    emoji: "🌐",
    color: "#8b5cf6",
    desc: "Webtoon speech bubble multilingual translation",
  },
  {
    id: "prompt_enhancement",
    name: "Prompt Enhancement & Styles",
    category: "Image Diffusion",
    emoji: "✨",
    color: "#ec4899",
    desc: "Diffusion anime lighting & cinematic modifiers",
  },
  {
    id: "character_persona",
    name: "Character Persona & Voice Casting",
    category: "Creative Narration",
    emoji: "🎭",
    color: "#a855f7",
    desc: "Identity extraction & matched voice actor assignment",
  },
  {
    id: "smart_crop",
    name: "Smart Crop & Aspect Ratio Tagger",
    category: "Vision & Extraction",
    emoji: "✂️",
    color: "#10b981",
    desc: "9:16 Shorts & 16:9 widescreen focus bounding boxes",
  },
  {
    id: "seo_optimization",
    name: "YouTube SEO, Chapters & Titles",
    category: "SEO & Marketing",
    emoji: "📈",
    color: "#3b82f6",
    desc: "High-CTR YouTube titles, timestamps & search tags",
  },
  {
    id: "sfx_audio",
    name: "Sound Effects (SFX) & Audio Vibe",
    category: "Audio & Speech",
    emoji: "💥",
    color: "#f97316",
    desc: "Onomatopoeia action sound detection & SFX mapping",
  },
];

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  "Creative Narration": { color: "#c4b5fd", bg: "#7c3aed15", border: "#7c3aed40" },
  "Vision & Extraction": { color: "#67e8f9", bg: "#0891b215", border: "#0891b240" },
  "Audio & Speech": { color: "#fcd34d", bg: "#d9770615", border: "#d9770640" },
  "Image Diffusion": { color: "#f9a8d4", bg: "#db277715", border: "#db277740" },
  "SEO & Marketing": { color: "#86efac", bg: "#16a34a15", border: "#16a34a40" },
};

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  className = "",
}) => {
  const { loadCatalogFromBackend, getAvailableModels } = useAIModelStore();

  useEffect(() => {
    loadCatalogFromBackend();
  }, [loadCatalogFromBackend]);

  const [isOpen, setIsOpen] = useState(false);
  const [routingMap, setRoutingMap] = useState<
    Record<string, { primary: string; fallback?: string; tertiary?: string }>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load live routing map directly from /api/v1/ai/routing
  const fetchRoutingConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/ai/routing");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.routing) {
          setRoutingMap(data.routing);
        }
      }
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutingConfig();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const allModels = getAvailableModels();

  // Model lookup dictionary for fast name resolution
  const modelLookup = useMemo(() => {
    const map = new Map<string, AIModelInfo>();
    allModels.forEach((m) => map.set(m.id, m));
    return map;
  }, [allModels]);

  const formatModelName = (modelId: string | undefined) => {
    if (!modelId) return "Auto Assigned";
    const found = modelLookup.get(modelId);
    if (found) return found.name;
    // Pretty print raw ID fallback
    return modelId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };



  const categories = [
    "All",
    "Creative Narration",
    "Vision & Extraction",
    "Audio & Speech",
    "Image Diffusion",
    "SEO & Marketing",
  ];

  const filteredTasks = PIPELINE_TASKS.filter(
    (t) => selectedFilter === "All" || t.category === selectedFilter
  );

  return (
    <div
      className={`relative inline-flex items-center select-none ${className}`}
      ref={dropdownRef}
    >
      {/* ── Top Header Trigger: Smart Model Routing ──────────────────── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchRoutingConfig();
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-[#0d0d18]/95 hover:bg-purple-950/30 hover:border-purple-500/60 text-neutral-200 transition-all duration-200 shadow-sm focus:outline-none group cursor-pointer"
        title="AI Model Routing: All 11 comic tasks automatically route through specialized engines"
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-400/40 flex items-center justify-center flex-shrink-0">
          <Workflow className="w-3 h-3 text-purple-300 group-hover:rotate-45 transition-transform duration-300" />
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-white tracking-tight">
              AI Smart Routing
            </span>
            <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded tracking-wider bg-purple-950/90 text-purple-300 border border-purple-800/50">
              11 Tasks Active
            </span>
          </div>
          <span className="text-[9px] text-neutral-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Automatic Cascades Enabled
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-purple-400 group-hover:text-white transition-transform duration-200 ml-0.5 ${
            isOpen ? "rotate-180 text-purple-300" : ""
          }`}
        />
      </button>

      {/* ── Smart Model Routing Dashboard Flyout ─────────────────────── */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-[540px] max-w-[95vw] rounded-2xl border shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl"
          style={{
            backgroundColor: "#090910",
            borderColor: "#1e1e32",
            boxShadow:
              "0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px 0 rgba(124, 58, 237, 0.2)",
          }}
        >
          {/* 1. Header Banner */}
          <div
            className="px-4 py-3.5 border-b flex items-center justify-between"
            style={{ borderColor: "#1a1a2e", backgroundColor: "#0e0e1a" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Workflow className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">
                    Smart Model Routing &amp; Cascades
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                  Tasks route automatically via <code className="text-purple-300">/api/v1/ai/routing</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchRoutingConfig}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700 transition-colors"
                title="Refresh Live Routing Config"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
              </button>

              <a
                href="/ai-core?tab=routing"
                className="flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 px-3 py-1.5 rounded-xl transition-all shadow-md shadow-purple-900/30"
                title="Open Full AI Routing Configuration Page"
              >
                Configure Routing
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>



          {/* 3. Category Filter Chips */}
          <div
            className="px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none"
            style={{ borderColor: "#161626", backgroundColor: "#08080f" }}
          >
            {categories.map((cat) => {
              const isSelected = selectedFilter === cat;
              const style = CATEGORY_STYLES[cat] ?? {
                color: "#c4b5fd",
                bg: "#7c3aed15",
                border: "#7c3aed40",
              };

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border border-transparent"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 4. Main 11 Pipelines Routing Grid */}
          <div
            className="p-3.5 max-h-[400px] overflow-y-auto space-y-2"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#4b2d7e transparent" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredTasks.map((task) => {
                const route = routingMap[task.id];
                const primaryId = route?.primary;
                const fallbackId = route?.fallback;
                const tertiaryId = route?.tertiary;

                const primaryName = formatModelName(primaryId);
                const fallbackName = fallbackId ? formatModelName(fallbackId) : null;
                const tertiaryName = tertiaryId ? formatModelName(tertiaryId) : null;

                const catStyle = CATEGORY_STYLES[task.category] ?? {
                  color: "#c4b5fd",
                  bg: "#7c3aed15",
                  border: "#7c3aed40",
                };

                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border transition-all duration-150 text-left relative group hover:border-purple-500/50 flex flex-col justify-between space-y-2"
                    style={{
                      backgroundColor: "#0d0d18",
                      borderColor: "#1b1b2d",
                    }}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-base flex-shrink-0">{task.emoji}</span>
                          <span className="text-[11px] font-bold text-white truncate">
                            {task.name}
                          </span>
                        </div>
                        <span
                          className="text-[8px] font-bold font-mono px-1.5 py-0.2 rounded-full uppercase flex-shrink-0"
                          style={{
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                            border: `1px solid ${catStyle.border}`,
                          }}
                        >
                          {task.category.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-500 font-sans line-clamp-1">
                        {task.desc}
                      </p>
                    </div>

                    {/* Tier 1 Primary Box */}
                    <div className="p-2 rounded-lg bg-[#06060c] border border-neutral-850 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 animate-pulse" />
                          <span className="text-[10px] font-bold text-neutral-100 truncate">
                            {primaryName}
                          </span>
                        </div>
                        <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
                          Tier 1 Primary
                        </span>
                      </div>

                      {/* Tier 2 Fallback snippet */}
                      {fallbackName && (
                        <div className="flex items-center justify-between gap-1 text-[9px] text-neutral-500 font-mono pt-0.5 border-t border-neutral-850/60">
                          <span className="truncate">
                            ↳ Fallback: <span className="text-neutral-400">{fallbackName}</span>
                          </span>
                          <span className="text-[8px] text-emerald-400 font-bold flex-shrink-0">
                            Tier 2
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Footer info & Direct Links */}
          <div
            className="px-4 py-3 border-t text-[10px] text-neutral-400 flex items-center justify-between"
            style={{ borderColor: "#1a1a2e", backgroundColor: "#090912" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                11 / 11 Pipelines Synchronized
              </span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/ai-core?tab=routing"
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-bold"
              >
                Routing Matrix
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="/ai-core?tab=api-keys"
                className="text-neutral-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-semibold"
              >
                API Vault
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelSelector;
