import React from "react";
import { Captions, Languages } from "lucide-react";

interface SubtitleConfigProps {
  subtitlesType: string;
  setSubtitlesType: (val: string) => void;
  subtitlesLanguage: string;
  setSubtitlesLanguage: (val: string) => void;
}

const SUBTITLE_TYPES = ["None", "Hardcoded", "Softcoded (SRT/VTT)", "CC"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
];

export default function SubtitleConfig({
  subtitlesType,
  setSubtitlesType,
  subtitlesLanguage,
  setSubtitlesLanguage,
}: SubtitleConfigProps) {
  return (
    <div className="bg-neutral-950/40 backdrop-blur-sm border border-neutral-900 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-2.5">
        <Captions className="h-4 w-4 text-purple-400" />
        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
          Subtitle / Caption Tracks
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-400 font-bold flex items-center gap-1.5 uppercase">
            Generation Mode
          </label>
          <select
            value={subtitlesType}
            onChange={(e) => setSubtitlesType(e.target.value)}
            className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all duration-200 cursor-pointer shadow-inner"
          >
            {SUBTITLE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-neutral-950">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-neutral-400 font-bold flex items-center gap-1.5 uppercase">
            <Languages className="h-3.5 w-3.5 text-neutral-500" />
            Language
          </label>
          <select
            value={subtitlesLanguage}
            onChange={(e) => setSubtitlesLanguage(e.target.value)}
            className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all duration-200 cursor-pointer shadow-inner"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-neutral-950">
                {l.label} ({l.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
