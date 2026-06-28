import React from "react";
import { BookOpen, User, Palette, Globe } from "lucide-react";

interface WebtoonMetadataProps {
  authorName: string;
  setAuthorName: (val: string) => void;
  artistName: string;
  setArtistName: (val: string) => void;
  webtoonPlatform: string;
  setWebtoonPlatform: (val: string) => void;
  customPlatform: string;
  setCustomPlatform: (val: string) => void;
  chapterStart: string;
  setChapterStart: (val: string) => void;
  chapterEnd: string;
  setChapterEnd: (val: string) => void;
  chapterValidationError: string | null;
}

const PLATFORMS = ["Naver", "Kakao", "Tapas", "Webtoon", "Tappytoon", "Other"];

export default function WebtoonMetadata({
  authorName,
  setAuthorName,
  artistName,
  setArtistName,
  webtoonPlatform,
  setWebtoonPlatform,
  customPlatform,
  setCustomPlatform,
  chapterStart,
  setChapterStart,
  chapterEnd,
  setChapterEnd,
  chapterValidationError,
}: WebtoonMetadataProps) {
  const handleNumericChange =
    (setter: (val: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "" || /^\d+$/.test(val)) {
        setter(val);
      }
    };

  return (
    <div className="bg-neutral-950/40 border border-neutral-850/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-850/40 pb-2.5">
        <BookOpen className="h-4 w-4 text-purple-400" />
        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          Webtoon Source Metadata
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-500 font-bold flex items-center gap-1.5 uppercase">
            <User className="h-3 w-3" />
            Series Author
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. SIU, Carnby Kim"
            className="w-full bg-black/40 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-500 font-bold flex items-center gap-1.5 uppercase">
            <Palette className="h-3 w-3" />
            Series Artist
          </label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="e.g. Redice Studio"
            className="w-full bg-black/40 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-500 font-bold flex items-center gap-1.5 uppercase">
            <Globe className="h-3 w-3" />
            Platform
          </label>
          <div className="flex gap-2">
            <select
              value={webtoonPlatform}
              onChange={(e) => setWebtoonPlatform(e.target.value)}
              className={`bg-black/40 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-neutral-305 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer ${
                webtoonPlatform === "Other" ? "w-1/3" : "w-full"
              }`}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {webtoonPlatform === "Other" && (
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Enter custom platform..."
                className="flex-1 bg-black/40 border border-neutral-855 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50 transition-all animate-in fade-in slide-in-from-left-2"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 font-bold block uppercase">
              Chapter Start
            </label>
            <input
              type="text"
              value={chapterStart}
              onChange={handleNumericChange(setChapterStart)}
              placeholder="e.g. 1"
              className={`w-full bg-black/40 border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all ${
                chapterValidationError
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-neutral-855 focus:border-purple-500/50"
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-500 font-bold block uppercase">
              Chapter End
            </label>
            <input
              type="text"
              value={chapterEnd}
              onChange={handleNumericChange(setChapterEnd)}
              placeholder="e.g. 10"
              className={`w-full bg-black/40 border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all ${
                chapterValidationError
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-neutral-855 focus:border-purple-500/50"
              }`}
            />
          </div>
        </div>
      </div>
      {chapterValidationError && (
        <p className="text-[10px] text-red-400 font-mono animate-pulse">
          ⚠️ {chapterValidationError}
        </p>
      )}
      <p className="text-[9px] text-neutral-500 font-mono italic">
        Format: Seconds (e.g., 60 for 1 minute) or Chapter Numbers as per use
        case.
      </p>
    </div>
  );
}
