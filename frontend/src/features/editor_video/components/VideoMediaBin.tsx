import React, { useState, useRef } from "react";
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
  Eye,
  Play,
  Pause,
  X,
  Check,
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
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [customAssets, setCustomAssets] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [previewLightboxUrl, setPreviewLightboxUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoritesMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      setCustomAssets((prev) => [
        {
          id: `custom-${Date.now()}-${idx}`,
          title: file.name,
          url,
        },
        ...prev,
      ]);
    });
  };

  const allImages = [...customAssets.map((c) => c.url), ...scrapedImages];

  const formatVoiceName = (raw: string) => {
    if (!raw) return "Standard Comic Narrator";
    if (raw.includes("Sonia")) return "Sonia (UK Female)";
    if (raw.includes("Christopher")) return "Christopher (US Male)";
    if (raw.includes("Kokoro")) return "Kokoro AI Voice";
    if (raw.includes("Naruto")) return "Naruto Style EN";
    return raw.replace(/^en-[A-Z]+-/, "").replace(/Neural/i, "").trim() || raw;
  };

  const folderCounts = {
    all: allImages.length + panels.length,
    videos: panels.length > 0 ? panels.length : allImages.length,
    audio: 2 + panels.length,
    images: allImages.length > 0 ? allImages.length : panels.length,
    scenes: panels.length > 0 ? panels.length : allImages.length,
    favorites: Object.values(favoritesMap).filter(Boolean).length,
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
    <div className="w-72 sm:w-80 lg:w-[360px] bg-[#0c0c12] border-r border-neutral-800/80 flex flex-col h-full shrink-0 select-none overflow-hidden min-w-[280px] relative">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,video/*,audio/*"
        multiple
        className="hidden"
      />

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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Import Asset</span>
          </button>
          <button className="py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500 animate-pulse" />
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Horizontal Top Category Tab Bar (Left to Right) */}
      <div className="px-2 py-1.5 border-b border-neutral-800/70 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] shrink-0 bg-[#09090e]">
        {folderList.map((folder) => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isActive
                  ? "bg-purple-600/25 text-purple-300 font-bold border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border-transparent"
              }`}
            >
              <Icon className={`h-3 w-3 shrink-0 ${isActive ? "text-purple-400" : "text-neutral-500"}`} />
              <span>{folder.label}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? "bg-purple-500/30 text-purple-200 border border-purple-500/40"
                    : "bg-neutral-900 text-neutral-500 border border-neutral-800"
                }`}
              >
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Full Width Asset Cards Grid */}
      <div className="flex-1 min-h-0 relative">
        {/* Right Asset Cards Grid */}
        <div className="h-full p-2.5 overflow-y-auto grid grid-cols-2 gap-2 content-start [scrollbar-width:none]">
          {/* Filtered Manga Panels / Videos / Scenes / Favorites */}
          {(activeFolder === "all" || activeFolder === "videos" || activeFolder === "scenes" || activeFolder === "favorites") &&
            panels
              .filter((p, idx) => {
                const cardId = p.id || `p-${idx}`;
                if (activeFolder === "favorites" && !favoritesMap[cardId]) return false;
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const text = (p.text_narration || p.dialogue || p.caption || `panel ${idx + 1}`).toLowerCase();
                return text.includes(q) || String(idx + 1).includes(q);
              })
              .map((panel: any, idx: number) => {
                const cardId = panel.id || `p-${idx}`;
                const isFav = !!favoritesMap[cardId];
                const scrapedSrc = typeof scrapedImages[idx] === "string" ? scrapedImages[idx] : (scrapedImages[idx]?.img_url || scrapedImages[idx]?.url || scrapedImages[idx]?.src);
                const imgUrl =
                  panel.img_url ||
                  panel.image_url ||
                  panel.panel_url ||
                  panel.src ||
                  scrapedSrc ||
                  `https://placehold.co/400x600/121218/a855f7?text=Panel+${idx + 1}`;
                const isSelected = idx === currentPanelIndex;

                return (
                  <div
                    key={cardId}
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleFavorite(e, cardId)}
                          className={`p-1 rounded-full backdrop-blur-sm transition-colors ${
                            isFav ? "text-amber-400 bg-amber-500/20" : "text-white/60 hover:text-white bg-black/40"
                          }`}
                          title={isFav ? "Remove Favorite" : "Add Favorite"}
                        >
                          <Star className={`h-3 w-3 ${isFav ? "fill-amber-400" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewLightboxUrl(imgUrl); }}
                          className="p-1 rounded-full bg-black/40 text-white/60 hover:text-white backdrop-blur-sm transition-colors"
                          title="Quick View"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-white truncate drop-shadow">
                        {panel.text_narration || panel.dialogue || `Scene Clip ${idx + 1}`}
                      </p>
                    </div>
                  </div>
                );
              })}

          {/* Filtered Scraped Images / Custom Assets */}
          {(activeFolder === "all" || activeFolder === "images" || activeFolder === "favorites") &&
            allImages
              .filter((scraped, idx) => {
                const cardId = typeof scraped === "object" && scraped?.id ? scraped.id : `s-${idx}`;
                if (activeFolder === "favorites" && !favoritesMap[cardId]) return false;
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const titleStr = typeof scraped === "string" ? scraped : (scraped?.title || scraped?.name || `Asset_${idx + 1}`);
                return titleStr.toLowerCase().includes(q) || String(idx + 1).includes(q);
              })
              .map((scraped: any, idx: number) => {
                const cardId = typeof scraped === "object" && scraped?.id ? scraped.id : `s-${idx}`;
                const isFav = !!favoritesMap[cardId];
                const imgUrl = typeof scraped === "string" ? scraped : (scraped?.img_url || scraped?.image_url || scraped?.url || scraped?.src || scraped?.panel_url);
                if (!imgUrl) return null;
                const isSelected = idx === currentPanelIndex;
                const titleName = typeof scraped === "string"
                  ? (scraped.split("/").pop()?.split("?")[0] || `Asset_${idx + 1}.png`)
                  : (scraped?.title || `Asset_${idx + 1}.png`);

                return (
                  <div
                    key={cardId}
                    onClick={() => setCurrentPanelIndex?.(idx)}
                    className={`group relative rounded-xl border transition-all overflow-hidden cursor-pointer flex flex-col justify-between p-1.5 h-28 shadow-sm ${
                      isSelected
                        ? "border-purple-500 ring-2 ring-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                        : "border-neutral-800/80 bg-neutral-900/50 hover:border-purple-500/50"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Scraped Asset ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold bg-neutral-900/80 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700 backdrop-blur-sm">
                        Raw #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => toggleFavorite(e, cardId)}
                          className={`p-1 rounded-full backdrop-blur-sm transition-colors ${
                            isFav ? "text-amber-400 bg-amber-500/20" : "text-white/60 hover:text-white bg-black/40"
                          }`}
                          title={isFav ? "Remove Favorite" : "Add Favorite"}
                        >
                          <Star className={`h-3 w-3 ${isFav ? "fill-amber-400" : ""}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewLightboxUrl(imgUrl); }}
                          className="p-1 rounded-full bg-black/40 text-white/60 hover:text-white backdrop-blur-sm transition-colors"
                          title="Quick View"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-medium text-neutral-200 truncate drop-shadow">
                        {titleName}
                      </p>
                    </div>
                  </div>
                );
              })}

          {/* Dynamic Audio Themes & Voiceover Clips */}
          {(activeFolder === "all" || activeFolder === "audio") && (
            <>
              {/* Master BGM Theme Card */}
              <div
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-full h-28 rounded-xl bg-gradient-to-br from-purple-900/60 to-indigo-900/60 p-2.5 flex flex-col justify-between relative border border-purple-500/30 cursor-pointer hover:border-purple-400 transition-all group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Music className="h-4 w-4 text-purple-400" />
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">BGM</span>
                    <button className="p-1 rounded-full bg-purple-500/30 text-purple-200 hover:text-white transition-colors">
                      {isPlayingAudio ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 h-5 my-auto">
                  {[40, 70, 30, 90, 50, 100, 60, 80, 40, 90, 30, 60].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 bg-purple-400/60 rounded-full transition-all ${isPlayingAudio ? "animate-pulse" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold text-purple-200 truncate" title={musicTheme}>
                  {musicTheme || "Orchestral Theme"}
                </p>
              </div>

              {/* Master Voice Actor Card */}
              <div className="w-full h-28 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 p-2.5 flex flex-col justify-between relative border border-indigo-500/30 cursor-pointer hover:border-indigo-400 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="text-[9px] font-mono text-indigo-300 font-bold bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">TTS Voice</span>
                </div>
                <p className="text-[10px] font-bold text-indigo-200 truncate my-auto" title={voiceActor}>
                  {formatVoiceName(voiceActor)}
                </p>
                <span className="text-[8px] font-mono text-indigo-400/70">
                  Default Voiceover Engine
                </span>
              </div>

              {/* Individual Per-Panel Voiceover Clips */}
              {panels.map((panel: any, idx: number) => {
                const text = panel.text_narration || panel.dialogue || panel.caption || `Panel #${idx + 1} Speech`;
                return (
                  <div
                    key={`vo-card-${panel.id || idx}`}
                    onClick={() => setCurrentPanelIndex?.(idx)}
                    className="w-full h-28 rounded-xl bg-gradient-to-br from-blue-950/80 to-slate-950/80 p-2.5 flex flex-col justify-between relative border border-blue-500/30 cursor-pointer hover:border-blue-400 transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-[8px] font-mono text-blue-300 font-bold bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                        VO #{idx + 1}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-blue-200 line-clamp-2 my-auto leading-tight" title={text}>
                      "{text}"
                    </p>
                    <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500">
                      <span>{formatVoiceName(voiceActor)}</span>
                      <span className="text-blue-400 group-hover:underline">Play →</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeFolder === "trash" && (
            <div className="col-span-2 p-6 text-center text-neutral-500 text-xs font-mono">
              Trash is empty
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewLightboxUrl && (
        <div
          onClick={() => setPreviewLightboxUrl(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[85vh] bg-neutral-900 border border-purple-500/40 rounded-2xl p-2 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.3)]"
          >
            <button
              onClick={() => setPreviewLightboxUrl(null)}
              className="absolute top-4 right-4 p-1.5 bg-black/70 hover:bg-black rounded-full text-neutral-300 hover:text-white z-10 cursor-pointer border border-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewLightboxUrl}
              alt="Asset Preview"
              className="w-full h-full object-contain rounded-xl max-h-[75vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(VideoMediaBin);
