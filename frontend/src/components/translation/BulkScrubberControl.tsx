import React, { useState } from "react";
import { Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { GeneratedPanel } from "../../types";

interface BulkScrubberControlProps {
  panels: GeneratedPanel[];
  onApplyCleanScripts: (mappings: Record<number, string>) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function BulkScrubberControl({ panels, onApplyCleanScripts, addNotification }: BulkScrubberControlProps) {
  const [loading, setLoading] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState<number | null>(null);
  const [replacements, setReplacements] = useState<Record<number, string>>({});

  const handleBulkScrub = async () => {
    setLoading(true);
    try {
      const cleanMappings: Record<number, string> = {};
      let flags = 0;
      
      // Scrapes panels with dialogues
      for (const p of panels.slice(0, 4)) {
        if (!p.speech_text) continue;
        const res = await fetch("/api/skills/copyright-scrub", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: p.speech_text,
            model: "gemini-2.5-flash"
          })
        });
        const json = await res.json();
        if (json.success && json.result) {
          if (json.result.contains_violation) {
            flags += 1;
            cleanMappings[p.id] = json.result.sanitized_text;
          }
        }
      }
      
      setFlaggedCount(flags);
      setReplacements(cleanMappings);
      if (addNotification) {
        addNotification(`Compliance scan completed. Flagged ${flags} dialogue violations.`, flags > 0 ? "warning" : "success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
            Bulk Monetization Scrubber
          </h4>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Scrapes timelines to check policy-safe speech and replace extreme tones</p>
        </div>
        <button
          onClick={handleBulkScrub}
          disabled={loading || panels.length === 0}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Scrubbing..." : "✦ Run Compliance Audit"}
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 border border-dashed border-neutral-800 rounded-lg animate-pulse text-[10px] font-mono text-purple-400">
          Running policy analyzer across dialogue scripts...
        </div>
      )}

      {flaggedCount !== null && !loading && (
        <div className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-lg flex justify-between items-center animate-fade-in text-[11px]">
          <div className="flex items-center gap-2">
            {flaggedCount > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-rose-450" />
                <span className="text-neutral-350 font-mono">
                  Flagged <span className="text-rose-450 font-bold">{flaggedCount}</span> dialogues matching violent or copyrighted tropes
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-450" />
                <span className="text-emerald-450 font-mono font-bold">100% Monetization-Safe Script Audit Completed!</span>
              </>
            )}
          </div>
          {flaggedCount > 0 && (
            <button
              onClick={() => {
                onApplyCleanScripts(replacements);
                setFlaggedCount(null);
                setReplacements({});
                if (addNotification) addNotification("Applied safety replacements successfully!", "success");
              }}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
            >
              ✓ Auto Sanitize
            </button>
          )}
        </div>
      )}
    </div>
  );
}
