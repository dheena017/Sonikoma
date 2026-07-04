import React from "react";
import { Sparkles, Scissors, Sliders, Volume2, Cpu } from "lucide-react";

export default function DashboardAIPipeline() {
  return (
    <div className="bg-[#0b0b0e]/50 border border-white/5 rounded-3xl p-6 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">AI Processing Pipeline</h3>
      </div>
      <p className="text-xs text-neutral-400 font-mono mb-6 leading-relaxed">
        Sonikoma orchestrates multiple specialized models to synthesize static
        webtoon series strips into full cinematic animated videos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center shrink-0 text-purple-400">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              1. Smart Panel Slicer
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Runs Canny Edge detection algorithms on backend workers to detect
              gutters, isolate layout frames, and slice strips cleanly.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-950/40 border border-indigo-800/30 flex items-center justify-center shrink-0 text-indigo-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              2. Speech Bubble OCR & Clean
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Locates text boundaries in comics, erases speech bubbles using
              clearing methods, and OCR transcribes dialog into transcription
              nodes.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shrink-0 text-cyan-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              3. Dialog Voice Synthesis
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Streams script lines into advanced voice generation engines to
              assign custom voices to different characters.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-xl bg-pink-950/40 border border-pink-800/30 flex items-center justify-center shrink-0 text-pink-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">
              4. FFmpeg Video Compositor
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Binds sliced visuals with generated audios, overlays ambient
              soundscapes, and compiles MP4 render outputs using smooth camera
              paths.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
