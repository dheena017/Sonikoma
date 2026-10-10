import React from "react";
import {
  Sparkles,
  Film,
  Layers,
  Clock,
  Compass,
  ArrowRight,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

interface StarterTemplate {
  id: string;
  title: string;
  genre: string;
  panelsCount: number;
  duration: string;
  fps: string;
  description: string;
  voiceStyle: string;
  audioPreset: string;
  demoUrl: string;
}

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "cyber-neon-samurai",
    title: "Cyber Neon Samurai: Chapter 1",
    genre: "Cyberpunk / Shonen",
    panelsCount: 18,
    duration: "1m 45s",
    fps: "60 FPS",
    description:
      "High-contrast neon alleyways, dual katana combat slices, and fast-paced dynamic zooms with synthwave audio cues.",
    voiceStyle: "Kenji AI (Heroic)",
    audioPreset: "Synthwave Pulse & Rain Ambience",
    demoUrl: "https://www.webtoons.com/en/demo/cyber-neon-samurai",
  },
  {
    id: "solitude-cafe",
    title: "Solitude Cafe: Rainy Afternoon",
    genre: "Slice of Life / Drama",
    panelsCount: 12,
    duration: "1m 15s",
    fps: "30 FPS",
    description:
      "Gentle coffee shop dialogue, steam particles, soft camera drift, and relaxing lofi hip-hop background soundscape.",
    voiceStyle: "Hana AI (Gentle)",
    audioPreset: "Warm Lo-Fi & Gentle Raindrop SFX",
    demoUrl: "https://www.webtoons.com/en/demo/solitude-cafe",
  },
  {
    id: "shadow-sovereign",
    title: "Shadow Sovereign: Gate Awakening",
    genre: "Dark Fantasy / Manhwa",
    panelsCount: 24,
    duration: "2m 30s",
    fps: "60 FPS",
    description:
      "Vertical scroll dungeon raid, intense multi-layer parallax shadows, blue lightning aura VFX, and deep villain speech.",
    voiceStyle: "Valk AI (Deep Ruler)",
    audioPreset: "Orchestral Choir & Bass Drops",
    demoUrl: "https://www.webtoons.com/en/demo/shadow-sovereign",
  },
];

export default function DashboardStarterTemplates() {
  const handleTryDemo = (template: StarterTemplate) => {
    try {
      localStorage.setItem("auto_import_url", template.demoUrl);
      localStorage.setItem("demo_template_name", template.title);
    } catch (e) {
      // ignore storage errors
    }
    navigateToDashboardPath("/scraper");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
            <Compass className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#E5E5E5] tracking-tight">
                Starter Manga Packs &amp; Demos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF] text-[10px] font-mono font-bold uppercase tracking-wider">
                Instant Try
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Jumpstart your first anime reel with pre-configured storyboard templates, panel cuts &amp; voice setups.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateToDashboardPath("/scraper")}
          className="self-start sm:self-auto text-xs font-mono font-bold text-[#3B82F6] hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Open Webtoon Scraper</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 3 Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STARTER_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-neutral-700 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between text-left group"
          >
            <div>
              {/* Top metadata tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#2F2F2F] bg-[#141414] text-[#9CA3AF]">
                  {tpl.genre}
                </span>
                <span className="text-[10px] font-mono text-[#6B7280] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {tpl.duration}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-[#E5E5E5] group-hover:text-white transition-colors mb-2">
                {tpl.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4 line-clamp-3">
                {tpl.description}
              </p>

              {/* Technical Specifications Chips */}
              <div className="space-y-2 p-3 rounded-xl bg-[#141414] border border-[#282828] text-[11px] font-mono mb-4">
                <div className="flex items-center justify-between text-[#9CA3AF]">
                  <span>Panels:</span>
                  <span className="font-bold text-[#E5E5E5]">{tpl.panelsCount} Slices ({tpl.fps})</span>
                </div>
                <div className="flex items-center justify-between text-[#9CA3AF]">
                  <span>Voice Actor:</span>
                  <span className="text-[#3B82F6] font-medium truncate max-w-[150px]">{tpl.voiceStyle}</span>
                </div>
                <div className="flex items-center justify-between text-[#9CA3AF]">
                  <span>Audio Mix:</span>
                  <span className="text-[#9CA3AF] font-medium truncate max-w-[150px]">{tpl.audioPreset}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => handleTryDemo(tpl)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clone &amp; Start</span>
              </button>

              <button
                type="button"
                onClick={() => navigateToDashboardPath("/video-editor")}
                title="Preview Video Editor"
                className="p-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#2F2F2F] hover:border-neutral-700 text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
              >
                <Film className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
