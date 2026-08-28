import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Workflow,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  X,
  Search,
  Zap,
  Star,
  Layers,
  Sliders,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { useAIModelStore, AIModelInfo } from "@/features/ai_core/hooks/useAIModelStore";

export interface AISmartRoutingDrawerProps {
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
    category: "Creative",
    emoji: "📖",
    color: "#3B82F6",
    desc: "Episodic comic script & emotional voice acting cues",
  },
  {
    id: "panel_analysis",
    name: "Panel Visual OCR & Reading Flow",
    category: "Vision & OCR",
    emoji: "🔍",
    color: "#06B6D4",
    desc: "Speech bubble coordinates & visual reading flow",
  },
  {
    id: "scraper_blueprint",
    name: "Universal Scraper Blueprint",
    category: "Vision & OCR",
    emoji: "🕸️",
    color: "#06B6D4",
    desc: "Chapter metadata & page extraction blueprints",
  },
  {
    id: "image_diffusion",
    name: "Image Diffusion & Inpainting",
    category: "Image",
    emoji: "🎨",
    color: "#EC4899",
    desc: "Character art generation & bubble redrawing",
  },
  {
    id: "speech_synthesis",
    name: "Voiceover & Speech Narration",
    category: "Audio & Voice",
    emoji: "🎙️",
    color: "#F59E0B",
    desc: "Multilingual TTS dialogue & narration synthesis",
  },
  {
    id: "translate",
    name: "Manga Dialogue Translation",
    category: "Creative",
    emoji: "🌐",
    color: "#8B5CF6",
    desc: "Webtoon speech bubble multilingual translation",
  },
  {
    id: "prompt_enhancement",
    name: "Prompt Enhancement & Styles",
    category: "Image",
    emoji: "✨",
    color: "#EC4899",
    desc: "Diffusion anime lighting & cinematic modifiers",
  },
  {
    id: "character_persona",
    name: "Character Persona & Voice Casting",
    category: "Creative",
    emoji: "🎭",
    color: "#8B5CF6",
    desc: "Identity extraction & matched voice actor assignment",
  },
  {
    id: "smart_crop",
    name: "Smart Crop & Aspect Ratio Tagger",
    category: "Vision & OCR",
    emoji: "✂️",
    color: "#10B981",
    desc: "9:16 Shorts & 16:9 widescreen focus bounding boxes",
  },
  {
    id: "seo_optimization",
    name: "YouTube SEO, Chapters & Titles",
    category: "SEO & Social",
    emoji: "📈",
    color: "#3B82F6",
    desc: "High-CTR YouTube titles, timestamps & search tags",
  },
  {
    id: "sfx_audio",
    name: "Sound Effects (SFX) & Audio Vibe",
    category: "Audio & Voice",
    emoji: "💥",
    color: "#F97316",
    desc: "Onomatopoeia action sound detection & SFX mapping",
  },
];

