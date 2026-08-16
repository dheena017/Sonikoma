import * as api from "@/api";
import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Scissors,
  RefreshCw,
  Zap,
  Flame,
  Clock,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface ShortsScriptTabProps {
  title: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface ShortsData {
  voiceover_script: string;
  visual_milestones: string[];
}

interface HookData {
  hook_sentence: string;
  psychological_trigger: string;
}

export default function ShortsScriptTab({
  title,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: ShortsScriptTabProps) {
  const [loading, setLoading] = useState(false);
  const [shortsData, setShortsData] = useState<ShortsData | null>(null);
  const [hookData, setHookData] = useState<HookData | null>(null);
  const [targetDuration, setTargetDuration] = useState<"30s" | "60s" | "90s">(
    "60s"
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const scriptJson = await api.runShortsScriptSkill(fetchWithAuth, {
        storyboard_summary: `${storyboardSummary}\nTarget Duration: ${targetDuration}`,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (scriptJson.success && scriptJson.result) {
        setShortsData(scriptJson.result);
      }

      const hookJson = await api.runShortsHookSkill(fetchWithAuth, {
        title: title || "Solo Leveling Recap",
        key_event: "Hero unlocks shadow extraction system",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (hookJson.success && hookJson.result) {
        setHookData(hookJson.result);
      }

      addNotification?.(
        `Generated viral Shorts script for ${targetDuration}!`,
        "success"
      );
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to generate Reels & Shorts content.", "error");
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
      <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-850 hover:border-purple-500/40 transition-all space-y-2 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 shrink-0">
              <Scissors className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase">
              Shorts & TikTok Retention Specialist
            </h4>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Target Duration Selector */}
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-850 p-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-purple-400 ml-1" />
              {(["30s", "60s", "90s"] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setTargetDuration(dur)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    targetDuration === dur
                      ? "bg-purple-600 text-white font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {loading ? "Adapting..." : "✦ Generate Shorts Script"}
              </span>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-neutral-400 font-mono">
          Adapt full storyboard for 9:16 short-form video, fast pacing, and
          viral opening retention hooks.
        </p>
      </div>

      {loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-8 text-center animate-pulse space-y-2 shadow-xl">
          <Sparkles className="h-7 w-7 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-purple-300">
            Adapting storyboard into viral {targetDuration} short-form script...
          </p>
        </div>
      )}

      {(shortsData || hookData) && !loading && (
        <div className="space-y-4 animate-fade-in">
          {hookData && (
            <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-mono font-bold text-pink-300 uppercase tracking-widest">
                    Viral 3-Second Opening Hook
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(hookData.hook_sentence, "hook")
                  }
                  className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                >
                  {copiedField === "hook" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2">
                <input
                  type="text"
                  value={hookData.hook_sentence}
                  onChange={(e) =>
                    setHookData({ ...hookData, hook_sentence: e.target.value })
                  }
                  className="w-full bg-transparent text-xs font-sans text-white font-bold outline-none leading-relaxed"
                />
                <div className="text-[9px] font-mono text-purple-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 inline-block">
                  Trigger: {hookData.psychological_trigger}
                </div>
              </div>
            </div>
          )}

          {shortsData && (
            <>
              <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                      Adapted Short Voiceover Script ({targetDuration})
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(shortsData.voiceover_script, "voiceover")
                    }
                    className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                  >
                    {copiedField === "voiceover" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <textarea
                  value={shortsData.voiceover_script}
                  onChange={(e) =>
                    setShortsData({
                      ...shortsData,
                      voiceover_script: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full text-[11px] font-sans text-neutral-200 bg-neutral-950 p-3 rounded-xl leading-relaxed border border-neutral-800 shadow-inner outline-none focus:border-purple-500/50 resize-y"
                />
              </div>

              {shortsData.visual_milestones && (
                <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4 space-y-3 shadow-lg">
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block border-b border-neutral-850 pb-2">
                    Visual Milestones & Frame Pacing
                  </span>
                  <ul className="space-y-2 text-xs text-neutral-300 font-sans pt-1">
                    {shortsData.visual_milestones.map((m, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2.5 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800"
                      >
                        <span className="text-purple-400 font-mono font-bold text-xs bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={m}
                          onChange={(e) => {
                            const newMiles = [...shortsData.visual_milestones];
                            newMiles[idx] = e.target.value;
                            setShortsData({
                              ...shortsData,
                              visual_milestones: newMiles,
                            });
                          }}
                          className="w-full bg-transparent text-xs text-neutral-200 font-medium outline-none"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
