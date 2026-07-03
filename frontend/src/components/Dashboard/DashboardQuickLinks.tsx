import React from "react";
import { Sparkles, Volume2, Plus, Settings } from "lucide-react";

interface DashboardQuickLinksProps {
  onGoToWorkspace: () => void;
  onGoToAudioLab: () => void;
  onGoToCharacters: () => void;
  onGoToSettings: () => void;
}

export default function DashboardQuickLinks({
  onGoToWorkspace,
  onGoToAudioLab,
  onGoToCharacters,
  onGoToSettings,
}: DashboardQuickLinksProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      <button
        onClick={onGoToWorkspace}
        className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer"
      >
        <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white">AI Scraper</p>
          <p className="text-[10px] text-neutral-500">Extract webtoon panels</p>
        </div>
      </button>

      <button
        onClick={onGoToAudioLab}
        className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer"
      >
        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Volume2 className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white">Audio Lab</p>
          <p className="text-[10px] text-neutral-500">Synthesis & character voices</p>
        </div>
      </button>

      <button
        onClick={onGoToCharacters}
        className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer"
      >
        <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white">Characters</p>
          <p className="text-[10px] text-neutral-500">Manage character profiles</p>
        </div>
      </button>

      <button
        onClick={onGoToSettings}
        className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group cursor-pointer"
      >
        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Settings className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-white">Settings</p>
          <p className="text-[10px] text-neutral-500">Global app configuration</p>
        </div>
      </button>
    </div>
  );
}
