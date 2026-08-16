import React from "react";
import { Sparkles, UploadCloud, ChevronRight } from "lucide-react";
import PlaylistSelector from "../PlaylistSelector";

// Full YouTube category list (official IDs)
const YOUTUBE_CATEGORIES = [
  { id: "1", label: "Film & Animation" },
  { id: "2", label: "Autos & Vehicles" },
  { id: "10", label: "Music" },
  { id: "15", label: "Pets & Animals" },
  { id: "17", label: "Sports" },
  { id: "18", label: "Short Movies" },
  { id: "19", label: "Travel & Events" },
  { id: "20", label: "Gaming" },
  { id: "21", label: "Videoblogging" },
  { id: "22", label: "People & Blogs" },
  { id: "23", label: "Comedy" },
  { id: "24", label: "Entertainment" },
  { id: "25", label: "News & Politics" },
  { id: "26", label: "Howto & Style" },
  { id: "27", label: "Education" },
  { id: "28", label: "Science & Technology" },
  { id: "29", label: "Nonprofits & Activism" },
];

// Full language list for YouTube
const YOUTUBE_LANGUAGES = [
  { code: "af", label: "Afrikaans" },
  { code: "sq", label: "Albanian" },
  { code: "ar", label: "Arabic" },
  { code: "hy", label: "Armenian" },
  { code: "az", label: "Azerbaijani" },
  { code: "eu", label: "Basque" },
  { code: "be", label: "Belarusian" },
  { code: "bn", label: "Bengali" },
  { code: "bs", label: "Bosnian" },
  { code: "bg", label: "Bulgarian" },
  { code: "ca", label: "Catalan" },
  { code: "zh-Hans", label: "Chinese (Simplified)" },
  { code: "zh-Hant", label: "Chinese (Traditional)" },
  { code: "hr", label: "Croatian" },
  { code: "cs", label: "Czech" },
  { code: "da", label: "Danish" },
  { code: "nl", label: "Dutch" },
  { code: "en", label: "English" },
  { code: "en-GB", label: "English (UK)" },
  { code: "et", label: "Estonian" },
  { code: "fil", label: "Filipino" },
  { code: "fi", label: "Finnish" },
  { code: "fr", label: "French" },
  { code: "gl", label: "Galician" },
  { code: "ka", label: "Georgian" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "gu", label: "Gujarati" },
  { code: "iw", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "hu", label: "Hungarian" },
  { code: "is", label: "Icelandic" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "kn", label: "Kannada" },
  { code: "kk", label: "Kazakh" },
  { code: "km", label: "Khmer" },
  { code: "ko", label: "Korean" },
  { code: "lo", label: "Lao" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "mk", label: "Macedonian" },
  { code: "ms", label: "Malay" },
  { code: "ml", label: "Malayalam" },
  { code: "mt", label: "Maltese" },
  { code: "mr", label: "Marathi" },
  { code: "mn", label: "Mongolian" },
  { code: "ne", label: "Nepali" },
  { code: "no", label: "Norwegian" },
  { code: "fa", label: "Persian" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "pa", label: "Punjabi" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "sr", label: "Serbian" },
  { code: "si", label: "Sinhala" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "es", label: "Spanish" },
  { code: "es-419", label: "Spanish (Latin America)" },
  { code: "sw", label: "Swahili" },
  { code: "sv", label: "Swedish" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "th", label: "Thai" },
  { code: "tr", label: "Turkish" },
  { code: "uk", label: "Ukrainian" },
  { code: "ur", label: "Urdu" },
  { code: "uz", label: "Uzbek" },
  { code: "vi", label: "Vietnamese" },
  { code: "zu", label: "Zulu" },
];

