import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Video,
  Music,
  Image as ImageIcon,
  Folder,
  Star,
  Trash2,
  ChevronDown,
  Circle,
  FileText,
  Layers,
} from "lucide-react";

interface VideoMediaBinProps {
  scrapedImages?: any[];
  panels?: any[];
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  musicTheme?: string;
  voiceActor?: string;
}

const VideoMediaBin: React.FC<VideoMediaBinProps> = ({
  scrapedImages = [],
  panels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "Synthwave Neon",
  voiceActor = "Kokoro Voice",
}) => {
  const [activeFolder, setActiveFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const folderCounts = {
    all: scrapedImages.length + panels.length,
    videos: panels.length,
    audio: panels.filter((p) => p.audio_url || p.audioUrl).length + 2,
    images: scrapedImages.length,
    scenes: panels.length,
    favorites: 2,
    trash: 0,
  };

  const folderList = [
    { id: "all", label: "All Media", count: folderCounts.all, icon: Folder },
    { id: "videos", label: "Videos", count: folderCounts.videos, icon: Video },
    { id: "audio", label: "Audio", count: folderCounts.audio, icon: Music },
    { id: "images", label: "Images", count: folderCounts.images, icon: ImageIcon },
    { id: "scenes", label: "Scenes", count: folderCounts.scenes, icon: Layers },
    { id: "favorites", label: "Favorites", count: folderCounts.favorites, icon: Star },
    { id: "trash", label: "Trash", count: folderCounts.trash, icon: Trash2 },
  ];

  return (
    <div className="w-72 sm:w-80 lg:w-[360px] bg-[#0c0c12] border-r border-neutral-800/80 flex flex-col h-full shrink-0 select-none overflow-hidden min-w-[280px]">

      {/* Header controls: Title dropdown, search, import & record */}
      <div className="p-3 border-b border-neutral-800/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 hover:text-white cursor-pointer">
            <span>Project Media</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-24 focus:w-36 transition-all bg-neutral-950 border border-neutral-800 text-[11px] text-white rounded-lg pl-6 pr-2 py-1 outline-none focus:border-purple-500 font-mono"
              />
              <Search className="h-3 w-3 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
            <button className="p-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Import Asset</span>
          </button>
          <button className="py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500 animate-pulse" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Split with Folder Tree (Left) & Asset Grid (Right) */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sub-folder tree */}
        <div className="w-28 sm:w-32 bg-[#0a0a0e] border-r border-neutral-800/60 p-1.5 space-y-0.5 shrink-0 overflow-y-auto [scrollbar-width:none]">
          {folderList.map((folder) => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{folder.label}</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                  {folder.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Asset Cards Grid */}
        <div className="flex-1 p-2 overflow-y-auto grid grid-cols-2 gap-2 content-start [scrollbar-width:none]">
          {/* Real Manga Panels */}
          {panels.map((panel: any, idx: number) => {
            const imgUrl =
              panel.img_url ||
              panel.image_url ||
              panel.panel_url ||
              panel.src ||
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60";
            const isSelected = idx === currentPanelIndex;

            return (
              <div
                key={panel.id || `p-${idx}`}
                onClick={() => setCurrentPanelIndex?.(idx)}
                className={`group relative rounded-xl border transition-all overflow-hidden cursor-pointer flex flex-col justify-between p-1.5 h-28 shadow-sm ${
                  isSelected
                    ? "border-purple-500 ring-2 ring-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                    : "border-neutral-800/80 bg-neutral-900/50 hover:border-purple-500/50"
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Panel ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold bg-purple-600/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    Panel #{idx + 1}
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-black/70 text-neutral-300 px-1 py-0.5 rounded backdrop-blur-sm">
                    00:03
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white truncate drop-shadow">
                    {panel.text_narration || panel.dialogue || `Scene Clip ${idx + 1}`}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Real Scraped Images */}
          {scrapedImages.map((scraped: any, idx: number) => {
            const imgUrl = scraped.img_url || scraped.url || scraped.src;
            if (!imgUrl) return null;

            return (
              <div
                key={scraped.id || `s-${idx}`}
                className="group relative rounded-xl border border-neutral-800/80 bg-neutral-900/50 hover:border-purple-500/50 transition-all overflow-hidden cursor-pointer flex flex-col justify-between p-1.5 h-28 shadow-sm"
              >
                <img
                  src={imgUrl}
                  alt={`Scraped Asset ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="relative z-10 flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold bg-neutral-900/80 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700">
                    Raw #{idx + 1}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-medium text-neutral-200 truncate drop-shadow">
                    {scraped.title || `Asset_${idx + 1}.png`}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Dynamic Audio Themes */}
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-900/60 to-indigo-900/60 p-2 flex flex-col justify-between relative border border-white/5 cursor-pointer hover:border-purple-400">
            <div className="flex items-center justify-between">
              <Music className="h-4 w-4 text-purple-400" />
              <span className="text-[9px] font-mono text-neutral-400">BGM</span>
            </div>
            <div className="flex items-center gap-0.5 h-5 my-auto">
              {[40, 70, 30, 90, 50, 100, 60, 80, 40, 90, 30, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-400/60 rounded-full"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="text-[10px] font-bold text-purple-200 truncate">
              {musicTheme}
            </p>
          </div>

          <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-950 to-slate-900 p-2 flex flex-col justify-between relative border border-white/5 cursor-pointer hover:border-indigo-400">
            <div className="flex items-center justify-between">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="text-[9px] font-mono text-neutral-400">TTS</span>
            </div>
            <p className="text-[10px] font-bold text-indigo-200 truncate my-auto">
              {voiceActor}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoMediaBin);
