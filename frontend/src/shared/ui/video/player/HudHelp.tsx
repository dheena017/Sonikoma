import React from "react";
import { Sliders } from "lucide-react";

export interface VideoPreviewHudHelpProps {
  show: boolean;
}

export const VideoPreviewHudHelp: React.FC<VideoPreviewHudHelpProps> = ({
  show,
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-[60] animate-fade-in p-6">
      <div className="h-10 w-10 rounded-full bg-[#2A2A2A] border border-[#3B82F6]/30 flex items-center justify-center mb-1">
        <Sliders className="h-5 w-5 text-[#3B82F6] animate-pulse" />
      </div>
      <h4 className="text-xs font-mono text-[#60A5FA] font-bold uppercase tracking-widest">
        Keyboard HUD Shortcuts
      </h4>
      <div className="grid grid-cols-2 gap-4 max-w-2xl text-left text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            Space
          </span>
          <span>Play/Pause / Hold to 2x FF</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            L
          </span>
          <span>Toggle Loop Playback</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            P
          </span>
          <span>Toggle Picture-in-Picture</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            0-9
          </span>
          <span>Jump to % of Duration (e.g. 5 is 50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            ,
          </span>
          <span>Step Frame Back</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            .
          </span>
          <span>Step Frame Forward</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            Shift
          </span>
          <span>Snap to Chapter Boundaries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-white">
            ? / /
          </span>
          <span>Show This HUD Overlay</span>
        </div>
      </div>
    </div>
  );
};
