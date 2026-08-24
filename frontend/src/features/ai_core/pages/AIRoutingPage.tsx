import React, { useState, useEffect, useRef } from "react";
import {
  Shuffle,
  ShieldCheck,
  Zap,
  Sparkles,
  Save,
  Layers,
  Sliders,
  DollarSign,
  Gauge,
  Filter,
  Search,
  ChevronDown,
  Check,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface AIRoutingPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

interface CapabilityDefinition {
  task: string;
  name: string;
  emoji: string;
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

const CAPABILITY_DEFINITIONS: CapabilityDefinition[] = [
  { task: "storyboard_narrative", name: "Storyboard & Script Narration", emoji: "📖", category: "Creative Narration", description: "Generates episodic comic script, panel breakdown, and emotional voice acting cues.", required_type: "text_reasoning" },
  { task: "panel_analysis", name: "Panel Visual OCR & Reading Flow", emoji: "🔍", category: "Vision & Extraction", description: "Detects speech bubble coordinates, panel boundaries, and visual reading direction.", required_type: "vision_multimodal" },
  { task: "scraper_blueprint", name: "Universal Scraper Blueprint", emoji: "🕸️", category: "Vision & Extraction", description: "Extracts chapter metadata, episode titles, and high-resolution comic pages.", required_type: "vision_multimodal" },
  { task: "prompt_enhancement", name: "Prompt Enhancement & Style Modifiers", emoji: "✨", category: "Image Diffusion", description: "Refines visual prompts for Stable Diffusion & FLUX with anime lighting and cinematic angles.", required_type: "text_reasoning" },
  { task: "image_diffusion", name: "Image Diffusion & Comic Inpainting", emoji: "🎨", category: "Image Diffusion", description: "Generates character art, redraws speech bubbles, and performs background inpainting.", required_type: "image_diffusion" },
  { task: "speech_synthesis", name: "Voiceover & Speech Narration", emoji: "🎙️", category: "Audio & Speech", description: "Synthesizes expressive Japanese, English, and multilingual dialogue narration.", required_type: "audio_tts" },
  { task: "translate", name: "Manga Dialogue Translation", emoji: "🌐", category: "Creative Narration", description: "Translates webtoon speech bubbles between Japanese, English, Korean, and Chinese.", required_type: "translation" },
  { task: "character_persona", name: "Character Persona & Voice Casting", emoji: "🎭", category: "Creative Narration", description: "Extracts character identities, personality traits, and recommends matched voice actors.", required_type: "text_reasoning" },
  { task: "seo_optimization", name: "YouTube SEO, Chapters & Titles", emoji: "📈", category: "SEO & Marketing", description: "Generates high-CTR YouTube titles, timestamps, video descriptions, and search tags.", required_type: "text_reasoning" },
  { task: "sfx_audio", name: "Sound Effects (SFX) & Audio Vibe", emoji: "💥", category: "Audio & Speech", description: "Detects onomatopoeia action sounds (*BAM*, *WHOOSH*) and recommends matching audio effects.", required_type: "text_reasoning" },
  { task: "smart_crop", name: "Smart Crop & Aspect Ratio Tagger", emoji: "✂️", category: "Vision & Extraction", description: "Calculates optimal 9:16 Shorts and 16:9 widescreen panel focus bounding boxes.", required_type: "vision_multimodal" },
];

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  "Creative Narration": { border: "#7c3aed44", bg: "#7c3aed12", text: "#c4b5fd", dot: "#7c3aed" },
  "Vision & Extraction": { border: "#0891b244", bg: "#0891b212", text: "#67e8f9", dot: "#0891b2" },
  "Audio & Speech": { border: "#d97706  44", bg: "#d9770612", text: "#fcd34d", dot: "#d97706" },
  "SEO & Marketing": { border: "#16a34a44", bg: "#16a34a12", text: "#86efac", dot: "#16a34a" },
  "Image Diffusion": { border: "#db277744", bg: "#db277712", text: "#f9a8d4", dot: "#db2777" },
};

// ── Model Picker Dropdown ────────────────────────────────────────────────────
function ModelPicker({
  value,
  models,
  onChange,
  tier,
  tierColor,
  tierIcon: TierIcon,
}: {
  value: string;
  models: DynamicModelOption[];
  onChange: (id: string) => void;
  tier: string;
  tierColor: string;
  tierIcon: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = models.find((m) => m.id === value);
  const filtered = models.filter(
    (m) =>
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5" ref={ref}>
      <label
        className="text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: tierColor }}
      >
        <TierIcon className="w-3 h-3" />
        {tier}
      </label>

      <div className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150"
          style={{
            borderColor: open ? tierColor : "#1e1e30",
            backgroundColor: "#0a0a12",
            boxShadow: open ? `0 0 0 1px ${tierColor}` : "none",
          }}
        >
          <div className="min-w-0 flex-1">
            {selected ? (
              <>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">{selected.name}</div>
                <div className="text-[9px] text-neutral-500 truncate">{selected.provider_name} · {selected.speed_rating?.split("(")[0].trim()}</div>
              </>
            ) : (
              <span className="text-[11px] text-neutral-500">— Select model —</span>
            )}
          </div>
          <ChevronDown
            className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150"
            style={{ color: tierColor, transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>

        {open && (
          <div
            className="absolute z-50 top-full mt-1.5 w-full rounded-xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: "#0d0d18", borderColor: tierColor + "66" }}
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "#1e1e30" }}>
              <Search className="w-3 h-3 text-neutral-500 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="flex-1 bg-transparent text-[11px] text-neutral-300 placeholder-neutral-600 outline-none"
              />
            </div>

            {/* Options */}
            <div className="max-h-44 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#4b2d7e transparent" }}>
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-neutral-500">No models match</div>
              ) : (
                filtered.map((m) => {
                  const isActive = m.id === value;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { onChange(m.id); setOpen(false); setSearch(""); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-100"
                      style={{ backgroundColor: isActive ? `${tierColor}18` : "transparent" }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff08"; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: isActive ? "#e2e8f0" : "#9ca3af" }}>{m.name}</div>
                        <div className="text-[9px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                          <span>{m.provider_name}</span>
                          {m.speed_rating && <><span>·</span><span>{m.speed_rating.split("(")[0].trim()}</span></>}
                          {m.cost_per_1m_prompt !== undefined && <><span>·</span><span>${m.cost_per_1m_prompt}/1M</span></>}
                        </div>
                      </div>
                      {isActive && <Check className="w-3 h-3 flex-shrink-0" style={{ color: tierColor }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AIRoutingPage({ addNotification }: AIRoutingPageProps) {
  const [routes, setRoutes] = useState<CapabilityRoute[]>([]);
  const [availableModels, setAvailableModels] = useState<DynamicModelOption[]>([]);
  const [globalStrategy, setGlobalStrategy] = useState<"custom" | "speed" | "cost" | "quality">("custom");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getSuitableModels = (taskType: string): DynamicModelOption[] => {
    if (!availableModels.length) return [];
    switch (taskType) {
      case "audio_tts":
        return availableModels.filter(
          (m) => m.provider === "edgetts" || m.provider === "elevenlabs" ||
            m.capabilities?.some((c) => ["tts", "audio", "voice_cloning"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("speech")
        );
      case "image_diffusion":
        return availableModels.filter(
          (m) => m.provider === "huggingface" || m.provider === "stablediffusion" ||
            m.capabilities?.some((c) => ["image_generation", "high_res_image", "diffusion", "image"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("diffusion") || m.category?.toLowerCase().includes("image")
        );
      case "vision_multimodal":
        return availableModels.filter(
          (m) => m.capabilities?.some((c) => c.toLowerCase() === "vision") ||
            m.category?.toLowerCase().includes("multimodal") || m.category?.toLowerCase().includes("vision") ||
            m.id.toLowerCase().includes("gemini") || m.id.toLowerCase().includes("gpt-4o") ||
            m.id.toLowerCase().includes("claude-3-5-sonnet")
        );
      case "translation":
        return availableModels.filter(
          (m) => m.provider === "deepl" ||
            m.capabilities?.some((c) => ["translation", "multilingual"].includes(c.toLowerCase())) ||
            m.category?.toLowerCase().includes("translation") ||
            ["gemini", "openai", "anthropic"].includes(m.provider)
        );
      case "text_reasoning":
      default:
        return availableModels.filter(
          (m) => m.provider !== "edgetts" && m.provider !== "elevenlabs" && m.provider !== "stablediffusion" &&
            !m.capabilities?.some((c) => ["image_generation", "tts"].includes(c.toLowerCase()))
        );
    }
  };

  useEffect(() => {
    const load = async () => {
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
              id: m.id, name: m.name || m.id, provider: m.provider,
              provider_name: m.provider_name || m.provider,
              category: m.category || "General",
              speed_rating: m.speed_rating || "Fast",
              cost_per_1m_prompt: m.cost_per_1m_prompt ?? 0,
              capabilities: m.capabilities || [],
              status: m.status || "HEALTHY",
            }));
            setAvailableModels(fetchedModels);
          }
        }

        let serverRoutingMap: Record<string, any> = {};
        if (resRouting.ok) {
          const rData = await resRouting.json();
          if (rData.success && rData.routing) serverRoutingMap = rData.routing;
        }

        const initialRoutes: CapabilityRoute[] = CAPABILITY_DEFINITIONS.map((def) => {
          const serverRoute = serverRoutingMap[def.task];
          const suitable = fetchedModels.filter((m) => {
            if (def.required_type === "audio_tts") return m.provider === "edgetts" || m.provider === "elevenlabs";
            if (def.required_type === "image_diffusion") return m.provider === "huggingface" || m.provider === "stablediffusion";
            if (def.required_type === "vision_multimodal") return m.capabilities?.includes("vision") || m.id.includes("gemini") || m.id.includes("gpt-4o");
            if (def.required_type === "translation") return m.provider === "deepl" || m.provider === "gemini" || m.provider === "openai";
            return m.provider !== "edgetts" && m.provider !== "elevenlabs" && m.provider !== "stablediffusion";
          });
          const m1 = suitable[0]?.id || fetchedModels[0]?.id || "";
          const m2 = suitable[1]?.id || m1;
          const m3 = suitable[2]?.id || m2;
          return { ...def, primary_model: serverRoute?.primary || serverRoute || m1, fallback_model: serverRoute?.fallback || m2, tertiary_model: serverRoute?.tertiary || m3 };
        });
        setRoutes(initialRoutes);
      } catch { /* handled */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const handleModelChange = (task: string, field: "primary_model" | "fallback_model" | "tertiary_model", val: string) => {
    setRoutes((prev) => prev.map((r) => (r.task === task ? { ...r, [field]: val } : r)));
  };

  const handleApplyStrategy = (strategy: "speed" | "cost" | "quality") => {
    setGlobalStrategy(strategy);
    if (!availableModels.length) return;
    setRoutes((prev) => prev.map((r) => {
      const suitable = getSuitableModels(r.required_type);
      if (!suitable.length) return r;
      let sorted = [...suitable];
      if (strategy === "speed") sorted.sort((a, b) => (a.speed_rating?.includes("Ultra") ? -1 : 1) - (b.speed_rating?.includes("Ultra") ? -1 : 1));
      if (strategy === "cost") sorted.sort((a, b) => (a.cost_per_1m_prompt || 0) - (b.cost_per_1m_prompt || 0));
      if (strategy === "quality") sorted.sort((a, b) => (a.category?.toLowerCase().includes("reasoning") || a.provider === "anthropic" ? -1 : 1) - (b.category?.toLowerCase().includes("reasoning") || b.provider === "anthropic" ? -1 : 1));
      return { ...r, primary_model: sorted[0]?.id || r.primary_model, fallback_model: sorted[1]?.id || sorted[0]?.id || r.fallback_model, tertiary_model: sorted[2]?.id || sorted[1]?.id || r.tertiary_model };
    }));
    addNotification?.(`Applied ${strategy} strategy across all tasks!`, "info");
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
        addNotification?.("All routing rules saved!", "success");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        addNotification?.("Saved to browser cache.", "info");
      }
    } catch {
      addNotification?.("Saved to browser cache.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ["All", "Creative Narration", "Vision & Extraction", "Audio & Speech", "SEO & Marketing", "Image Diffusion"];
  const filteredRoutes = routes.filter((r) => selectedCategory === "All" || r.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-[12px] text-neutral-400 font-mono">Loading models from API…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left">

      {/* ── Top controls strip ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
      >
        {/* Strategy pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono flex-shrink-0">Strategy</span>
          {[
            { id: "speed" as const, label: "Speed", icon: Gauge, color: "#f97316" },
            { id: "cost" as const, label: "Lowest Cost", icon: DollarSign, color: "#10b981" },
            { id: "quality" as const, label: "Best Quality", icon: Sparkles, color: "#a855f7" },
          ].map(({ id, label, icon: Icon, color }) => {
            const isActive = globalStrategy === id;
            return (
              <button
                key={id}
                onClick={() => handleApplyStrategy(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all duration-150"
                style={{
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isActive ? color : "#262626",
                  backgroundColor: isActive ? `${color}22` : "#0d0d14",
                  color: isActive ? color : "#6b7280",
                }}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Model count badge */}
        <div className="flex items-center gap-2">
          <div
            className="text-[10px] font-mono px-2.5 py-1 rounded-lg border"
            style={{ borderColor: "#1e1e30", backgroundColor: "#0d0d14", color: "#6b7280" }}
          >
            <span className="text-purple-400 font-bold">{availableModels.length}</span> models loaded
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all duration-200 disabled:opacity-40"
            style={{
              background: saved
                ? "linear-gradient(135deg, #16a34a, #15803d)"
                : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: saved ? "0 0 12px #16a34a44" : "0 0 12px #7c3aed44",
            }}
          >
            {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> :
             isSaving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</> :
             <><Save className="w-3.5 h-3.5" /> Save Rules</>}
          </button>
        </div>
      </div>

      {/* ── Category filter ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const color = cat === "All" ? "#7c3aed" : CATEGORY_COLORS[cat]?.dot ?? "#7c3aed";
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all duration-150"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: isActive ? color : "#1e1e30",
                backgroundColor: isActive ? `${color}18` : "#0a0a12",
                color: isActive ? (CATEGORY_COLORS[cat]?.text ?? "#c4b5fd") : "#6b7280",
              }}
            >
              {cat !== "All" && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? color : "#374151" }} />
              )}
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Task cards ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredRoutes.map((route) => {
          const suitable = getSuitableModels(route.required_type);
          const catColor = CATEGORY_COLORS[route.category] ?? CATEGORY_COLORS["Creative Narration"];

          return (
            <div
              key={route.task}
              className="rounded-2xl border p-4 transition-all duration-200"
              style={{ backgroundColor: "#0a0a12", borderColor: "#1e1e30" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = catColor.dot + "55")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e30")}
            >
              {/* Task header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Emoji badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ backgroundColor: catColor.bg, border: `1px solid ${catColor.border}` }}
                  >
                    {route.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white leading-tight">{route.name}</h3>
                      <span
                        className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catColor.bg, borderWidth: 1, borderStyle: "solid", borderColor: catColor.border, color: catColor.text }}
                      >
                        {route.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{route.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-[9px] font-mono px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ backgroundColor: "#1e1e30", color: "#6b7280" }}
                  >
                    <Filter className="w-2.5 h-2.5" />
                    {suitable.length} engines
                  </span>
                  <code
                    className="text-[9px] font-mono px-2 py-1 rounded-lg"
                    style={{ backgroundColor: "#0d0d14", borderWidth: 1, borderStyle: "solid", borderColor: "#1e1e30", color: catColor.text }}
                  >
                    {route.task}
                  </code>
                </div>
              </div>

              {/* 3-tier pickers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t" style={{ borderColor: "#1e1e30" }}>
                <ModelPicker
                  value={route.primary_model}
                  models={suitable}
                  onChange={(v) => handleModelChange(route.task, "primary_model", v)}
                  tier="Tier 1 · Primary"
                  tierColor="#a855f7"
                  tierIcon={Zap}
                />
                <ModelPicker
                  value={route.fallback_model}
                  models={suitable}
                  onChange={(v) => handleModelChange(route.task, "fallback_model", v)}
                  tier="Tier 2 · Fallback"
                  tierColor="#10b981"
                  tierIcon={ShieldCheck}
                />
                <ModelPicker
                  value={route.tertiary_model}
                  models={suitable}
                  onChange={(v) => handleModelChange(route.task, "tertiary_model", v)}
                  tier="Tier 3 · Emergency"
                  tierColor="#f59e0b"
                  tierIcon={Layers}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
