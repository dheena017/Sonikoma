import React from "react";
import { Clock, Layers, Play } from "lucide-react";
import { StoryScene } from "../../../types/workspace.types";

interface StorySceneCardProps {
  scene: StoryScene;
  onSelectScene: () => void;
  onJumpToScene: (e: React.MouseEvent) => void;
}

export const StorySceneCard: React.FC<StorySceneCardProps> = ({
  scene,
  onSelectScene,
  onJumpToScene,
}) => {
  return (
    <div
      onClick={onSelectScene}
      className="p-3 rounded-[1.75rem] bg-[#07060f] border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all space-y-2 group shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_48px_rgba(168,85,247,0.22)]"
    >
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono font-semibold text-purple-200 bg-purple-500/12 px-2 py-0.5 rounded-full border border-purple-500/20 shrink-0">
            Scene #{scene.sceneNumber}
          </span>
          <span className="text-xs font-semibold text-white group-hover:text-purple-100 transition-colors truncate">
            {scene.title}
          </span>
        </div>
        <span className="text-[9px] font-mono text-neutral-400 flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3 text-purple-400" />
          {scene.duration} · {scene.panelCount} Panels
        </span>
      </div>

      <div className="space-y-1 text-[10px]">
        <div className="flex items-start gap-1 text-purple-300 font-mono italic">
          <span className="text-neutral-500 font-bold shrink-0">Dialogue:</span>
          <span>“{scene.dialogue}”</span>
        </div>
        <div className="flex items-start gap-1 text-neutral-400 leading-tight">
          <span className="text-neutral-500 font-mono font-bold shrink-0">Action:</span>
          <span>{scene.narration}</span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-neutral-500 border-t border-neutral-800/40">
        <span className="flex items-center gap-1 text-purple-400/80">
          <Layers className="h-2.5 w-2.5" /> Synchronized with Timeline
        </span>
        <button
          onClick={onJumpToScene}
          className="px-3 py-1 rounded-2xl bg-neutral-800/75 hover:bg-purple-600 text-neutral-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
        >
          <Play className="h-2.5 w-2.5" /> Jump to Scene
        </button>
      </div>
    </div>
  );
};
