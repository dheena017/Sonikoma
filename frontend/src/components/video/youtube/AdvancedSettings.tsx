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
    <div className="border border-neutral-850 rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full bg-neutral-955/30 px-4 py-3 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center justify-between cursor-pointer select-none transition-colors border-b border-neutral-900/40"
      >
        <span className="flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5 text-purple-455" />
          Advanced Publishing Settings
        </span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {showAdvanced && (
        <div className="p-4 bg-neutral-950/60 space-y-5 text-xs font-sans text-neutral-450 animate-slide-down">
          
          {/* Made For Kids */}
          <div className="space-y-1.5">
            <label className="font-mono text-neutral-250 font-bold block">
              Audience (Made for Kids)
            </label>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Regardless of your location, you're legally required to comply
              with the Children's Online Privacy Protection Act (COPPA).
            </p>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-mono text-neutral-350">
                <input
                  type="radio"
                  name="madeForKids"
                  value="yes"
                  checked={madeForKids === "yes"}
                  onChange={(e) => setMadeForKids(e.target.value)}
                  className="accent-purple-500 cursor-pointer"
                />
                Yes, it's made for kids
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-mono text-neutral-350">
                <input
                  type="radio"
                  name="madeForKids"
                  value="no"
                  checked={madeForKids === "no"}
                  onChange={(e) => setMadeForKids(e.target.value)}
                  className="accent-purple-500 cursor-pointer"
                />
                No, it's not made for kids
              </label>
            </div>
          </div>

          {/* Age Restriction */}
          <div className="space-y-1.5 pt-3 border-t border-neutral-900/60">
            <label className="font-mono text-neutral-250 font-bold block">
              Age Restriction (Advanced)
            </label>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Do you want to restrict your video to an adult audience?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-mono text-neutral-355">
                <input
                  type="radio"
                  name="ageRestriction"
                  checked={ageRestriction === true}
                  onChange={() => setAgeRestriction(true)}
                  className="accent-purple-500 cursor-pointer"
                />
                Yes, restrict to viewers over 18
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-mono text-neutral-355">
                <input
                  type="radio"
                  name="ageRestriction"
                  checked={ageRestriction === false}
                  onChange={() => setAgeRestriction(false)}
                  className="accent-purple-500 cursor-pointer"
                />
                No, don't restrict to viewers over 18 only
              </label>
            </div>
          </div>

          {/* Paid Promotion */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-900/60">
            <div className="space-y-0.5">
              <span className="font-mono text-neutral-250 font-bold block">
                Paid Promotion Declaration
              </span>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                Declare if your video contains paid product placements, sponsorships, or endorsements.
              </p>
            </div>
            <button
              onClick={() => setPaidPromotion(!paidPromotion)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
                paidPromotion ? "bg-purple-600" : "bg-neutral-800"
              }`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                  paidPromotion ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* License, Language & Remixing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                License
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="youtube">Standard License</option>
                <option value="creativecommons">Creative Commons</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                Language
              </label>
              <select
                value={videoLanguage}
                onChange={(e) => setVideoLanguage(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ko">Korean (한국어)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                Shorts Remixing
              </label>
              <select
                value={shortsRemixing}
                onChange={(e) => setShortsRemixing(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="allow_all">Allow Remixing</option>
                <option value="allow_audio">Audio Only</option>
                <option value="disallow">Don't Allow</option>
              </select>
            </div>
          </div>

          {/* Comments & Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                Comments Visibility
              </label>
              <select
                value={commentsMode}
                onChange={(e) => setCommentsMode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="allow_all">Allow all comments</option>
                <option value="hold_inappropriate">Hold inappropriate for review</option>
                <option value="hold_all">Hold all comments for review</option>
                <option value="disable">Disable comments</option>
              </select>
            </div>

            <div className="flex items-center justify-between self-end pb-1 h-9">
              <span className="font-mono text-[11px] text-neutral-300">
                Show likes count to viewers
              </span>
              <button
                onClick={() => setShowLikes(!showLikes)}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-900/60">
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 pr-2">
                <span className="font-mono text-[11px] text-neutral-250 block">
                  Allow Embedding
                </span>
                <p className="text-[9.5px] text-neutral-500">
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
                <span className="font-mono text-[11px] text-neutral-250 block">
                  Notify Subscribers
                </span>
                <p className="text-[9.5px] text-neutral-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-900/60">
            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                Recording Date
              </label>
              <input
                type="date"
                value={recordingDate}
                onChange={(e) => setRecordingDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none focus:border-purple-500/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-neutral-250 font-bold block">
                Video Location
              </label>
              <input
                type="text"
                value={videoLocation}
                onChange={(e) => setVideoLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-[11px] text-neutral-300 focus:outline-none focus:border-purple-500/30 transition-colors placeholder:text-neutral-600"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
