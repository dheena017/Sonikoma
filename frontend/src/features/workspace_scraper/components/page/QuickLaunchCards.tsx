import React from "react";
import { Film, Scissors, Award, ArrowRight } from "lucide-react";

export interface QuickLaunchCardsProps {
  navigateTo?: (path: string) => void;
}

export const QuickLaunchCards: React.FC<QuickLaunchCardsProps> = ({ navigateTo }) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400 font-medium max-w-2xl">
        Skip URL scraping and jump directly into specific editing or pipeline configurations.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Card 1: Video Studio */}
        <div
          onClick={() => {
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            navigateTo?.(`/scraper/editor?id=${tempId}`);
          }}
          className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
        >
          <div className="space-y-3">
            <div className="icon-pill icon-pill--purple">
              <Film className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Video Studio
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              Create, arrange, and edit panel-level animations, voiceovers, and sound effects.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Launch Studio <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Card 2: Auto-Crop Panel Editor */}
        <div
          onClick={() => navigateTo?.("/auto-crop")}
          className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
        >
          <div className="space-y-3">
            <div className="icon-pill icon-pill--purple">
              <Scissors className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Auto-Crop
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              Extract standalone panel panels from vertical strips and page-based formats automatically.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Open Cropper <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Card 3: AI Models */}
        <div
          onClick={() => navigateTo?.("/ai-models")}
          className="group cursor-pointer bg-neutral-905/40 hover:bg-purple-955/20 border border-neutral-800 hover:border-purple-500/30 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-6 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] active:scale-[0.98]"
        >
          <div className="space-y-3">
            <div className="icon-pill icon-pill--purple">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              AI Models
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed font-medium">
              Configure model parameters, api endpoints, and keys for vision, audio, and translation.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-purple-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Configure <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
