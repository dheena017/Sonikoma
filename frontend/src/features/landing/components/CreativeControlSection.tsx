import React from "react";
import { Languages, Volume2, Film } from "lucide-react";
import type { ThemeMode } from "../types";

export interface CreativeControlSectionProps {
  themeMode?: ThemeMode;
}

export function CreativeControlSection({
  themeMode = "dark",
}: CreativeControlSectionProps) {
  const isLight = themeMode === "light";

  const features = [
    {
      icon: <Languages className="h-5 w-5" />,
      number: "01",
      title: "Keep dialogue clear",
      description:
        "Clean speech bubbles and translate dialogue to help more viewers follow along.",
      accent: isLight
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
    {
      icon: <Volume2 className="h-5 w-5" />,
      number: "02",
      title: "Set the tone with sound",
      description:
        "Choose character voices, narration, and sound to give each moment its own mood.",
      accent: isLight
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-blue-400/10 border-blue-300/20 text-blue-300",
    },
    {
      icon: <Film className="h-5 w-5" />,
      number: "03",
      title: "Find your story's rhythm",
      description:
        "Arrange panels and camera movement into a vertical sequence made for watching.",
      accent: isLight
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
  ];

  return (
    <section
      className={`py-20 sm:py-24 px-6 relative z-10 ${
        isLight
          ? "bg-slate-100/70 border-y border-slate-200"
          : "bg-[#0d0e12] border-y border-[#2F2F2F]"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span
            className={`text-xs font-bold uppercase tracking-[0.18em] ${
              isLight ? "text-blue-700" : "text-blue-400"
            }`}
          >
            Your creative direction
          </span>
          <h2
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            The details are what make it yours.
          </h2>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Let AI help with the production work, while you stay close to the
            choices that shape how your story feels.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <article
              key={feature.number}
              className={`rounded-2xl border p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 ${
                isLight
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-lg"
                  : "bg-[#181818] border-[#2F2F2F] hover:border-white/20 hover:shadow-xl hover:shadow-black/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${feature.accent}`}
                >
                  {feature.icon}
                </span>
                <span
                  className={`font-mono text-xs font-bold ${
                    isLight ? "text-slate-400" : "text-neutral-600"
                  }`}
                >
                  {feature.number}
                </span>
              </div>
              <h3
                className={`mt-6 text-lg font-bold ${
                  isLight ? "text-slate-950" : "text-white"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  isLight ? "text-slate-600" : "text-neutral-400"
                }`}
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        <p
          className={`text-center text-xs leading-relaxed ${
            isLight ? "text-slate-500" : "text-neutral-500"
          }`}
        >
          Always use comics and images you have the right to adapt.
        </p>
      </div>
    </section>
  );
}
