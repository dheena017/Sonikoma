import React, { useState, useEffect } from "react";
import {
  Shuffle,
  ShieldCheck,
  Zap,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  DollarSign,
  Gauge,
  HelpCircle,
  Filter,
} from "lucide-react";

interface AIRoutingPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface CapabilityDefinition {
  task: string;
  name: string;
  category: "Creative Narration" | "Vision & Extraction" | "Audio & Speech" | "SEO & Marketing" | "Image Diffusion";
  description: string;
  required_type: "text_reasoning" | "vision_multimodal" | "audio_tts" | "image_diffusion" | "translation";
}

interface CapabilityRoute extends CapabilityDefinition {
  primary_model: string;
  fallback_model: string;
  tertiary_model: string;
}

interface DynamicModelOption {
  id: string;
  name: string;
  provider: string;
  provider_name: string;
  category?: string;
  speed_rating?: string;
  cost_per_1m_prompt?: number;
  capabilities?: string[];
  status?: string;
}

// 11 Core Capabilities with explicit required type for strict suitability filtering
const CAPABILITY_DEFINITIONS: CapabilityDefinition[] = [
  {
    task: "storyboard_narrative",
    name: "Storyboard & Script Narration",
    category: "Creative Narration",
    description: "Generates episodic comic script, panel breakdown, and emotional voice acting cues.",
    required_type: "text_reasoning",
  },
  {
    task: "panel_analysis",
    name: "Panel Visual OCR & Reading Flow",
    category: "Vision & Extraction",
    description: "Detects speech bubble coordinates, panel boundaries, and visual reading direction.",
    required_type: "vision_multimodal",
  },
  {
    task: "scraper_blueprint",
    name: "Universal Scraper Blueprint",
    category: "Vision & Extraction",
    description: "Extracts chapter metadata, episode titles, and high-resolution comic pages.",
    required_type: "vision_multimodal",
  },
  {
    task: "prompt_enhancement",
    name: "Prompt Enhancement & Style Modifiers",
    category: "Image Diffusion",
    description: "Refines visual prompts for Stable Diffusion & FLUX with anime lighting and cinematic angles.",
    required_type: "text_reasoning",
  },
  {
    task: "image_diffusion",
    name: "Image Diffusion & Comic Inpainting",
    category: "Image Diffusion",
    description: "Generates character art, redraws speech bubbles, and performs background inpainting.",
    required_type: "image_diffusion",
  },
  {
    task: "speech_synthesis",
    name: "Voiceover & Speech Narration",
    category: "Audio & Speech",
    description: "Synthesizes expressive Japanese, English, and multilingual dialogue narration.",
    required_type: "audio_tts",
  },
  {
    task: "translate",
    name: "Manga Dialogue Translation",
    category: "Creative Narration",
    description: "Translates webtoon speech bubbles between Japanese, English, Korean, and Chinese.",
    required_type: "translation",
  },
  {
    task: "character_persona",
    name: "Character Persona & Voice Casting",
    category: "Creative Narration",
    description: "Extracts character identities, personality traits, and recommends matched voice actors.",
    required_type: "text_reasoning",
  },
  {
    task: "seo_optimization",
    name: "YouTube SEO, Chapters & Titles",
    category: "SEO & Marketing",
    description: "Generates high-CTR YouTube titles, timestamps, video descriptions, and search tags.",
    required_type: "text_reasoning",
  },
  {
    task: "sfx_audio",
    name: "Sound Effects (SFX) & Audio Vibe",
    category: "Audio & Speech",
    description: "Detects onomatopoeia action sounds (*BAM*, *WHOOSH*) and recommends matching audio effects.",
    required_type: "text_reasoning",
  },
  {
    task: "smart_crop",
    name: "Smart Crop & Aspect Ratio Tagger",
    category: "Vision & Extraction",
    description: "Calculates optimal 9:16 Shorts and 16:9 widescreen panel focus bounding boxes.",
    required_type: "vision_multimodal",
  },
];

