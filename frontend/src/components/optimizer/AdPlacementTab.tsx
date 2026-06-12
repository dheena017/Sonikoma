import React, { useState } from "react";
import { Sparkles, Copy, Check } from "lucide-react";

interface AdPlacementTabProps {
  compiledScript: string;
}

interface AdPlacement {
  timestamp: string;
  tension_reason: string;
}

interface MidrollData {
  placements: AdPlacement[];
}

export default function AdPlacementTab({ compiledScript }: AdPlacementTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MidrollData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [maxAds, setMaxAds] = useState(3);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/midrolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiled_script: compiledScript || "Script content representing timeline narration.",
          max_ads: maxAds,
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setData(json.result);
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
      <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex justify-between items-center flex-wrap gap-3">
        <div className="space-y-1">
          <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">Midroll Ad Placement Optimizer</h4>
          <p className="text-[10px] text-neutral-500 font-mono">Recommend timestamps for ad injection based on pacing tension</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono">
            <span className="text-[10px] text-neutral-500 uppercase">Max Ads</span>
            <input
              type="number"
              min={1}
              max={10}
              value={maxAds}
              onChange={(e) => setMaxAds(Math.max(1, parseInt(e.target.value) || 3))}
              className="w-10 bg-transparent text-purple-400 font-bold outline-none text-center"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? "Analyzing..." : "✦ Suggest Ad Breaks"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center animate-pulse">
          <Sparkles className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
          <p className="text-[11px] font-mono text-purple-300 mt-2">Running Pacing Tension & Midroll Analyzer...</p>
        </div>
      )}

      {data && !loading && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
            <span className="text-[10px] font-mono font-bold text-purple-400">Suspense-Driven Ad Insertions</span>
            <button
              onClick={() => copyToClipboard(data.placements.map(p => `${p.timestamp} - ${p.tension_reason}`).join("\n"), "placements")}
              className="text-neutral-500 hover:text-white p-1 rounded"
            >
              {copiedField === "placements" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <div className="space-y-3">
            {data.placements.map((placement, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-mono font-bold text-white bg-purple-950 border border-purple-800 px-2 py-0.5 rounded">
                    {placement.timestamp}
                  </span>
                </div>
                <div className="text-[11px] font-sans text-neutral-350 leading-relaxed">
                  <span className="text-neutral-500 font-mono text-[9px] uppercase tracking-wider block">Tension Reason:</span>
                  {placement.tension_reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
