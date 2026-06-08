import React from "react";
import { Film, Download } from "lucide-react";

interface FinalVideoPlayerProps {
  videoUrl: string;
  aspectRatio: "9:16" | "16:9";
}

export default function FinalVideoPlayer({ videoUrl, aspectRatio }: FinalVideoPlayerProps) {
  return (
    <div className="space-y-3 bg-neutral-900 border border-neutral-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2">
         <Film className="h-4 w-4 text-purple-400" />
         <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-wider">
           Final Compiled Preview
         </span>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 shadow">
          <Film className="h-3 w-3" />
          Full Video
        </button>
        <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2">
          <Download className="h-3 w-3" />
          Export
        </button>
      </div>
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg bg-black"
        style={{ aspectRatio: aspectRatio === "9:16" ? "9/16" : "16/9" }}
      />
    </div>
  );
}
