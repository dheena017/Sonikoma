import * as api from "@/api";
import React, { useState } from "react";
import { Sparkles, Megaphone, RefreshCw, Clock } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface AdPlacementTabProps {
  compiledScript: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface AdPlacement {
  timestamp: string;
  tension_reason: string;
}

export default function AdPlacementTab({
  compiledScript,
  videoUrl,
  panels = [],
  addNotification,
}: AdPlacementTabProps) {
  const [loading, setLoading] = useState(false);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const json = await api.runMidrollsSkill(fetchWithAuth, {
        compiled_script: compiledScript || "00:00 - Story Intro",
        max_ads: 3,
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (json.success && json.result && json.result.placements) {
        setPlacements(json.result.placements);
        addNotification?.(
          "Calculated optimal midroll ad break timestamps!",
          "success"
        );
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to calculate ad placements.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* COMPILER ACTION BANNER */}
      <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-2xl border border-neutral-850 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Megaphone className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Sponsor Slot & Midroll Placement Engine
            </h4>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono pl-8">
            Identify cliffhangers and natural narrative pause points for
            non-intrusive sponsor breaks.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? "Calculating..." : "✦ Calculate Ad Slots"}</span>
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-10 text-center animate-pulse space-y-3 shadow-xl">
          <Megaphone className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-purple-300">
            Computing high-retention midroll cliffhangers...
          </p>
        </div>
      )}

      {placements.length > 0 && !loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg animate-fade-in">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block border-b border-neutral-850 pb-2.5">
            Recommended Midroll Timestamps & Rationale
          </span>
          <div className="space-y-2.5">
            {placements.map((p, idx) => (
              <div
                key={idx}
                className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-neutral-900 text-purple-300 font-mono text-xs px-3 py-1 rounded-lg border border-neutral-800 font-bold flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />{" "}
                    {p.timestamp}
                  </span>
                  <span className="text-xs font-sans text-neutral-200 leading-relaxed">
                    {p.tension_reason}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
