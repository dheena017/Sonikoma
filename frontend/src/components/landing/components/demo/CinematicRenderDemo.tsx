import React, { useState } from "react";
import { Volume2 } from "lucide-react";

export function CinematicRenderDemo({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioStyle, setAudioStyle] = useState("Aiden - Epic Trailer");
  const [musicTheme, setMusicTheme] = useState("Cyberpunk Synthwave");
  const [aspect, setAspect] = useState("9:16 Vertical");

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-550" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-neutral-500 font-mono ml-4">
            render_editor.tsx
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer">
            Preview
          </button>
          <button
            onClick={onGetStarted}
            className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-500 transition-colors cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panels List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Panels (12)
          </div>
          <div className="space-y-2 h-48 overflow-y-auto">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-xs cursor-pointer transition-all ${
                  i === 0
                    ? "bg-purple-600/20 border-purple-500 text-white"
                    : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:border-white/10"
                }`}
              >
                Panel {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Viewport
          </div>
          <div className="relative w-full aspect-video bg-gradient-to-br from-neutral-900 to-black rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]" />
            <div className="w-32 h-48 bg-gradient-to-br from-purple-700 to-indigo-900 rounded-lg border border-white/10 shadow-2xl shadow-purple-600/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-emerald-400 text-[8px] font-mono">
                {aspect}
              </div>
            </div>
            <div
              className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity ${
                isPlaying
                  ? "bg-emerald-500/20 border border-emerald-400"
                  : "bg-neutral-900/50 border border-white/10"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"
                }`}
              />
              <span className="text-[10px] font-mono">
                {isPlaying ? "RENDERING" : "IDLE"}
              </span>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspect}
              onChange={(e) => setAspect(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
            >
              <option>9:16 Vertical</option>
              <option>16:9 Horizontal</option>
              <option>1:1 Square</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Narrator Voice
            </label>
            <select
              value={audioStyle}
              onChange={(e) => setAudioStyle(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
            >
              <option>Aiden - Epic Trailer</option>
              <option>Sofia - Dramatic</option>
              <option>Marcus - Deep</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Music Theme
            </label>
            <select
              value={musicTheme}
              onChange={(e) => setMusicTheme(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-white/10 rounded text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
            >
              <option>Cyberpunk Synthwave</option>
              <option>Epic Adventure</option>
              <option>Chill Lofi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Narrative Waveform Panel */}
      <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-purple-400 shrink-0" />
          <span className="text-xs font-mono text-neutral-400">
            Audio Track: {audioStyle}
          </span>
        </div>

        {/* Waveform visualization */}
        <div className="flex items-center gap-1 h-6 shrink-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-sm"
              style={{
                height: `${Math.random() * 100}%`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
