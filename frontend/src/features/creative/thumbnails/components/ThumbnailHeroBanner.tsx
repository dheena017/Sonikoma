import React from "react";
import { Sparkles, Layers } from "lucide-react";

export const ThumbnailHeroBanner: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2F2F2F] pb-6">
      <div className="space-y-2 max-w-2xl text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-[#E5E5E5] tracking-tight leading-tight">
          AI YouTube Thumbnail{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]">
            Studio
          </span>
        </h1>
        <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed">
          Transform chapter panels, video climax moments, and AI prompts into a high-CTR 16:9 thumbnail package. Generates centered hero awakenings, split-screen showdowns, and viral typography.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-center">
        <div className="px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span>1280x720 HD &bull; 16:9</span>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailHeroBanner;