export default function AIRoutingPage({ addNotification }: AIRoutingPageProps) {
  const [routes, setRoutes] = useState<CapabilityRoute[]>([]);
  const [availableModels, setAvailableModels] = useState<DynamicModelOption[]>([]);
  const [globalStrategy, setGlobalStrategy] = useState<"custom" | "speed" | "cost" | "quality">("custom");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Dynamic filter helper: Returns strictly suitable models for each task
  const getSuitableModelsForTask = (taskType: string): DynamicModelOption[] => {
    if (!availableModels.length) return [];

    switch (taskType) {
      case "audio_tts":
        return availableModels.filter(
          (m) =>
            m.provider === "edgetts" ||
            m.provider === "elevenlabs" ||
            m.capabilities?.some((c) => ["tts", "audio", "voice_cloning"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("speech")
        );

      case "image_diffusion":
        return availableModels.filter(
          (m) =>
            m.provider === "huggingface" ||
            m.provider === "stablediffusion" ||
            m.capabilities?.some((c) => ["image_generation", "high_res_image", "diffusion", "image"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("diffusion") ||
            m.category?.toLowerCase().includes("image")
        );

      case "vision_multimodal":
        return availableModels.filter(
          (m) =>
            m.capabilities?.some((c) => c.toLowerCase() === "vision") ||
            m.category?.toLowerCase().includes("multimodal") ||
            m.category?.toLowerCase().includes("vision") ||
            m.id.toLowerCase().includes("gemini") ||
            m.id.toLowerCase().includes("gpt-4o") ||
            m.id.toLowerCase().includes("claude-3-5-sonnet")
        );

      case "translation":
        return availableModels.filter(
          (m) =>
            m.provider === "deepl" ||
            m.capabilities?.some((c) => ["translation", "multilingual"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("translation") ||
            ["gemini", "openai", "anthropic"].includes(m.provider)
        );

      case "text_reasoning":
      default:
        return availableModels.filter(
          (m) =>
            m.provider !== "edgetts" &&
            m.provider !== "elevenlabs" &&
            m.provider !== "stablediffusion" &&
            !m.capabilities?.some((c) => ["image_generation", "tts"].includes(c.toLowerCase()))
        );
    }
  };

  // Load all models and active routes dynamically from REST API
  useEffect(() => {
    const loadRoutingData = async () => {
      setIsLoading(true);
      try {
        const [resModels, resRouting] = await Promise.all([
          fetch("/api/v1/ai/models"),
          fetch("/api/v1/ai/routing"),
        ]);

        let fetchedModels: DynamicModelOption[] = [];
        if (resModels.ok) {
          const data = await resModels.json();
          if (data.success && Array.isArray(data.models_breakdown)) {
            fetchedModels = data.models_breakdown.map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
              provider: m.provider,
              provider_name: m.provider_name || m.provider,
              category: m.category || "General",
              speed_rating: m.speed_rating || "Fast",
              cost_per_1m_prompt: m.cost_per_1m_prompt || 0.0,
              capabilities: m.capabilities || [],
              status: m.status || "HEALTHY",
            }));
            setAvailableModels(fetchedModels);
          }
        }

        let serverRoutingMap: Record<string, any> = {};
        if (resRouting.ok) {
          const rData = await resRouting.json();
          if (rData.success && rData.routing) {
            serverRoutingMap = rData.routing;
          }
        }

        // Initialize capability routes with suitable defaults
        const initialRoutes: CapabilityRoute[] = CAPABILITY_DEFINITIONS.map((def) => {
          const serverRoute = serverRoutingMap[def.task];
          
          // Temporary suitable list
          const suitable = fetchedModels.filter((m) => {
            if (def.required_type === "audio_tts") return m.provider === "edgetts" || m.provider === "elevenlabs";
            if (def.required_type === "image_diffusion") return m.provider === "huggingface" || m.provider === "stablediffusion";
            if (def.required_type === "vision_multimodal") return m.capabilities?.includes("vision") || m.id.includes("gemini") || m.id.includes("gpt-4o");
            if (def.required_type === "translation") return m.provider === "deepl" || m.provider === "gemini" || m.provider === "openai";
            return m.provider !== "edgetts" && m.provider !== "elevenlabs" && m.provider !== "stablediffusion";
          });

          const m1 = suitable[0]?.id || fetchedModels[0]?.id || "";
          const m2 = suitable[1]?.id || suitable[0]?.id || m1;
          const m3 = suitable[2]?.id || suitable[1]?.id || m2;

          return {
            ...def,
            primary_model: serverRoute?.primary || serverRoute || m1,
            fallback_model: serverRoute?.fallback || m2,
            tertiary_model: serverRoute?.tertiary || m3,
          };
        });

        setRoutes(initialRoutes);
      } catch {
        // Fallback handled
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutingData();
  }, []);

  const handleModelChange = (
    task: string,
    field: "primary_model" | "fallback_model" | "tertiary_model",
    val: string
  ) => {
    setRoutes((prev) =>
      prev.map((r) => (r.task === task ? { ...r, [field]: val } : r))
    );
  };

  // Dynamic Strategy Presets honoring strict suitability
  const handleApplyPresetStrategy = (strategy: "speed" | "cost" | "quality") => {
    setGlobalStrategy(strategy);
    if (!availableModels.length) return;

    setRoutes((prev) =>
      prev.map((r) => {
        const suitable = getSuitableModelsForTask(r.required_type);
        if (!suitable.length) return r;

        if (strategy === "speed") {
          const sorted = [...suitable].sort((a, b) => {
            const aFast = a.speed_rating?.toLowerCase().includes("ultra") ? -1 : 1;
            const bFast = b.speed_rating?.toLowerCase().includes("ultra") ? -1 : 1;
            return aFast - bFast;
          });
          return {
            ...r,
            primary_model: sorted[0]?.id || r.primary_model,
            fallback_model: sorted[1]?.id || sorted[0]?.id || r.fallback_model,
            tertiary_model: sorted[2]?.id || sorted[1]?.id || r.tertiary_model,
          };
        }

        if (strategy === "cost") {
          const sorted = [...suitable].sort(
            (a, b) => (a.cost_per_1m_prompt || 0) - (b.cost_per_1m_prompt || 0)
          );
          return {
            ...r,
            primary_model: sorted[0]?.id || r.primary_model,
            fallback_model: sorted[1]?.id || sorted[0]?.id || r.fallback_model,
            tertiary_model: sorted[2]?.id || sorted[1]?.id || r.tertiary_model,
          };
        }

        if (strategy === "quality") {
          const sorted = [...suitable].sort((a, b) => {
            const aScore = a.category?.toLowerCase().includes("reasoning") || a.provider === "anthropic" ? -1 : 1;
            const bScore = b.category?.toLowerCase().includes("reasoning") || b.provider === "anthropic" ? -1 : 1;
            return aScore - bScore;
          });
          return {
            ...r,
            primary_model: sorted[0]?.id || r.primary_model,
            fallback_model: sorted[1]?.id || sorted[0]?.id || r.fallback_model,
            tertiary_model: sorted[2]?.id || sorted[1]?.id || r.tertiary_model,
          };
        }

        return r;
      })
    );

    addNotification?.(`Applied ${strategy.toUpperCase()} strategy across all suitable task models!`, "info");
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("sonikoma_ai_routing_custom", JSON.stringify(routes));

    try {
      const res = await fetch("/api/v1/ai/routing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routing: routes }),
      });
      if (res.ok) {
        addNotification?.("🔀 All Capability Routing Rules Saved & Synchronized to AI Core!", "success");
      } else {
        addNotification?.("Saved locally in browser cache.", "info");
      }
    } catch {
      addNotification?.("Saved locally in browser cache.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ["All", "Creative Narration", "Vision & Extraction", "Audio & Speech", "SEO & Marketing", "Image Diffusion"];

  const filteredRoutes = routes.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* ── TOP HERO HEADER BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-indigo-500 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Shuffle className="w-4 h-4" /> AI Capability Routing
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Strict Suitability Filter Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              Smart Model Routing &amp; Cascades
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Every comic task only displays compatible models (e.g. Voice models for TTS, Vision models for OCR, Diffusion for Art).
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer font-sans shrink-0"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>Save All Routing Rules</span>
          </button>
        </div>
      </div>

      {/* ── GLOBAL PRESET STRATEGY SELECTOR ───────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Global Routing Strategy
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Automatically assigns the fastest, cheapest, or highest quality engine within each task's suitable models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleApplyPresetStrategy("speed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                globalStrategy === "speed"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                  : "bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Speed Priority</span>
            </button>

            <button
              onClick={() => handleApplyPresetStrategy("cost")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                globalStrategy === "cost"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Lowest Cost</span>
            </button>

            <button
              onClick={() => handleApplyPresetStrategy("quality")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                globalStrategy === "quality"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Highest Quality</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER TABS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-purple-600 text-white font-bold shadow-sm"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── 11 CAPABILITIES CASCADE ROUTING GRID (SUITABLE MODELS ONLY) ───── */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => {
          const suitableModels = getSuitableModelsForTask(route.required_type);

          return (
            <div
              key={route.task}
              className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4 hover:border-neutral-750 transition-all text-left"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-sans">{route.name}</h3>
                    <span className="text-[9px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
                      {route.category}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-purple-950/60 border border-purple-800/40 text-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Filter className="w-2.5 h-2.5" />
                      {suitableModels.length} Compatible Engines
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{route.description}</p>
                </div>

                <span className="text-[10px] font-mono font-bold bg-neutral-950 border border-neutral-800 text-purple-400 px-2.5 py-1 rounded-full shrink-0">
                  Task: <code className="text-neutral-300">{route.task}</code>
                </span>
              </div>

              {/* 3-Tier Selectors Grid (Primary -> Fallback -> Tertiary) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-800/80">
                {/* Primary Engine */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" /> Tier 1: Primary Engine
                  </label>
                  <select
                    value={route.primary_model}
                    onChange={(e) => handleModelChange(route.task, "primary_model", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  >
                    {suitableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Secondary Failover */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Tier 2: Secondary Fallback
                  </label>
                  <select
                    value={route.fallback_model}
                    onChange={(e) => handleModelChange(route.task, "fallback_model", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  >
                    {suitableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tertiary Emergency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Tier 3: Tertiary Emergency
                  </label>
                  <select
                    value={route.tertiary_model}
                    onChange={(e) => handleModelChange(route.task, "tertiary_model", e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  >
                    {suitableModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
