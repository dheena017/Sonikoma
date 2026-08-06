import React from "react";
import { BookOpen, ChevronRight, FileText, Settings, Sliders } from "lucide-react";

interface GuidesReferenceProps {
  onNavigate: (path: string) => void;
}

export default function GuidesReference({ onNavigate }: GuidesReferenceProps) {
  return (
    <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-purple-400" />
        Guides & Reference
      </h3>

      <div className="space-y-3">
        <button
          onClick={() => onNavigate("/shortcuts")}
          className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-purple-900/10 border border-purple-500/10 flex items-center justify-center text-purple-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Keyboard Shortcuts
              </h4>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                Quickly edit storyboards & camera sweeps
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors shrink-0" />
        </button>

        <button
          onClick={() => onNavigate("/settings")}
          className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-900/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Pipeline Settings
              </h4>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                Configure OCR & voice models
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-indigo-400 transition-colors shrink-0" />
        </button>

        <button
          onClick={() => onNavigate("/logs")}
          className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-cyan-900/10 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                System Output Logs
              </h4>
              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                Examine processing execution in real-time
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0" />
        </button>
      </div>
    </div>
  );
}
