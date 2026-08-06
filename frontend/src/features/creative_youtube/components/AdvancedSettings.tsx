import React from "react";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";

interface AdvancedSettingsProps {
  madeForKids: string;
  setMadeForKids: (val: string) => void;
  paidPromotion: boolean;
  setPaidPromotion: (val: boolean) => void;
  license: string;
  setLicense: (val: string) => void;
  videoLanguage: string;
  setVideoLanguage: (val: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  ageRestriction: boolean;
  setAgeRestriction: (val: boolean) => void;
  shortsRemixing: string;
  setShortsRemixing: (val: string) => void;
  commentsMode: string;
  setCommentsMode: (val: string) => void;
  showLikes: boolean;
  setShowLikes: (val: boolean) => void;
  allowEmbedding: boolean;
  setAllowEmbedding: (val: boolean) => void;
  notifySubscribers: boolean;
  setNotifySubscribers: (val: boolean) => void;
  recordingDate: string;
  setRecordingDate: (val: string) => void;
  videoLocation: string;
  setVideoLocation: (val: string) => void;
}

export default function AdvancedSettings({
  madeForKids,
  setMadeForKids,
  paidPromotion,
  setPaidPromotion,
  license,
  setLicense,
  videoLanguage,
  setVideoLanguage,
  showAdvanced,
  setShowAdvanced,
  ageRestriction,
  setAgeRestriction,
  shortsRemixing,
  setShortsRemixing,
  commentsMode,
  setCommentsMode,
  showLikes,
  setShowLikes,
  allowEmbedding,
  setAllowEmbedding,
  notifySubscribers,
  setNotifySubscribers,
  recordingDate,
  setRecordingDate,
  videoLocation,
  setVideoLocation,
}: AdvancedSettingsProps) {
  return (
    <div className="border border-neutral-900 rounded-2xl overflow-hidden animate-fade-in transition-all duration-300 hover:border-neutral-800">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full bg-neutral-955/40 backdrop-blur-sm px-4 py-3.5 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors border-b border-neutral-900/60"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-purple-400" />
          Advanced Publishing Settings
        </span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4 text-neutral-450" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-450" />
        )}
      </button>

