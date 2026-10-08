import React, { useMemo } from "react";
import {
  Sparkles,
  Layers,
  Wand2,
  Film,
  Zap,
} from "lucide-react";
import { ThumbnailCount } from "../types";
import CyberSelect from "@/shared/ui/common/CyberSelect";

interface ThumbnailPromptCardProps {
  prompt: string;
  setPrompt: (p: string) => void;
  count: ThumbnailCount;
  setCount: (c: ThumbnailCount) => void;
  seriesTitle: string;
  setSeriesTitle: (s: string) => void;
  genre: string;
  setGenre: (g: string) => void;
  style?: string;
  setStyle?: (s: string) => void;
  engine?: string;
  setEngine?: (e: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  activePanelsCount: number;
}

interface StyleOption {
  id: string;
  label: string;
  icon: string;
  desc: string;
  category: "Featured" | "Digital & Modern" | "Illustration & Comic" | "Traditional" | "Fine Art";
}

const CATEGORIES = [
  "All",
  "Featured",
  "Digital & Modern",
  "Illustration & Comic",
  "Traditional",
  "Fine Art",
] as const;

const STYLE_OPTIONS: StyleOption[] = [
  // ── Featured & Manga Styles ───────────────────────────────────────────────
  { id: "anime_manhwa", label: "Solo Leveling Manhwa", icon: "🎨", desc: "Vibrant anime manhwa, sharp lineart, glowing highlights", category: "Featured" },
  { id: "dark_monarch", label: "Dark Monarch Aura", icon: "🌑", desc: "Obsidian shadows, purple/blue arcane flames, high contrast", category: "Featured" },
  { id: "shonen_battle", label: "Epic Shonen Climax", icon: "🔥", desc: "Golden aura, dynamic battle debris, explosive power", category: "Featured" },
  { id: "cyber_neon", label: "Cyber Neon Awakening", icon: "⚡", desc: "Cyan & magenta neon glow, futuristic energy runes", category: "Featured" },

  // ── 1. Digital & Modern Graphic Styles ───────────────────────────────────
  { id: "vector_art", label: "Vector Art", icon: "📐", desc: "Clean flat shapes, smooth curves, bold outlines, modern iconography", category: "Digital & Modern" },
  { id: "pixel_art", label: "Pixel Art", icon: "👾", desc: "Nostalgic grid-based 8-bit/16-bit retro arcade game aesthetics", category: "Digital & Modern" },
  { id: "3d_digital_sculpt", label: "3D Digital / Sculpt", icon: "🧊", desc: "Volumetric depth via Blender/ZBrush, photorealistic or stylized depth", category: "Digital & Modern" },
  { id: "vaporwave_synthwave", label: "Vaporwave / Synthwave", icon: "🌆", desc: "Neon purples & cyans, chrome textures, grid lines, VHS glitch", category: "Digital & Modern" },
  { id: "low_poly", label: "Low Poly", icon: "💎", desc: "Abstract geometry from polygonal shapes, faceted 3D appearance", category: "Digital & Modern" },
  { id: "flat_illustration", label: "Flat Illustration", icon: "🟦", desc: "Minimalist flat color blocks, bold geometric shapes, no gradients", category: "Digital & Modern" },

  // ── 2. Illustration & Sequential Art Styles ──────────────────────────────
  { id: "anime_manga", label: "Anime / Manga", icon: "🎌", desc: "Character-focused Japanese style, expressive eyes, dynamic line art", category: "Illustration & Comic" },
  { id: "manhwa_webtoon", label: "Manhwa / Korean Webtoon", icon: "📱", desc: "Vibrant airbrushed coloring, dramatic lighting, vertical scroll", category: "Illustration & Comic" },
  { id: "western_comic_pop", label: "Western Comic / Pop Art", icon: "💥", desc: "High-contrast inks, dramatic hatching, primary colors, Ben-Day dots", category: "Illustration & Comic" },
  { id: "caricature", label: "Caricature", icon: "🎭", desc: "Satirical exaggeration of features with subject recognizability", category: "Illustration & Comic" },
  { id: "chibi_super_deformed", label: "Chibi / Super Deformed", icon: "🐥", desc: "Cute Japanese aesthetic, oversized heads, huge eyes, tiny bodies", category: "Illustration & Comic" },

  // ── 3. Traditional Drawing & Inking Styles ─────────────────────────────────
  { id: "line_art_contour", label: "Line Art / Contour", icon: "✒️", desc: "Pure edges and forms through varied line weights, omitting tone", category: "Traditional" },
  { id: "hatching_cross_hatching", label: "Hatching & Cross-Hatching", icon: "🥢", desc: "Closely spaced parallel or intersecting lines building depth", category: "Traditional" },
  { id: "stippling_pointillism", label: "Stippling / Pointillism", icon: "🔘", desc: "Shading and texture built entirely through dots with tonal density", category: "Traditional" },
  { id: "charcoal_graphite", label: "Charcoal & Graphite", icon: "✏️", desc: "High-contrast textured monochrome, expressive sketches to blended studies", category: "Traditional" },
  { id: "photorealism", label: "Photorealism", icon: "📸", desc: "Meticulous photographic fidelity, reflections, micro-textures, and detail", category: "Traditional" },

  // ── 4. Fine Art & Painting Movements ─────────────────────────────────────
  { id: "impressionism", label: "Impressionism", icon: "🖌️", desc: "Short visible brushstrokes capturing fleeting light and atmosphere", category: "Fine Art" },
  { id: "surrealism", label: "Surrealism", icon: "👁️", desc: "Dreamlike illogical scenes combining bizarre elements with realism", category: "Fine Art" },
  { id: "cubism", label: "Cubism", icon: "🔳", desc: "Fragmented subjects into geometric planes viewed from multiple angles", category: "Fine Art" },
  { id: "art_nouveau", label: "Art Nouveau", icon: "🌿", desc: "Flowing organic lines, asymmetrical curves, elegant botanical motifs", category: "Fine Art" },
  { id: "abstract_expressionism", label: "Abstract Expressionism", icon: "🌀", desc: "Non-representational gestural strokes and emotive color fields", category: "Fine Art" },
  { id: "watercolor_wash", label: "Watercolor / Wash", icon: "🎨", desc: "Fluid translucent pigments, soft bleeds, granulation, paper blooms", category: "Fine Art" },
];



const ENGINE_OPTIONS = [
  {
    id: "flux_schnell",
    label: "FLUX.1 Schnell (Recommended)",
    badge: "16:9 Ultra Fast",
    desc: "Black Forest Labs FLUX.1 • High fidelity cinematic diffusion",
    icon: "⚡",
    provider: "Hugging Face",
  },
  {
    id: "flux_dev",
    label: "FLUX.1 Dev Studio",
    badge: "Ultra Detail",
    desc: "FLUX.1 Dev photorealism • Deep render shadows & reflections",
    icon: "🎨",
    provider: "Hugging Face",
  },
  {
    id: "dall_e_3",
    label: "OpenAI DALL-E 3",
    badge: "Cinematic HD",
    desc: "OpenAI DALL-E 3 • Narrative composition & typography fidelity",
    icon: "🌟",
    provider: "OpenAI",
  },
  {
    id: "sdxl",
    label: "Stable Diffusion XL",
    badge: "Anime Core",
    desc: "Stability AI SDXL 1.0 • Classic graphic novel and comic rendering",
    icon: "🖼️",
    provider: "Stability AI",
  },
  {
    id: "panel_compositor",
    label: "Chapter Panel FX Compositor",
    badge: "Zero Latency",
    desc: "Direct chapter panel composition with dynamic neon grading & lighting",
    icon: "🎬",
    provider: "Local FX Core",
  },
];

export const ThumbnailPromptCard: React.FC<ThumbnailPromptCardProps> = ({
  prompt,
  setPrompt,
  count,
  setCount,
  seriesTitle,
  setSeriesTitle,
  genre,
  setGenre,
  style = "anime_manhwa",
  setStyle,
  engine = "flux_schnell",
  setEngine,
  onGenerate,
  isGenerating,
  activePanelsCount,
}) => {
  const activeStyleObj = useMemo(() => {
    return STYLE_OPTIONS.find((opt) => opt.id === style) || STYLE_OPTIONS[0];
  }, [style]);

  const activeEngineObj = useMemo(() => {
    return ENGINE_OPTIONS.find((e) => e.id === engine) || ENGINE_OPTIONS[0];
  }, [engine]);

  const engineSelectOptions = useMemo(() => {
    return ENGINE_OPTIONS.map((e) => ({
      value: e.id,
      label: e.label,
      description: e.desc,
      badge: e.badge,
      icon: <span className="text-sm shrink-0">{e.icon}</span>,
    }));
  }, []);

  const styleSelectOptions = useMemo(() => {
    return STYLE_OPTIONS.map((opt) => ({
      value: opt.id,
      label: opt.label,
      description: opt.desc,
      group: opt.category,
      icon: <span className="text-base shrink-0">{opt.icon}</span>,
      badge: opt.category,
    }));
  }, []);

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
      {/* ── Top Controls: Series Title & Count Selector ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
            Series / Chapter Title
          </label>
          <input
            type="text"
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            placeholder="e.g. Solo Leveling Chapter 1 Climax"
            className="w-full px-4 py-3 bg-[#121212] border border-[#2F2F2F] rounded-xl text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans"
          />
        </div>

        {/* 3 or 6 Count Toggle */}
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
            Generation Count
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#121212] border border-[#2F2F2F] rounded-xl">
            <button
              type="button"
              onClick={() => setCount(3)}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                count === 3
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E]"
              }`}
            >
              3 Images
            </button>
            <button
              type="button"
              onClick={() => setCount(6)}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                count === 6
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/30"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E]"
              }`}
            >
              6 Images
            </button>
          </div>
        </div>
      </div>

      {/* ── Art & Visual Style Selector (CyberSelect Dropdown) ─────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            Visual Art Style ({STYLE_OPTIONS.length} Styles)
          </label>
          <span className="text-[11px] font-mono text-[#6B7280]">
            Group: <span className="text-[#3B82F6] font-semibold">{activeStyleObj.category}</span>
          </span>
        </div>

        <CyberSelect
          value={style}
          onChange={(newVal) => setStyle?.(newVal)}
          options={styleSelectOptions}
          variant="blue"
          size="lg"
          searchable={true}
          placeholder="Select Visual Art Style..."
        />

        <div className="px-3.5 py-2 rounded-xl bg-[#121212] border border-[#2F2F2F] flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
          <span className="text-sm shrink-0">{activeStyleObj.icon}</span>
          <span className="text-white font-semibold shrink-0">{activeStyleObj.label}:</span>
          <span className="text-[#9CA3AF] truncate">{activeStyleObj.desc}</span>
        </div>
      </div>

      {/* ── AI Prompt Textarea & Quick Preset Suggestions ─────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-[#3B82F6]" />
            AI Prompt &amp; Visual Direction
          </label>
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt("")}
              className="text-[11px] font-mono text-[#6B7280] hover:text-[#E5E5E5] transition-colors cursor-pointer"
            >
              Clear Prompt
            </button>
          )}
        </div>

        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your desired thumbnail composition: e.g. The True Queen monarch awakening, glowing royal crown, majestic radiant aura, commanding low-angle pose, stormy battle sky..."
          className="w-full p-4 bg-[#121212] border border-[#2F2F2F] rounded-xl text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans resize-none"
        />


      </div>

      {/* ── Source Panels & AI Diffusion Engine Status ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold uppercase text-[#9CA3AF] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#10B981]" />
            Source Panels Status
          </label>
          <div className="px-3.5 py-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-xs text-[#E5E5E5] flex items-center justify-between font-mono">
            <span className="truncate">
              {activePanelsCount > 0
                ? `${activePanelsCount} Active Chapter Panels Mapped`
                : "Using High-Action Story Presets"}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0 ml-2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold uppercase text-[#9CA3AF] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              AI Diffusion Engine
            </label>
            <span className="text-[10px] font-mono text-[#3B82F6] font-semibold">
              {activeEngineObj.provider}
            </span>
          </div>
          <CyberSelect
            value={engine}
            onChange={(val) => setEngine?.(val)}
            options={engineSelectOptions}
            variant="blue"
            size="md"
            searchable={false}
            placeholder="Select AI Engine..."
          />
        </div>
      </div>

      {/* ── GENERATE BUTTON ────────────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white font-black text-xs sm:text-sm tracking-wider uppercase font-mono flex items-center justify-center gap-3 shadow-lg shadow-[#3B82F6]/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-[#60A5FA]/30"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing {count} AI Thumbnails (1280x720 HD)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Generate {count} High-CTR YouTube Thumbnails</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThumbnailPromptCard;
