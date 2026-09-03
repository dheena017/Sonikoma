import React, { useState } from "react";
import { Volume2 } from "lucide-react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

export function CinematicRenderDemo({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  const [isPlaying] = useState(true);
  const [audioStyle, setAudioStyle] = useState("Aiden - Epic Trailer");
  const [musicTheme, setMusicTheme] = useState("Cyberpunk Synthwave");
  const [aspect, setAspect] = useState("9:16 Vertical");

  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden shadow-xl p-5 md:p-6 space-y-5 transition-all duration-300 ${
        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-neutral-950"
      }`}
    >
      {/* Editor Header */}
      <div
        className={`flex items-center justify-between border-b pb-4 transition-colors ${
          isLight ? "border-slate-200" : "border-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span
            className={`text-xs font-mono ml-3 font-semibold transition-colors ${
              isLight ? "text-slate-700" : "text-neutral-300"
            }`}
          >
            render_studio.tsx
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onGetStarted}
            className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-[#3B82F6] transition-colors cursor-pointer"
          >
            Export Video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Panels List */}
        <div className="lg:col-span-1 space-y-2.5">
          <div
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              isLight ? "text-slate-800" : "text-neutral-200"
            }`}
          >
            Panels (12)
          </div>
          <div className="space-y-1.5 h-48 overflow-y-auto pr-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  i === 0
                    ? isLight
                      ? "bg-purple-50 border-[#3B82F6] text-purple-700 font-bold"
                      : "bg-purple-600/25 border-[#3B82F6] text-white font-bold"
                    : isLight
                    ? "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:text-slate-950 font-medium"
                    : "bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-neutral-700 font-medium"
                }`}
              >
                Panel {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-2.5">
          <div
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              isLight ? "text-slate-800" : "text-neutral-200"
            }`}
          >
            Viewport Preview
          </div>
          <div className="relative w-full aspect-video bg-gradient-to-br from-neutral-900 to-black rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="w-28 h-44 bg-gradient-to-br from-purple-700 to-indigo-900 rounded-lg border border-white/20 shadow-xl relative overflow-hidden flex flex-col items-center justify-center text-center p-2">
              <span className="text-white text-xs font-bold">Panel 1 Motion</span>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-emerald-400 text-[9px] font-mono font-bold">
                {aspect}
              </div>
            </div>
            <div
              className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm ${
                isPlaying
                  ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300"
                  : "bg-neutral-900/50 border border-white/10 text-neutral-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isPlaying ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                }`}
              />
              <span className="text-[10px] font-mono font-bold">
                {isPlaying ? "RENDERING 60FPS" : "IDLE"}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-3.5">
          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider block mb-1.5 transition-colors ${
                isLight ? "text-slate-800" : "text-neutral-200"
              }`}
            >
              Aspect Ratio
            </label>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:border-[#3B82F6] outline-none cursor-pointer transition-all ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900"
                  : "bg-neutral-900 border-neutral-700 text-white"
              }`}
            >
              <option>9:16 Vertical</option>
              <option>16:9 Horizontal</option>
              <option>1:1 Square</option>
            </select>
          </div>

          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider block mb-1.5 transition-colors ${
                isLight ? "text-slate-800" : "text-neutral-200"
              }`}
            >
              Narrator Voice
            </label>
            <select
              value={audioStyle}
              onChange={(e) => setAudioStyle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:border-[#3B82F6] outline-none cursor-pointer transition-all ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900"
                  : "bg-neutral-900 border-neutral-700 text-white"
              }`}
            >
              <option>Aiden - Epic Trailer</option>
              <option>Sofia - Dramatic</option>
              <option>Marcus - Deep</option>
            </select>
          </div>

          <div>
            <label
              className={`text-xs font-bold uppercase tracking-wider block mb-1.5 transition-colors ${
                isLight ? "text-slate-800" : "text-neutral-200"
              }`}
            >
              Music Theme
            </label>
            <select
              value={musicTheme}
              onChange={(e) => setMusicTheme(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs font-medium focus:border-[#3B82F6] outline-none cursor-pointer transition-all ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900"
                  : "bg-neutral-900 border-neutral-700 text-white"
              }`}
            >
              <option>Cyberpunk Synthwave</option>
              <option>Epic Adventure</option>
              <option>Chill Lofi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Narrative Waveform Panel */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-3 transition-all ${
          isLight
            ? "bg-slate-50 border-slate-200 text-slate-800"
            : "bg-neutral-900/80 border-white/10 text-neutral-200"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span className="text-xs font-semibold font-mono">
            Audio Track: {audioStyle}
          </span>
        </div>

        {/* Waveform visualization */}
        <div className="flex items-center gap-1 h-5 shrink-0 w-36">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-xs"
              style={{
                height: `${30 + ((i * 17) % 70)}%`,
                opacity: 0.75,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