export interface StudioDetailsTabProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  playlist: string;
  setPlaylist: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  videoLanguage: string;
  setVideoLanguage: (val: string) => void;
  madeForKids: string;
  setMadeForKids: (val: string) => void;
  thumbnailPreviewUrl: string | null;
  onThumbnailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearThumbnail: () => void;
  hasCustomCredentials: boolean;
  isAiGenerating: boolean;
  isPublishing: boolean;
  handleGenerateMetadata: () => void;
  handleCompileChapters: () => void;
  handleInsertDisclaimer: () => void;
  handleInsertSocials: () => void;
  onNext: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function StudioDetailsTab({
  title,
  setTitle,
  description,
  setDescription,
  playlist,
  setPlaylist,
  category,
  setCategory,
  videoLanguage,
  setVideoLanguage,
  madeForKids,
  setMadeForKids,
  thumbnailPreviewUrl,
  onThumbnailChange,
  onClearThumbnail,
  hasCustomCredentials,
  isAiGenerating,
  isPublishing,
  handleGenerateMetadata,
  handleCompileChapters,
  handleInsertDisclaimer,
  handleInsertSocials,
  onNext,
  addNotification,
}: StudioDetailsTabProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-black text-white font-sans tracking-tight">
            Details
          </h3>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Tell viewers about your video
          </p>
        </div>
        <button
          onClick={handleGenerateMetadata}
          disabled={isAiGenerating || isPublishing}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black font-mono shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>{isAiGenerating ? "Generating..." : "Auto-fill with AI"}</span>
        </button>
      </div>

      {/* TITLE */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Add a title that describes your video (required)"
          className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all font-sans"
        />
        <div className="flex justify-end">
          <span
            className={`text-[10px] font-mono ${
              title.length > 90 ? "text-amber-400" : "text-neutral-600"
            }`}
          >
            {title.length}/100
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={7}
          maxLength={5000}
          placeholder={`Tell viewers about your video. A good description improves search ranking.\n\nInclude:\n• Chapter timestamps (0:00 Intro)\n• Links to your social pages\n• Music credits if applicable`}
          className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none transition-all font-sans resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCompileChapters}
              className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              + Insert chapters
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={handleInsertDisclaimer}
              className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              + Disclaimer
            </button>
            <span className="text-neutral-700">·</span>
            <button
              onClick={handleInsertSocials}
              className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              + Socials
            </button>
          </div>
          <span
            className={`text-[10px] font-mono ${
              description.length > 4800 ? "text-amber-400" : "text-neutral-600"
            }`}
          >
            {description.length}/5000
          </span>
        </div>
      </div>

      {/* THUMBNAIL */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
          Thumbnail
        </label>
        <p className="text-[11px] text-neutral-500 font-mono">
          Upload a picture that shows what's in your video. A good thumbnail
          stands out and draws viewers' attention.{" "}
          <span className="text-neutral-400">
            JPG, GIF, or PNG recommended · Max 2MB
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Upload button */}
          <label className="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-neutral-700 hover:border-red-500/60 rounded-xl cursor-pointer transition-all bg-neutral-950/40 group">
            <input
              type="file"
              accept="image/*"
              onChange={onThumbnailChange}
              className="hidden"
            />
            <UploadCloud className="w-6 h-6 text-neutral-500 group-hover:text-red-400 transition-colors" />
            <span className="text-xs font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">
              Upload thumbnail
            </span>
          </label>
          {/* Preview */}
          <div className="h-24 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950/40 flex items-center justify-center">
            {thumbnailPreviewUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={onClearThumbnail}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors cursor-pointer"
                >
                  ×
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-600 font-mono text-center px-2">
                Preview appears here
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PLAYLIST — live from YouTube */}
      <PlaylistSelector
        playlist={playlist}
        setPlaylist={setPlaylist}
        hasCustomCredentials={hasCustomCredentials}
        addNotification={addNotification}
      />

      {/* CATEGORY + LANGUAGE */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer font-mono"
          >
            {YOUTUBE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-neutral-950">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
            Video language
          </label>
          <select
            value={videoLanguage}
            onChange={(e) => setVideoLanguage(e.target.value)}
            className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all cursor-pointer font-mono"
          >
            <option value="" className="bg-neutral-950">
              Select language
            </option>
            {YOUTUBE_LANGUAGES.map((lang) => (
              <option
                key={lang.code}
                value={lang.code}
                className="bg-neutral-950"
              >
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AUDIENCE */}
      <div className="space-y-3 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-sans">
              Audience
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              (required)
            </span>
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
          Regardless of your location, you're legally required to comply with
          the Children's Online Privacy Protection Act (COPPA) and/or other
          laws.
        </p>
        <div className="space-y-2.5">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center justify-center mt-0.5 shrink-0">
              <input
                type="radio"
                name="audience"
                value="no"
                checked={madeForKids === "no"}
                onChange={() => setMadeForKids("no")}
                className="accent-red-600 w-3.5 h-3.5"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-sans group-hover:text-red-300 transition-colors">
                No, it's not made for kids
              </span>
              <p className="text-[10.5px] text-neutral-500 font-mono mt-0.5">
                General audience content
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center justify-center mt-0.5 shrink-0">
              <input
                type="radio"
                name="audience"
                value="yes"
                checked={madeForKids === "yes"}
                onChange={() => setMadeForKids("yes")}
                className="accent-red-600 w-3.5 h-3.5"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-white font-sans group-hover:text-red-300 transition-colors">
                Yes, it's made for kids
              </span>
              <p className="text-[10.5px] text-neutral-500 font-mono mt-0.5">
                Personalized ads and certain features will be disabled
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-end pt-4 border-t border-neutral-800">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
        >
          <span>Next: Video elements</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
