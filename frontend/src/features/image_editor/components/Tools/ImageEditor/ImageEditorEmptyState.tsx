import React from "react";
import { Sparkles, UploadCloud, Zap, ImagePlus, ArrowLeft } from "lucide-react";

interface ImageEditorEmptyStateProps {
  onImagesUploaded: (urls: string[]) => void;
  onLoadSample: (sampleDataUrl: string) => void;
  navigateTo?: (path: string) => void;
}

export const ImageEditorEmptyState: React.FC<ImageEditorEmptyStateProps> = ({
  onImagesUploaded,
  onLoadSample,
  navigateTo,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });

    onImagesUploaded(newUrls);
  };

  const handleLoadSamplePanel = () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#311042"/>
        </linearGradient>
        <linearGradient id="p1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <rect width="800" height="1200" fill="url(#bg)"/>
      
      <!-- Frame 1 -->
      <rect x="40" y="50" width="720" height="340" rx="16" fill="url(#p1)" stroke="#a855f7" stroke-width="3" filter="url(#glow)"/>
      <text x="400" y="190" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 01</text>
      <text x="400" y="230" fill="#c084fc" font-family="monospace" font-size="16" text-anchor="middle">SONIKOMA VISION PIPELINE</text>

      <!-- Speech Bubble -->
      <ellipse cx="230" cy="130" rx="110" ry="42" fill="#ffffff" stroke="#a855f7" stroke-width="3"/>
      <polygon points="210,168 240,168 220,198" fill="#ffffff" stroke="#a855f7" stroke-width="3"/>
      <text x="230" y="135" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="800" text-anchor="middle">Ready for Editing!</text>

      <!-- Frame 2 -->
      <rect x="40" y="420" width="720" height="340" rx="16" fill="url(#p1)" stroke="#6366f1" stroke-width="3"/>
      <text x="400" y="570" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 02</text>
      <text x="400" y="610" fill="#818cf8" font-family="monospace" font-size="16" text-anchor="middle">Test Auto-Crop, Slicing & Erasing</text>

      <!-- Frame 3 -->
      <rect x="40" y="790" width="720" height="360" rx="16" fill="url(#p1)" stroke="#38bdf8" stroke-width="3"/>
      <text x="400" y="960" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 03</text>
      <text x="400" y="1000" fill="#38bdf8" font-family="monospace" font-size="16" text-anchor="middle">Export & Publish Video Stream</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(sampleSvg)}`;
    onLoadSample(dataUrl);
  };

  const handleNavigate = (path: string) => {
    if (navigateTo) {
      navigateTo(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <div className="w-full flex-1 min-h-screen flex flex-col items-center justify-center bg-[#080B11] text-neutral-200 relative overflow-hidden p-6 select-none">
      {/* Subtle Ambient Glow Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />

      {/* Central Glassmorphic Card */}
      <div className="relative z-10 max-w-xl w-full bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 rounded-3xl p-8 sm:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.6)] flex flex-col items-center text-center">
        {/* Animated Hero Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600/20 via-indigo-600/20 to-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-purple-600 border-2 border-neutral-950 flex items-center justify-center shadow-md">
            <ImagePlus className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-purple-300 bg-clip-text text-transparent mb-3 font-sans">
          No Images in Editor
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed font-sans mb-8">
          Import your Webtoon panels, upload image files from your computer, or load a sample panel to test the editor tools right away.
        </p>

        {/* Action Buttons Grid */}
        <div className="w-full space-y-3">
          {/* Upload Button */}
          <label className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all cursor-pointer active:scale-[0.98] border border-purple-400/30">
            <UploadCloud className="w-5 h-5 shrink-0" />
            <span>Upload Images from PC</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Grid of Secondary Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Load Sample Button */}
            <button
              onClick={handleLoadSamplePanel}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 text-xs font-bold transition-all hover:border-purple-500/40 active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Load Sample Panel</span>
            </button>

            {/* Webtoon Scraper Button */}
            <button
              onClick={() => handleNavigate("/episode-scraper")}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 text-xs font-bold transition-all hover:border-indigo-500/40 active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Open Scraper</span>
            </button>
          </div>

          {/* Return to Workspace Button */}
          <button
            onClick={() => handleNavigate("/workspace")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 pt-6 border-t border-neutral-800/60 w-full flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-neutral-500">
          <span className="px-2.5 py-1 rounded-full bg-neutral-800/40 border border-neutral-800 text-neutral-400">
            ⚡ Auto-Crop
          </span>
          <span className="px-2.5 py-1 rounded-full bg-neutral-800/40 border border-neutral-800 text-neutral-400">
            🎨 AI Bubble Eraser
          </span>
          <span className="px-2.5 py-1 rounded-full bg-neutral-800/40 border border-neutral-800 text-neutral-400">
            ✂️ Panel Slicer
          </span>
        </div>
      </div>
    </div>
  );
};
