import React, { useState } from "react";
import {
  Globe,
  Upload,
  ArrowRight,
  FileImage,
  Sparkles,
  Link2,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

export default function DashboardQuickIngest() {
  const [url, setUrl] = useState("");

  const handleScrape = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (cleanUrl) {
      try {
        localStorage.setItem("auto_import_url", cleanUrl);
      } catch (err) {
        // ignore storage error
      }
    }
    navigateToDashboardPath("/scraper");
  };

  const handleUploadClick = () => {
    navigateToDashboardPath("/scraper");
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-4 sm:p-5 shadow-md text-left transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Headline & Supported Sources */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#141414] border border-[#2F2F2F] text-[#3B82F6]">
              <Globe className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-[#E5E5E5] font-sans tracking-tight">
              Instant Chapter Ingestion
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF]">
              Auto-Detector
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] font-sans">
            Paste any Webtoon, MangaDex or comic chapter link to auto-extract panel strips and gutters.
          </p>
        </div>

        {/* Right: Input Bar & Quick Action */}
        <form
          onSubmit={handleScrape}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl"
        >
          <div className="relative flex-1">
            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="url"
              placeholder="https://www.webtoons.com/... or chapter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#141414] border border-[#2F2F2F] hover:border-neutral-700 focus:border-[#3B82F6] rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-[#E5E5E5] font-sans outline-none placeholder:text-[#6B7280] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
          >
            <span>Scrape Strip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleUploadClick}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#252525] border border-[#2F2F2F] hover:border-neutral-700 text-[#9CA3AF] hover:text-[#E5E5E5] text-xs font-mono font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Upload Raw Comic Images or ZIP"
          >
            <Upload className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <span>Upload ZIP</span>
          </button>
        </form>
      </div>

      {/* Supported Platforms Pills */}
      <div className="mt-3 pt-3 border-t border-[#282828] flex flex-wrap items-center gap-2 text-[10px] font-mono text-[#6B7280]">
        <span className="text-[#9CA3AF] font-bold">Supported Sources:</span>
        <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#9CA3AF]">
          LINE Webtoons
        </span>
        <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#9CA3AF]">
          MangaDex
        </span>
        <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#9CA3AF]">
          Asura Scans
        </span>
        <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#9CA3AF]">
          Reaper Scans
        </span>
        <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#282828] text-[#9CA3AF]">
          Direct Images (.png, .jpg, .webp)
        </span>
      </div>
    </div>
  );
}
