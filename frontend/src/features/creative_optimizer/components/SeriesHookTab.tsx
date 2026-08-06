import * as api from "@/api";
import React, { useState } from "react";
import { Sparkles, Copy, Check, Flame, RefreshCw, Radio, ThumbsUp } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface SeriesHookTabProps {
  title: string;
  genre: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface HookResult {
  intro_teaser: string;
  cliffhanger_outro: string;
  cta_trigger: string;
}

export default function SeriesHookTab({
  title,
  genre,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: SeriesHookTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HookResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const hookJson = await api.runShortsHookSkill(fetchWithAuth, {
        title: title || "Solo Leveling Recap",
        key_event: "Hero unlocks S-Rank hidden power and stands alone against the boss",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (hookJson.success && hookJson.result) {
        setData({
          intro_teaser: hookJson.result.hook_sentence || `In this episode of ${title}, the protagonist faces absolute ruin!`,
          cliffhanger_outro: "Will the sovereign survive the abyssal realm? Find out in the next episode!",
          cta_trigger: "Subscribe & turn on notifications for the next S-Rank chapter recap!",
        });
        addNotification?.("Generated series intro & cliffhanger hooks!", "success");
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to generate series hooks.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* COMPILER ACTION BANNER */}
      <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-2xl border border-neutral-850 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Radio className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Series Intro & Cliffhanger Hook Specialist
            </h4>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono pl-8">
            Generate dramatic episode opening teasers, end-screen cliffhangers, and subscriber call-to-actions.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? "Generating..." : "✦ Generate Intro Hooks"}</span>
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-10 text-center animate-pulse space-y-3 shadow-xl">
          <Radio className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-purple-300">
            Crafting dramatic episode intro teasers & cliffhanger hooks...
          </p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* INTRO TEASER */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-400" />
                <span className="text-[10px] font-mono font-bold text-pink-300 uppercase tracking-widest">
                  15-Second Episode Opening Teaser
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(data.intro_teaser, "intro")}
                className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
              >
                {copiedField === "intro" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-xs font-sans text-white font-bold leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              "{data.intro_teaser}"
            </p>
          </div>

          {/* CLIFFHANGER OUTRO */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                  Episode End Cliffhanger
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(data.cliffhanger_outro, "outro")}
                className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
              >
                {copiedField === "outro" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-xs font-sans text-neutral-200 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              {data.cliffhanger_outro}
            </p>
          </div>

          {/* CTA TRIGGER */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-widest">
                  Subscriber & Engagement CTA Trigger
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(data.cta_trigger, "cta")}
                className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
              >
                {copiedField === "cta" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-xs font-sans text-emerald-200 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
              {data.cta_trigger}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
