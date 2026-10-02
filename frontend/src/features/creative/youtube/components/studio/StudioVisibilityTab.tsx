import React from "react";
import {
  Globe,
  Link as LinkIcon,
  Lock,
  Flame,
  Zap,
  ChevronLeft,
} from "lucide-react";

export interface StudioVisibilityTabProps {
  privacy: string;
  setPrivacy: (val: string) => void;
  isScheduled: boolean;
  setIsScheduled: (val: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
  isShort: boolean;
  setIsShort: (val: boolean) => void;
  isPublishing: boolean;
  activeVideoUrl: string | null;
  title: string;
  onPublish: () => void;
  onBack: () => void;
}

export default function StudioVisibilityTab({
  privacy,
  setPrivacy,
  isScheduled,
  setIsScheduled,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  isShort,
  setIsShort,
  isPublishing,
  activeVideoUrl,
  title,
  onPublish,
  onBack,
}: StudioVisibilityTabProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="border-b border-neutral-800 pb-4">
        <h3 className="text-base font-black text-white font-sans tracking-tight">
          Visibility
        </h3>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          Choose when to publish and who can see your video
        </p>
      </div>

      {/* Save or publish — radio rows */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider block">
          Save or publish
        </span>
        <p className="text-[10.5px] text-neutral-500 font-mono">
          Make your video public, unlisted, or private
        </p>

        <div className="space-y-2 mt-3">
          {[
            {
              id: "public",
              label: "Public",
              desc: "Everyone can watch your video",
              icon: Globe,
            },
            {
              id: "unlisted",
              label: "Unlisted",
              desc: "Anyone with the video link can watch",
              icon: LinkIcon,
            },
            {
              id: "private",
              label: "Private",
              desc: "Only you can watch",
              icon: Lock,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isSel = privacy === item.id;
            return (
              <label
                key={item.id}
                onClick={() => setPrivacy(item.id)}
                className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSel
                    ? "border-red-500/50 bg-red-950/20"
                    : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSel ? "border-red-500" : "border-neutral-600"
                  }`}
                >
                  {isSel && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Icon
                    className={`w-4 h-4 ${
                      isSel ? "text-red-400" : "text-neutral-500"
                    }`}
                  />
                  <div>
                    <span
                      className={`text-xs font-bold font-sans ${
                        isSel ? "text-white" : "text-neutral-300"
                      }`}
                    >
                      {item.label}
                    </span>
                    <p className="text-[10.5px] text-neutral-500 font-mono">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3 p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white font-sans">
              Schedule
            </span>
            <p className="text-[10.5px] text-neutral-500 font-mono mt-0.5">
              Select a date to make your video public
            </p>
          </div>
          <button
            onClick={() => setIsScheduled(!isScheduled)}
            className={`w-10 h-5.5 flex items-center rounded-full px-0.5 cursor-pointer transition-all duration-300 shrink-0 ${
              isScheduled
                ? "bg-red-600 justify-end"
                : "bg-neutral-700 justify-start"
            }`}
            style={{ height: "22px", width: "40px" }}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
        {isScheduled && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all font-mono cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Time
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-neutral-950/60 border border-neutral-700 focus:border-red-500/60 rounded-xl px-3 py-2.5 text-xs text-neutral-300 focus:outline-none transition-all font-mono cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Shorts toggle */}
      <div className="flex items-center justify-between p-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/80">
        <div className="space-y-0.5 pr-4">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
            <Flame className="w-4 h-4 text-red-400" />
            <span>YouTube Shorts</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-950/50 text-red-400 rounded border border-red-900/40 uppercase font-mono">
              Vertical
            </span>
          </div>
          <p className="text-[10.5px] text-neutral-400 font-mono">
            Append #Shorts and optimize for mobile feeds
          </p>
        </div>
        <button
          onClick={() => setIsShort(!isShort)}
          className={`flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
            isShort ? "bg-red-600" : "bg-neutral-700"
          }`}
          style={{ width: "44px", height: "24px" }}
        >
          <div
            className={`bg-white rounded-full shadow-sm transition-transform duration-300 ${
              isShort ? "translate-x-5" : "translate-x-0"
            }`}
            style={{ width: "16px", height: "16px" }}
          />
        </button>
      </div>

      {/* Final publish CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={onPublish}
          disabled={isPublishing || !activeVideoUrl || !title.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-red-600/40 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isPublishing ? "Publishing..." : "Publish"}</span>
        </button>
      </div>
    </div>
  );
}
