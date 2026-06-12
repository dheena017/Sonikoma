import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface SoundOutroTabProps {
  title: string;
  storyboardSummary: string;
}

interface CliffhangerData {
  ending_narration: string;
  suspense_question: string;
}

interface OutroData {
  outro_script: string;
  cta_focus: string;
}

interface BGMData {
  music_vibe_tags: string[];
  target_bpm: number;
}

export default function SoundOutroTab({ title, storyboardSummary }: SoundOutroTabProps) {
  const [loading, setLoading] = useState(false);
  const [cliffhanger, setCliffhanger] = useState<CliffhangerData | null>(null);
  const [outro, setOutro] = useState<OutroData | null>(null);
  const [bgm, setBgm] = useState<BGMData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. Cliffhanger generator
      const cliffRes = await fetch("/api/skills/cliffhanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_outline: storyboardSummary || "The recap story outline details.",
          model: "gemini-2.5-flash"
        })
      });
      const cliffJson = await cliffRes.json();
      let cliffText = "";
      if (cliffJson.success && cliffJson.result) {
        setCliffhanger(cliffJson.result);
        cliffText = cliffJson.result.ending_narration;
      }

      // 2. Outro CTA
      const outroRes = await fetch("/api/skills/outro-cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "This Webtoon",
          ending_cliffhanger: cliffText || "epic resolution reveal",
          model: "gemini-2.5-flash"
        })
      });
      const outroJson = await outroRes.json();
      if (outroJson.success && outroJson.result) {
        setOutro(outroJson.result);
      }

      // 3. BGM vibe selector
      const bgmRes = await fetch("/api/skills/bgm-vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative_mood: "tense antihero action",
          action_scale: "high",
          model: "gemini-2.5-flash"
        })
      });
      const bgmJson = await bgmRes.json();
      if (bgmJson.success && bgmJson.result) {
        setBgm(bgmJson.result);
      }
    } catch (e) {
      console.error(e);
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
    <div className="space-y-4">
      <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">Soundtrack Vibe & Dynamic Outro Optimizer</h4>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Select musical moods, outro CTA speech, and ending hooks</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Optimizing..." : "✦ Generate Vibes"}
        </button>
      </div>

      {loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
          <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
          <p className="text-[11px] font-mono text-purple-300 mt-2">Selecting Soundtrack Tags & End CTAs...</p>
        </div>
      )}

      {!loading && (cliffhanger || outro || bgm) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cliffhanger && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3 md:col-span-2">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">Suspense Cliffhanger Narration</span>
                <button
                  onClick={() => copyToClipboard(cliffhanger.ending_narration, "ending_narration")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "ending_narration" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-200 font-semibold italic">"{cliffhanger.ending_narration}"</p>
              <div className="bg-neutral-950 p-2 rounded text-[10px] font-mono text-purple-300 mt-1">
                <span className="text-neutral-500">Suggested Question:</span> {cliffhanger.suspense_question}
              </div>
            </div>
          )}

          {outro && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">Subscription Outro CTA (Max 15 words)</span>
                <button
                  onClick={() => copyToClipboard(outro.outro_script, "outro")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "outro" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-350 leading-relaxed bg-neutral-950 p-3 rounded-lg font-semibold">
                "{outro.outro_script}"
              </p>
              <p className="text-[9px] font-mono text-neutral-500 mt-1">
                CTA focus target: <span className="text-purple-300 font-semibold">{outro.cta_focus}</span>
              </p>
            </div>
          )}

          {bgm && (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-purple-400">Soundtrack Vibe Recommendation</span>
                <button
                  onClick={() => copyToClipboard(bgm.music_vibe_tags.join(", "), "bgm")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "bgm" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bgm.music_vibe_tags.map((tag, idx) => (
                  <span key={idx} className="text-[9px] font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850 text-neutral-300">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-mono text-neutral-500 mt-2">
                Suggested tempo BPM: <span className="text-purple-300 font-semibold">{bgm.target_bpm} BPM</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
