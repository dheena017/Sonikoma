import React from "react";
import { Sparkles, Scissors, Sliders, Volume2, Cpu } from "lucide-react";

export default function DashboardAIPipeline() {
  return (
    <div className="bg-gradient-to-br from-[#0c0c14] via-[#10101c] to-[#141424] border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Sparkles className="h-4 w-4 text-purple-400" />
        </div>
        <h3 className="text-lg font-black text-white">
          AI Manga-to-Video Engine
        </h3>
      </div>
      <p className="text-xs text-neutral-400 font-mono mb-6 leading-relaxed">
        Sonikoma orchestrates specialized neural models to synthesize static
        webtoon series strips into full cinematic animated videos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 h-fit shrink-0">
            <Scissors className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">
              1. Smart Panel Slicer
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Runs Canny Edge detection algorithms on backend workers to detect
              gutters, isolate layout frames, and slice strips cleanly.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 h-fit shrink-0">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">
              2. Bubble OCR & Clean
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Locates text boundaries in comics, erases speech bubbles using
              inpainting methods, and OCR transcribes dialogue nodes.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 h-fit shrink-0">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">
              3. Dialogue Voice Synthesis
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Streams script lines into voice generation engines to assign
              custom character voices and emotive tones.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-pink-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 h-fit shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">
              4. Video Compositor
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Binds sliced visuals with generated audios, overlays ambient
              soundscapes, and compiles MP4 video output with dynamic camera
              paths.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
