import React from "react";
import { Youtube } from "lucide-react";

export const ThumbnailHeroBanner: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#262626] pb-6">
      <div className="space-y-2 max-w-2xl text-left">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center text-[#3B82F6] shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <span>AI YouTube Thumbnail Studio</span>
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed">
          Transform chapter panels, video climax moments, and AI prompts into a high-CTR 16:9 thumbnail package. Generates centered hero awakenings, split-screen showdowns, and viral typography.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-center">
        <div className="px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-neutral-400 text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span>1280×720 HD &bull; 16:9</span>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailHeroBanner;
