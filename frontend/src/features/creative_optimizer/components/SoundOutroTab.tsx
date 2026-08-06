import * as api from "@/api";
import React, { useState } from "react";
import { Sparkles, Music2, RefreshCw, Volume2 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface SoundOutroTabProps {
  title: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface BgmResult {
  music_genre: string;
  bpm: number;
  mood_keywords: string[];
  suggested_tracks: string[];
}

export default function SoundOutroTab({
  title,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: SoundOutroTabProps) {
  const [loading, setLoading] = useState(false);
  const [bgm, setBgm] = useState<BgmResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const bgmJson = await api.runBgmVibeSkill(fetchWithAuth, {
        narrative_mood: "tense action battle climax",
        action_scale: "high",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (bgmJson.success && bgmJson.result) {
        setBgm(bgmJson.result);
        addNotification?.("Re-recommended background soundtrack vibe!", "success");
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to generate sound vibe.", "error");
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
              <Music2 className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              BGM Vibe & Soundtrack Director
            </h4>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono pl-8">
            Analyze story arc tension to recommend optimal background music BPM, mood tags, and track cues.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? "Analyzing Vibe..." : "✦ Analyze BGM Vibe"}</span>
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-10 text-center animate-pulse space-y-3 shadow-xl">
          <Music2 className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-purple-300">
            Analyzing narrative tension curves for music recommendations...
          </p>
        </div>
      )}

      {bgm && !loading && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-2 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block border-b border-neutral-850 pb-2">
                Recommended Music Genre
              </span>
              <p className="text-sm font-black text-white">{bgm.music_genre}</p>
              <p className="text-xs font-mono text-purple-300">Target BPM: {bgm.bpm} BPM</p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-2 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block border-b border-neutral-850 pb-2">
                Mood Keywords
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {bgm.mood_keywords?.map((k, idx) => (
                  <span key={idx} className="text-[9px] font-mono bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-purple-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {bgm.suggested_tracks && (
            <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg">
              <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest block border-b border-neutral-850 pb-2">
                Suggested Soundtrack Cues
              </span>
              <ul className="space-y-2 text-xs text-neutral-300 font-sans pt-1">
                {bgm.suggested_tracks.map((track, idx) => (
                  <li key={idx} className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-xs text-neutral-200 font-medium">{track}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