export const AISmartRoutingDrawer: React.FC<AISmartRoutingDrawerProps> = ({
  className = "",
  compact = false,
  value,
  selectedModel,
  onChange,
  fullWidth = false,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All Pipelines");
  const [sortBy, setSortBy] = useState<string>("default");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("sonikoma_routing_favorites");
      return stored ? JSON.parse(stored) : ["storyboard_narrative", "panel_analysis", "speech_synthesis"];
    } catch {
      return ["storyboard_narrative", "panel_analysis", "speech_synthesis"];
    }
  });

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

  // Handle ESC key to close side panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem("sonikoma_routing_favorites", JSON.stringify(next));
      return next;
    });
  };

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
    "All Pipelines",
    "★ Favorites",
    "Creative",
    "Vision & OCR",
    "Audio & Voice",
    "Image",
    "SEO & Social",
  ];

  const filteredTasks = useMemo(() => {
    let list = PIPELINE_TASKS.filter((t) => {
      if (selectedFilter === "★ Favorites") {
        return favoriteIds.includes(t.id);
      }
      if (selectedFilter !== "All Pipelines") {
        return t.category === selectedFilter;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (routingMap[t.id]?.primary && routingMap[t.id].primary.toLowerCase().includes(q)) ||
          (routingMap[t.id]?.fallback && routingMap[t.id].fallback?.toLowerCase().includes(q))
      );
    }

    if (sortBy === "alphabetical") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [selectedFilter, favoriteIds, searchQuery, sortBy, routingMap]);

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      {/* ── Top Header Trigger Button ──────────────────── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          fetchRoutingConfig();
        }}
        className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/[0.12] bg-[#141418]/90 hover:bg-[#1C1C24] hover:border-blue-500/50 text-neutral-200 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] focus:outline-none group cursor-pointer active:scale-95 ${
          compact ? "h-8 text-xs" : "h-9"
        }`}
        title="AI Smart Routing: Open Right-Side Smart Routing Panel"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981] shrink-0" />
          <span className="text-xs font-bold text-white tracking-tight whitespace-nowrap font-sans">
            AI Smart Routing
          </span>
        </div>

        <span className="px-2 py-0.5 text-[9.5px] font-black font-mono uppercase tracking-wider rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm">
          11 Tasks
        </span>

        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform duration-200 ml-0.5 shrink-0" />
      </button>

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER PANEL (MATCHING IMAGE 2 STYLING) ─────────────────── */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex justify-end animate-fade-in pointer-events-auto">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Right Side Drawer Container */}
            <div className="relative w-full sm:w-[500px] lg:w-[540px] h-full bg-[#0E0E12] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 text-left overflow-hidden animate-in slide-in-from-right duration-300">
              
              {/* 1. Header Bar (Matching Image 2) */}
              <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#121216] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#181820] border border-white/[0.1] flex items-center justify-center flex-shrink-0 shadow-inner text-blue-400">
                    <Workflow className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight font-sans">
                      AI Smart Routing
                    </h3>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">
                      Global pipeline routing &amp; model cascades
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/ai-core?tab=routing"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E1E24] hover:bg-[#282830] border border-white/[0.1] hover:border-white/[0.2] text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Routing Matrix</span>
                  </a>

                  <a
                    href="/ai-core?tab=routing"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>CONFIGURE</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ml-1"
                    title="Close Panel (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Subheader Status Strip (Matching Image 2's "⚡ NO ACTIVE PROJECT") */}
              <div className="px-5 py-3 border-b border-white/[0.06] bg-[#0A0A0E] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>11 ACTIVE PIPELINES</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#181820] border border-white/[0.08] text-[10px] font-mono font-bold text-neutral-400">
                  Synchronized
                </span>
              </div>

              {/* 3. Hero Feature Card (Matching Image 2's Active Project Banner) */}
              <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#0B0B10] shrink-0">
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#14141C] flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Automatic Model Cascades Active
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-xs">
                      Tasks route to Tier 1 engines with instant Tier 2 fallback protection.
                    </p>
                  </div>
                  <a
                    href="/ai-core?tab=api-keys"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>API Vault</span>
                  </a>
                </div>
              </div>

              {/* 4. Search & Sort Controls (Matching Image 2) */}
              <div className="p-4 sm:p-5 pb-3 space-y-3 bg-[#0A0A0E] border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search pipelines, models, or tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#141418] py-2 pl-10 pr-4 text-xs text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none transition-all font-sans"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-white/[0.08] bg-[#141418] px-3 py-2 text-xs text-neutral-300 focus:border-blue-500 focus:outline-none transition-all cursor-pointer font-sans"
                  >
                    <option value="default">Default Order</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>

                {/* Filter Tabs (Blue Pill Matching Image 2) */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                  {categories.map((cat) => {
                    const isSelected = selectedFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/30"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Scrollable Pipeline Task Cards List (Matching Image 2 Project Cards) */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 custom-purple-scrollbar bg-[#0A0A0E]">
                {filteredTasks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-white/[0.06] bg-[#121216] text-neutral-400 text-xs font-mono">
                    No pipelines found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const route = routingMap[task.id];
                    const primaryId = route?.primary;
                    const fallbackId = route?.fallback;
                    const primaryName = formatModelName(primaryId);
                    const fallbackName = fallbackId ? formatModelName(fallbackId) : null;
                    const isFav = favoriteIds.includes(task.id);

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-white/[0.08] bg-[#141418] hover:border-blue-500/40 p-4 transition-all duration-200 flex items-center justify-between gap-3 text-left group"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* Category Emoji / Icon Box */}
                          <div className="w-11 h-11 rounded-xl bg-[#1E1E26] border border-white/[0.08] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                            {task.emoji}
                          </div>

                          <div className="min-w-0 space-y-1">
                            {/* Meta Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1">
                                <Workflow className="w-3 h-3 text-blue-400" />
                                {task.category.toUpperCase()}
                              </span>
                              <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#1E1E26] border border-white/[0.08] text-emerald-400">
                                Active
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-bold text-white tracking-tight truncate">
                              {task.name}
                            </h4>

                            {/* Model Details */}
                            <div className="text-xs text-neutral-400 font-mono space-y-0.5 pt-0.5">
                              <p className="flex items-center gap-1.5 text-neutral-200 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                                <span className="text-blue-300 font-bold">{primaryName}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                  Tier 1
                                </span>
                              </p>
                              {fallbackName && (
                                <p className="text-[11px] text-neutral-500 truncate">
                                  ↳ Fallback: <span className="text-neutral-300">{fallbackName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions (Star & Configure Button) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(task.id, e)}
                            className={`p-2 rounded-xl border border-transparent hover:border-white/[0.1] transition-colors cursor-pointer ${
                              isFav ? "text-amber-400" : "text-neutral-500 hover:text-white"
                            }`}
                            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
                          </button>

                          <a
                            href={`/ai-core?tab=routing&task=${task.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-[#1E1E24] hover:bg-[#282832] border border-white/[0.1] hover:border-white/[0.2] text-xs font-bold text-neutral-200 hover:text-white transition-all cursor-pointer active:scale-95"
                          >
                            Configure
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 6. Footer Status Bar */}
              <div className="p-4 border-t border-white/[0.08] bg-[#0E0E12] flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  11 / 11 Pipelines Synchronized
                </span>

                <div className="flex items-center gap-3 font-mono">
                  <button
                    type="button"
                    onClick={fetchRoutingConfig}
                    className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
                    <span>Sync</span>
                  </button>
                  <span className="text-white/20">•</span>
                  <a
                    href="/ai-core?tab=api-keys"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold"
                  >
                    API Vault
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export const AIModelSelector = AISmartRoutingDrawer;
export default AISmartRoutingDrawer;
