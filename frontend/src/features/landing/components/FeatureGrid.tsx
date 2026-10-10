import React from "react";
import {
  Scissors,
  Sparkles,
  Volume2,
  Film,
  Languages,
  Share2,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";

interface FeatureGridProps {
  themeMode?: "dark" | "light";
  onGetStarted: () => void;
}

export function FeatureGrid({
  themeMode = "dark",
  onGetStarted,
}: FeatureGridProps) {
  const isLight = themeMode === "light";

  const features = [
    {
      id: "slicing",
      icon: <Scissors className="w-6 h-6 text-blue-400" />,
      tag: "Vision AI Slicer",
      tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      title: "Intelligent Panel Segmentation",
      description:
        "Analyzes continuous vertical scrolls and manga spreads to automatically identify panel boundaries, gutters, and irregular frame angles with pixel precision.",
      bullets: [
        "Zero-gap gutter detection",
        "Irregular polygon & angled panels",
        "Multi-chapter bulk extraction",
      ],
      gradient: "from-blue-600/20 via-transparent to-transparent",
    },
    {
      id: "inpainting",
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      tag: "Neural Inpainting",
      tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      title: "Seamless Speech Bubble Eraser",
      description:
        "Gemini Vision detects dialogue balloons, SFX sound text, and caption boxes, instantly reconstructing the hidden background art with zero visual distortion.",
      bullets: [
        "Contextual texture reconstruction",
        "Preserves line art & character details",
        "Manual refinement brush & undo history",
      ],
      gradient: "from-purple-600/20 via-transparent to-transparent",
    },
    {
      id: "dubbing",
      icon: <Volume2 className="w-6 h-6 text-cyan-400" />,
      tag: "Character Dubbing",
      tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      title: "Multi-Character AI Voice Cast",
      description:
        "Assign distinct voice actors to protagonists, villains, sidekicks, and narrators. Natural pauses, breath timing, and emotional inflection bring dialogue to life.",
      bullets: [
        "50+ expressive male & female voices",
        "Custom pitch, speed & tone parameters",
        "Automatic dialogue-to-speech synchronization",
      ],
      gradient: "from-cyan-600/20 via-transparent to-transparent",
    },
    {
      id: "camera",
      icon: <Film className="w-6 h-6 text-indigo-400" />,
      tag: "Cinematic Engine",
      tagColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      title: "Dynamic Camera Choreography",
      description:
        "Transform flat images into cinematic movie sequences with automated vertical tracking, suspenseful zoom-ins on intense clashes, and dynamic action camera shakes.",
      bullets: [
        "Smooth Ken Burns pan & zoom curves",
        "Impact shockwave & screen shake presets",
        "Customizable pacing per comic frame",
      ],
      gradient: "from-indigo-600/20 via-transparent to-transparent",
    },
    {
      id: "translation",
      icon: <Languages className="w-6 h-6 text-emerald-400" />,
      tag: "Multi-Lingual OCR",
      tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      title: "Instant Manga & Manhwa Translation",
      description:
        "Read raw Korean, Japanese, and Chinese dialogue straight from the source. The AI automatically translates text to English and creates synchronized anime-style captions.",
      bullets: [
        "Korean Hangul & Japanese Kanji OCR",
        "Context-aware idiom translation",
        "Karaoke-style subtitle highlight animation",
      ],
      gradient: "from-emerald-600/20 via-transparent to-transparent",
    },
    {
      id: "export",
      icon: <Share2 className="w-6 h-6 text-amber-400" />,
      tag: "Viral Formats",
      tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      title: "One-Click Social Video Exports",
      description:
        "Directly render 9:16 vertical videos tailored for high engagement on TikTok, YouTube Shorts, and Instagram Reels with crystal-clear 1080p and 4K 60fps output.",
      bullets: [
        "Optimized 9:16 vertical ratio",
        "Watermark-free export on Pro",
        "Custom creator intro & outro branding",
      ],
      gradient: "from-amber-600/20 via-transparent to-transparent",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Core AI Capabilities</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Engineered specifically for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400">
              Webtoon & Manga Storytellers
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Everything you need to turn static comic chapters into high-retention
            animated video reels without touching complex timeline video software.
          </p>
        </div>

        {/* 6 FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative rounded-[28px] border p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 overflow-hidden ${
                isLight
                  ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400"
                  : "bg-[#12131a] border-white/10 hover:border-white/25 hover:shadow-2xl hover:shadow-blue-950/30"
              }`}
            >
              {/* Subtle gradient hover highlight */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
              />

              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${
                      isLight
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    {feature.icon}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border ${feature.tagColor}`}
                  >
                    {feature.tag}
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-xl font-bold tracking-tight mb-2.5 transition-colors ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isLight ? "text-slate-600" : "text-neutral-400"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                  {feature.bullets.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span
                        className={isLight ? "text-slate-700" : "text-neutral-300"}
                      >
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 relative z-10">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer group-hover:gap-2.5 ${
                    isLight
                      ? "text-blue-600 hover:text-blue-700"
                      : "text-blue-400 hover:text-blue-300"
                  }`}
                >
                  <span>Try in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
