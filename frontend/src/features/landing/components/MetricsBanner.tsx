import React from "react";
import { Sparkles, Film, Users, CheckCircle, Zap } from "lucide-react";

interface MetricsBannerProps {
  themeMode?: "dark" | "light";
}

export function MetricsBanner({ themeMode = "dark" }: MetricsBannerProps) {
  const isLight = themeMode === "light";

  const stats = [
    {
      value: "500K+",
      label: "Panels Sliced",
      sub: "Across 4,200+ chapters",
      icon: <Zap className="w-5 h-5 text-blue-400" />,
      glowColor: "from-blue-500/20 to-transparent",
      badgeColor: isLight ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      value: "45K+",
      label: "Videos Generated",
      sub: "For TikTok, Shorts & Reels",
      icon: <Film className="w-5 h-5 text-blue-400" />,
      glowColor: "from-blue-500/20 to-transparent",
      badgeColor: isLight ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      value: "99.8%",
      label: "Inpainting Accuracy",
      sub: "Flawless bubble removal",
      icon: <Sparkles className="w-5 h-5 text-blue-400" />,
      glowColor: "from-blue-500/20 to-transparent",
      badgeColor: isLight ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      value: "50+",
      label: "Expressive AI Voices",
      sub: "Natural multi-speaker cast",
      icon: <Users className="w-5 h-5 text-blue-400" />,
      glowColor: "from-blue-500/20 to-transparent",
      badgeColor: isLight ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
  ];

  const platforms = [
    { name: "Webtoon", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "MangaDex", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "Tapas", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "Tappytoon", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "Lezhin", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "KakaoPage", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "CBZ / ZIP / PDF", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
    { name: "Raw PNG / JPEG", color: "text-neutral-300 border-[#2F2F2F] bg-[#181818] hover:border-blue-500/50 hover:text-blue-400" },
  ];

  return (
    <section className="relative z-10 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* STATS COUNTERS GRID */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-[32px] border backdrop-blur-xl transition-all ${
            isLight
              ? "bg-white/95 border-slate-200/90 shadow-xl shadow-slate-200/50"
              : "bg-[#181818] border-[#2F2F2F] shadow-xl"
          }`}
        >
          {stats.map((item, index) => (
            <div
              key={index}
              className={`group relative flex flex-col items-center sm:items-start p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                isLight
                  ? "bg-slate-50/60 border-slate-200/60 hover:bg-white hover:shadow-md hover:border-blue-300"
                  : "bg-[#141414] border-[#2F2F2F] hover:bg-[#1a1a1a] hover:border-blue-500/40"
              }`}
            >
              {/* Subtle hover top glow */}
              <div
                className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${item.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className={`p-2 rounded-xl border transition-transform duration-300 group-hover:scale-105 shrink-0 ${item.badgeColor}`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight select-none ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {item.value}
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight ${
                  isLight ? "text-slate-800" : "text-neutral-100"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`text-[11px] font-medium mt-0.5 ${
                  isLight ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                {item.sub}
              </span>
            </div>
          ))}
        </div>

        {/* COMPATIBILITY & ECOSYSTEM PILLS */}
        <div className="text-center space-y-3.5">
          <p
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Universal Comic Engine — Seamlessly Ingest From Any Source
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {platforms.map((p) => (
              <span
                key={p.name}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 select-none ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-800 shadow-xs hover:border-blue-400 hover:text-blue-600"
                    : `${p.color}`
                }`}
              >
                <CheckCircle className="w-3 h-3 opacity-80" />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

