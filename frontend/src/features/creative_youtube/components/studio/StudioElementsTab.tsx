import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CyberSelect from "@/shared/ui/common/CyberSelect";

export interface StudioElementsTabProps {
  description: string;
  handleCompileChapters: () => void;
  authorName: string;
  setAuthorName: (val: string) => void;
  artistName: string;
  setArtistName: (val: string) => void;
  webtoonPlatform: string;
  setWebtoonPlatform: (val: string) => void;
  chapterStart: string;
  setChapterStart: (val: string) => void;
  chapterEnd: string;
  setChapterEnd: (val: string) => void;
  chapterValidationError: string | null;
  subtitlesType: string;
  setSubtitlesType: (val: string) => void;
  subtitlesLanguage: string;
  setSubtitlesLanguage: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StudioElementsTab({
  description,
  handleCompileChapters,
  authorName,
  setAuthorName,
  artistName,
  setArtistName,
  webtoonPlatform,
  setWebtoonPlatform,
  chapterStart,
  setChapterStart,
  chapterEnd,
  setChapterEnd,
  chapterValidationError,
  subtitlesType,
  setSubtitlesType,
  subtitlesLanguage,
  setSubtitlesLanguage,
  onBack,
  onNext,
}: StudioElementsTabProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="border-b border-neutral-800 pb-4">
        <h3 className="text-base font-black text-white font-sans tracking-tight">
          Video elements
        </h3>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Add cards and end screen to promote related content
        </p>
      </div>

      {/* Chapter Timestamps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">
            Chapter timestamps
          </label>
          <button
            onClick={handleCompileChapters}
            className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            + Auto-compile from panels
          </button>
        </div>
        <textarea
          value={description.match(/^(0:00.+(\n\d+:\d+.+)*)/m)?.[0] ?? ""}
          readOnly
          rows={4}
          placeholder={
            "0:00 Intro\n1:30 Chapter 1 - Title\n5:00 Chapter 2 - Title\n\nClick 'Auto-compile' to generate from story panels"
          }
          className="w-full bg-neutral-950/60 border border-neutral-700 rounded-xl px-4 py-3 text-xs text-neutral-400 placeholder-neutral-600 font-mono resize-none focus:outline-none"
        />
        <p className="text-[10px] text-neutral-500 font-mono">
          Chapters auto-insert into your description. First timestamp must start
          at 0:00.
        </p>
      </div>

      {/* Comic / Webtoon Attribution */}
      <div className="space-y-3 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
          <span className="text-xs font-bold text-white font-sans">
            Comic attribution
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            Optional
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Author
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author name"
              className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Artist
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Artist name"
              className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Platform
            </label>
            <CyberSelect
              value={webtoonPlatform}
              onChange={setWebtoonPlatform}
              placeholder="Select platform..."
              options={[
                { value: "", label: "Select platform" },
                { value: "Webtoon", label: "Webtoon" },
                { value: "Tapas", label: "Tapas" },
                { value: "Manga Plus", label: "Manga Plus" },
                { value: "Crunchyroll", label: "Crunchyroll" },
                { value: "Other", label: "Other" },
              ]}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Chapters
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chapterStart}
                onChange={(e) => setChapterStart(e.target.value)}
                placeholder="Start"
                className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
              />
              <span className="text-neutral-600 text-xs font-mono shrink-0">
                →
              </span>
              <input
                type="text"
                value={chapterEnd}
                onChange={(e) => setChapterEnd(e.target.value)}
                placeholder="End"
                className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
              />
            </div>
            {chapterValidationError && (
              <p className="text-[10px] text-red-400 font-mono">
                {chapterValidationError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subtitles */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
          Subtitles / CC
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CyberSelect
            value={subtitlesType}
            onChange={setSubtitlesType}
            options={[
              { value: "none", label: "No subtitles" },
              { value: "auto", label: "Auto-generated (YouTube ASR)" },
              { value: "manual", label: "Upload SRT / VTT file" },
            ]}
          />
          <CyberSelect
            value={subtitlesLanguage}
            onChange={setSubtitlesLanguage}
            placeholder="Select language..."
            searchable
            options={[
              { value: "", label: "Select language" },
              { value: "en", label: "English" },
              { value: "ja", label: "Japanese" },
              { value: "ko", label: "Korean" },
              { value: "zh-Hans", label: "Chinese (Simplified)" },
              { value: "zh-Hant", label: "Chinese (Traditional)" },
              { value: "es", label: "Spanish" },
              { value: "fr", label: "French" },
              { value: "de", label: "German" },
              { value: "id", label: "Indonesian" },
              { value: "vi", label: "Vietnamese" },
              { value: "th", label: "Thai" },
              { value: "ar", label: "Arabic" },
              { value: "pt", label: "Portuguese" },
              { value: "ru", label: "Russian" },
            ]}
          />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
        >
          <span>Next: Checks</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
