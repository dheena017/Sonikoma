import React, { useState } from "react";
import { Sparkles, Sliders, Volume2 } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface SfxOverlayMixerProps {
  panels: GeneratedPanel[];
}

interface OverlayData {
  ambient_track_type: string;
  ambient_volume_ratio: number;
  sfx_delay_ms: number;
}

export default function SfxOverlayMixer({ panels }: SfxOverlayMixerProps) {
  const [loading, setLoading] = useState(false);
  const [overlayData, setOverlayData] = useState<Record<number, OverlayData>>(
    {}
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const results: Record<number, OverlayData> = {};
      // Test first 3 panels
      for (const p of panels.slice(0, 3)) {
        const res = await fetch("/api/skills/sfx-mix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visual_description: p.visual_description || "Action segment",
            speech_text: p.speech_text || "",
            sfx: p.sfx || "[Drums]",
            model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
          }),
        });
        const json = await res.json();
        if (json.success && json.result) {
          results[p.id] = json.result;
        }
      }
      setOverlayData(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            AI Sound Mixing Coordinator
          </h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || panels.length === 0}
          className="px-3.5 py-1.5 bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {loading ? "Mixing..." : "✦ Suggest sound overlay mixes"}
        </button>
      </div>

      {loading && (
        <div className="text-center py-6 animate-pulse text-[10px] font-mono text-purple-450">
          Calculating environment delay offsets & overlay coefficients...
        </div>
      )}

      {Object.keys(overlayData).length > 0 && !loading && (
        <div className="space-y-3">
          {panels.slice(0, 3).map((p) => {
            const data = overlayData[p.id];
            if (!data) return null;
            return (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-850 text-[10px] font-mono justify-between items-start sm:items-center"
              >
                <span className="text-purple-400 font-bold">Panel #{p.id}</span>
                <div className="flex flex-wrap gap-4 text-neutral-450">
                  <div>
                    <span className="text-neutral-500">Ambient Vibe:</span>{" "}
                    <span className="text-neutral-250 font-bold">
                      {data.ambient_track_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Mix ratio:</span>{" "}
                    <span className="text-purple-400 font-bold">
                      {(data.ambient_volume_ratio * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Delay:</span>{" "}
                    <span className="text-purple-400 font-bold">
                      {data.sfx_delay_ms} ms
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
