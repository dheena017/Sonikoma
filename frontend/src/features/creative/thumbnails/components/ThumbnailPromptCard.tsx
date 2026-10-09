import React, { useMemo } from "react";
import {
  Sparkles,
  Wand2,
  Film,
  Maximize2,
} from "lucide-react";
import CyberSelect from "@/shared/ui/common/CyberSelect";

interface ThumbnailPromptCardProps {
  prompt: string;
  setPrompt: (p: string) => void;
  seriesTitle: string;
  setSeriesTitle: (s: string) => void;
  genre: string;
  setGenre: (g: string) => void;
  style?: string;
  setStyle?: (s: string) => void;
  aspectRatio?: string;
  setAspectRatio?: (r: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

interface StyleOption {
  id: string;
  label: string;
  icon: string;
  desc: string;
  category: "Featured" | "Digital & Modern" | "Illustration & Comic" | "Traditional" | "Fine Art";
}

interface AspectRatioOption {
  id: string;
  label: string;
  desc: string;
  icon: string;
  category: string;
}

const CATEGORIES = [
  "All",
  "Featured",
  "Digital & Modern",
  "Illustration & Comic",
  "Traditional",
  "Fine Art",
] as const;

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: "16:9", label: "16:9 Landscape (YouTube Standard)", desc: "1280×720 • Standard Video Thumbnails", icon: "📺", category: "Standard" },
  { id: "9:16", label: "9:16 Vertical (Shorts & Reels)", desc: "720×1280 • YouTube Shorts, TikTok & Stories", icon: "📱", category: "Mobile" },
  { id: "1:1", label: "1:1 Square (Community & Feed)", desc: "1024×1024 • Instagram & Community Posts", icon: "⏹️", category: "Social" },
  { id: "4:5", label: "4:5 Portrait (Feed & Covers)", desc: "864×1080 • Social Feed & Comic Covers", icon: "🖼️", category: "Social" },
  { id: "4:3", label: "4:3 Classic (Standard)", desc: "1024×768 • Classic Retro Displays", icon: "🖥️", category: "Standard" },
  { id: "21:9", label: "21:9 Ultrawide (Cinematic Banner)", desc: "1680×720 • Panoramic Channel Headers", icon: "🎬", category: "Cinematic" },
];

const STYLE_OPTIONS: StyleOption[] = [
  // ── Featured & Manga Styles ───────────────────────────────────────────────
  { id: "anime_manhwa", label: "Anime / Webtoon Action", icon: "🎨", desc: "Vibrant anime manhwa, sharp lineart, glowing highlights", category: "Featured" },
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



export const ThumbnailPromptCard: React.FC<ThumbnailPromptCardProps> = ({
  prompt = "",
  setPrompt = () => { },
  seriesTitle = "",
  setSeriesTitle = () => { },
  genre = "",
  setGenre = () => { },
  style = "anime_manhwa",
  setStyle = () => { },
  aspectRatio = "16:9",
  setAspectRatio = () => { },
  onGenerate = () => { },
  isGenerating = false,
}) => {
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

  const aspectRatioSelectOptions = useMemo(() => {
    return ASPECT_RATIO_OPTIONS.map((opt) => ({
      value: opt.id,
      label: opt.label,
      description: opt.desc,
      group: opt.category,
      icon: <span className="text-base shrink-0">{opt.icon}</span>,
      badge: opt.id,
    }));
  }, []);

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
      {/* ── Top Controls: Series Title & Dropdowns in Unified Grid ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* 1. Series / Chapter Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
            Series / Chapter Title
          </label>
          <input
            type="text"
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            placeholder="Enter series or video title (optional)..."
            className="w-full h-11 px-4 py-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans"
          />
        </div>

        {/* 2. Visual Art Style Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
            Visual Art Style ({STYLE_OPTIONS.length} Styles)
          </label>
          <CyberSelect
            value={style}
            onChange={(newVal) => setStyle?.(newVal)}
            options={styleSelectOptions}
            variant="blue"
            size="md"
            searchable={true}
            placeholder="Select Visual Art Style..."
          />
        </div>

        {/* 3. Aspect Ratio Dropdown */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              Aspect Ratio ({ASPECT_RATIO_OPTIONS.length} Formats)
            </label>
            <span className="text-[10px] font-mono text-[#60A5FA] font-semibold hidden sm:inline">
              {ASPECT_RATIO_OPTIONS.find((o) => o.id === aspectRatio)?.desc.split("•")[0]?.trim()}
            </span>
          </div>
          <CyberSelect
            value={aspectRatio}
            onChange={(newVal) => setAspectRatio?.(newVal)}
            options={aspectRatioSelectOptions}
            variant="blue"
            size="md"
            searchable={false}
            placeholder="Select Aspect Ratio..."
          />
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
          placeholder="Describe your desired thumbnail composition: e.g. Epic hero awakening, blazing golden aura, dynamic battle debris, commanding low-angle pose, stormy electric sky..."
          className="w-full p-4 bg-[#121212] border border-[#2F2F2F] rounded-xl text-sm text-[#E5E5E5] placeholder-[#6B7280] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all font-sans resize-none"
        />
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
              <span>Synthesizing AI Thumbnail ({aspectRatio})...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Generate High-CTR {aspectRatio === "16:9" ? "YouTube" : aspectRatio} Thumbnail</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThumbnailPromptCard;