      {showAdvanced && (
        <div className="p-5 bg-neutral-950/20 backdrop-blur-sm space-y-6 text-xs font-sans text-neutral-400 animate-slide-down">
          {/* Made For Kids */}
          <div className="space-y-2">
            <label className="font-mono text-neutral-200 font-bold block">
              Audience (Made for Kids)
            </label>
            <p className="text-[10.5px] text-neutral-500 leading-relaxed">
              Regardless of your location, you're legally required to comply
              with the Children's Online Privacy Protection Act (COPPA).
            </p>
            <div className="flex gap-5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-mono text-neutral-350 hover:text-white group">
                <input
                  type="radio"
                  name="madeForKids"
                  value="yes"
                  checked={madeForKids === "yes"}
                  onChange={(e) => setMadeForKids(e.target.value)}
                  className="accent-purple-500 cursor-pointer h-4 w-4 transition-transform duration-200 group-hover:scale-105"
                />
                Yes, it's made for kids
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-mono text-neutral-355 hover:text-white group">
                <input
                  type="radio"
                  name="madeForKids"
                  value="no"
                  checked={madeForKids === "no"}
                  onChange={(e) => setMadeForKids(e.target.value)}
                  className="accent-purple-500 cursor-pointer h-4 w-4 transition-transform duration-200 group-hover:scale-105"
                />
                No, it's not made for kids
              </label>
            </div>
          </div>

          {/* Age Restriction */}
          <div className="space-y-2 pt-4.5 border-t border-neutral-900/60">
            <label className="font-mono text-neutral-200 font-bold block">
              Age Restriction (Advanced)
            </label>
            <p className="text-[10.5px] text-neutral-500 leading-relaxed">
              Do you want to restrict your video to an adult audience?
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-mono text-neutral-355 hover:text-white group">
                <input
                  type="radio"
                  name="ageRestriction"
                  checked={ageRestriction === true}
                  onChange={() => setAgeRestriction(true)}
                  className="accent-purple-500 cursor-pointer h-4 w-4 transition-transform duration-200 group-hover:scale-105"
                />
                Yes, restrict to viewers over 18
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-mono text-neutral-355 hover:text-white group">
                <input
                  type="radio"
                  name="ageRestriction"
                  checked={ageRestriction === false}
                  onChange={() => setAgeRestriction(false)}
                  className="accent-purple-500 cursor-pointer h-4 w-4 transition-transform duration-200 group-hover:scale-105"
                />
                No, don't restrict to viewers over 18 only
              </label>
            </div>
          </div>

          {/* Paid Promotion */}
          <div className="flex items-center justify-between pt-4.5 border-t border-neutral-900/60">
            <div className="space-y-0.5">
              <span className="font-mono text-neutral-205 font-bold block">
                Paid Promotion Declaration
              </span>
              <p className="text-[10.5px] text-neutral-500 leading-relaxed">
                Declare if your video contains paid product placements,
                sponsorships, or endorsements.
              </p>
            </div>
            <button
              onClick={() => setPaidPromotion(!paidPromotion)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
                paidPromotion ? "bg-purple-600" : "bg-neutral-800"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  paidPromotion ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* License, Language & Remixing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4.5 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                License
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="youtube" className="bg-neutral-950">Standard License</option>
                <option value="creativecommons" className="bg-neutral-950">Creative Commons</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                Language
              </label>
              <select
                value={videoLanguage}
                onChange={(e) => setVideoLanguage(e.target.value)}
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="en" className="bg-neutral-950">English</option>
                <option value="ko" className="bg-neutral-950">Korean (한국어)</option>
                <option value="ja" className="bg-neutral-950">Japanese (日本語)</option>
                <option value="es" className="bg-neutral-950">Spanish (Español)</option>
                <option value="fr" className="bg-neutral-950">French (Français)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                Shorts Remixing
              </label>
              <select
                value={shortsRemixing}
                onChange={(e) => setShortsRemixing(e.target.value)}
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="allow_all" className="bg-neutral-950">Allow Remixing</option>
                <option value="allow_audio" className="bg-neutral-950">Audio Only</option>
                <option value="disallow" className="bg-neutral-950">Don't Allow</option>
              </select>
            </div>
          </div>

          {/* Comments & Likes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4.5 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                Comments Visibility
              </label>
              <select
                value={commentsMode}
                onChange={(e) => setCommentsMode(e.target.value)}
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="allow_all" className="bg-neutral-950">Allow all comments</option>
                <option value="hold_inappropriate" className="bg-neutral-950">
                  Hold inappropriate for review
                </option>
                <option value="hold_all" className="bg-neutral-950">Hold all comments for review</option>
                <option value="disable" className="bg-neutral-950">Disable comments</option>
              </select>
            </div>

            <div className="flex items-center justify-between self-end pb-1 h-10">
              <span className="font-mono text-[11px] text-neutral-300">
                Show likes count to viewers
              </span>
              <button
                onClick={() => setShowLikes(!showLikes)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 shrink-0 ${
                  showLikes ? "bg-purple-650" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                    showLikes ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Embedding & Distribution Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4.5 border-t border-neutral-900/60">
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 pr-2">
                <span className="font-mono text-[11px] text-neutral-300 block">
                  Allow Embedding
                </span>
                <p className="text-[9.5px] text-neutral-500 leading-normal">
                  Allow other sites to embed this video.
                </p>
              </div>
              <button
                onClick={() => setAllowEmbedding(!allowEmbedding)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 shrink-0 ${
                  allowEmbedding ? "bg-purple-650" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                    allowEmbedding ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 pr-2">
                <span className="font-mono text-[11px] text-neutral-300 block">
                  Notify Subscribers
                </span>
                <p className="text-[9.5px] text-neutral-500 leading-normal">
                  Publish to feeds and notify subscribers.
                </p>
              </div>
              <button
                onClick={() => setNotifySubscribers(!notifySubscribers)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 shrink-0 ${
                  notifySubscribers ? "bg-purple-650" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-300 ${
                    notifySubscribers ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recording Date & Video Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4.5 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                Recording Date
              </label>
              <input
                type="date"
                value={recordingDate}
                onChange={(e) => setRecordingDate(e.target.value)}
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-400 font-bold block">
                Video Location
              </label>
              <input
                type="text"
                value={videoLocation}
                onChange={(e) => setVideoLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-neutral-955/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2.5 text-[11px] text-neutral-300 focus:outline-none transition-colors placeholder:text-neutral-600 shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
