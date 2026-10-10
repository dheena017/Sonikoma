import React from "react";
import {
  Globe,
  Film,
  Mic,
  Scissors,
  Sparkles,
  Wand2,
  ArrowUpRight,
  ChevronRight,
  Layers,
} from "lucide-react";

interface ProjectsQuickLauncherProps {
  onOpenScraper?: () => void;
  onOpenAiStudio?: () => void;
}

export default function ProjectsQuickLauncher({
  onOpenScraper,
  onOpenAiStudio,
}: ProjectsQuickLauncherProps) {
  const navigate = (path: string) => {
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") nav(path);
    else window.location.href = path;
  };

  const MODULES = [
    {
      id: "scraper",
      title: "Webtoon & Manga Scraper",
      badge: "Ingestion Hub",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description: "Import chapters from URLs, Webtoons, MangaDex, or upload raw comic image files.",
      path: "/scraper",
      icon: Globe,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      action: onOpenScraper || (() => navigate("/scraper")),
    },
    {
      id: "video-editor",
      title: "AI Video Editor & 2.5D Motion",
      badge: "Timeline 2.5D",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      description: "Keyframe camera pans, zooms, multi-plane parallax depth, and cinematic scene transitions.",
      path: "/video-editor",
      icon: Film,
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
      action: () => navigate("/video-editor"),
    },
    {
      id: "voice-studio",
      title: "Voice Studio & Character Casting",
      badge: "Neural Audio",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description: "Assign distinct voice actors, emotional tones, and generate expressive dialogue tracks.",
      path: "/characters",
      icon: Mic,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      action: () => navigate("/characters"),
    },
    {
      id: "image-editor",
      title: "Smart Panel Slicer & OCR",
      badge: "Computer Vision",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description: "Auto-detect comic gutters, erase speech bubbles with inpainting, and extract text transcriptions.",
      path: "/image-editor",
      icon: Scissors,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      action: () => navigate("/image-editor"),
    },
    {
      id: "ai-series",
      title: "Autonomous AI Series Studio",
      badge: "Episodic Engine",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description: "Generate multi-chapter series with consistent character DNA and closed story arcs.",
      path: "/ai-series",
      icon: Layers,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      action: onOpenAiStudio || (() => navigate("/ai-series")),
    },
    {
      id: "creative-suite",
      title: "Creative Suite & Distribution",
      badge: "Productivity",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      description: "AI auto-translation, anime thumbnail generator, and direct YouTube Shorts exporter.",
      path: "/creative-suite",
      icon: Wand2,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      action: () => navigate("/creative-suite"),
    },
  ];

  return (
    <div className="space-y-4 text-left">
      {/* Section Header Matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#E5E5E5] tracking-tight">
                Studio Creation Suite
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                6 Core Engines
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Launch dedicated creative workspaces for comic ingestion, panel slicing, voice casting &amp; 2.5D animation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/scraper")}
          className="self-start sm:self-auto text-xs font-mono font-bold text-[#3B82F6] hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Explore Workspaces</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 6 Core Module Cards Matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              onClick={module.action}
              className="p-4 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-blue-500/50 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group cursor-pointer flex flex-col justify-between text-left"
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${module.iconBg} ${module.iconColor} border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${module.badgeColor}`}
                    >
                      {module.badge}
                    </span>
                    <div className="p-1 rounded-lg bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] group-hover:text-white group-hover:border-neutral-700 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="text-sm font-bold text-[#E5E5E5] group-hover:text-white transition-colors mb-1.5">
                  {module.title}
                </h3>

                {/* Card Description */}
                <p className="text-xs text-[#9CA3AF] font-sans leading-relaxed line-clamp-2">
                  {module.description}
                </p>
              </div>

              {/* Bottom Quick Launch Action */}
              <div className="mt-4 pt-3 border-t border-[#2F2F2F] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors">
                  Launch Engine
                </span>
                <span className="font-bold text-[#3B82F6] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Open <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
