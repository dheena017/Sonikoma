import React from "react";
import { Sparkles, Video, Users, CheckCircle, Zap } from "lucide-react";

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
    },
    {
      value: "45K+",
      label: "Videos Generated",
      sub: "For TikTok, Shorts & Reels",
      icon: <Video className="w-5 h-5 text-indigo-400" />,
    },
    {
      value: "99.8%",
      label: "Inpainting Accuracy",
      sub: "Flawless bubble removal",
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    },
    {
      value: "50+",
      label: "Expressive AI Voices",
      sub: "Natural multi-speaker cast",
      icon: <Users className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const platforms = [
    { name: "Webtoon", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
    { name: "MangaDex", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
    { name: "Tapas", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
    { name: "Tappytoon", color: "text-rose-400 border-rose-500/20 bg-rose-500/5" },
    { name: "Lezhin", color: "text-red-400 border-red-500/20 bg-red-500/5" },
    { name: "KakaoPage", color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" },
    { name: "CBZ / ZIP / PDF", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
    { name: "Raw PNG / JPEG", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
  ];

  return (
    <section className="relative z-10 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* STATS COUNTERS GRID */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-[32px] border backdrop-blur-xl transition-all ${
            isLight
              ? "bg-white/90 border-slate-200/90 shadow-xl shadow-slate-200/50"
              : "bg-[#111319]/90 border-white/10 shadow-2xl shadow-black/60"
          }`}
        >
          {stats.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center sm:items-start p-3 sm:p-4 rounded-2xl transition-all ${
                isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`p-2 rounded-xl border ${
                    isLight
                      ? "bg-slate-100 border-slate-200 text-blue-600"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {item.value}
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm font-bold ${
                  isLight ? "text-slate-800" : "text-neutral-200"
                }`}
              >
                {item.label}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isLight ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                {item.sub}
              </span>
            </div>
          ))}
        </div>

        {/* COMPATIBILITY & ECOSYSTEM PILLS */}
        <div className="text-center space-y-3">
          <p
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isLight ? "text-slate-500" : "text-neutral-400"
            }`}
          >
            Universal Comic Engine — Seamlessly Ingest From Any Source
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {platforms.map((p) => (
              <span
                key={p.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 select-none ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-800 shadow-xs hover:border-blue-400"
                    : `${p.color}`
                }`}
              >
                <CheckCircle className="w-3 h-3 opacity-70" />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
