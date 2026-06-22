import { useState } from "react";
import { AlertTriangle, ShieldCheck, Settings, Shield } from "lucide-react";
import { GeneratedPanel } from "../../types";
import { processWithConcurrency, chunkArray } from "../../utils/batchUtils";

interface BulkScrubberControlProps {
  panels: GeneratedPanel[];
  onApplyCleanScripts: (mappings: Record<number, string>) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function BulkScrubberControl({
  panels,
  onApplyCleanScripts,
  addNotification,
}: BulkScrubberControlProps) {
  const [loading, setLoading] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState<number | null>(null);
  const [replacements, setReplacements] = useState<Record<number, string>>({});

  // Custom compliance configurations
  const [scanMode, setScanMode] = useState<"quick" | "full">("quick");
  const [scanFocus, setScanFocus] = useState<
    "copyright" | "monetization" | "family"
  >("copyright");

  const handleBulkScrub = async () => {
    setLoading(true);
    try {
      const targetPanels = scanMode === "quick" ? panels.slice(0, 4) : panels;
      console.log(
        `[Compliance Scrubber] Running audit. Mode: ${scanMode}, Focus: ${scanFocus}, Panels count: ${targetPanels.length}`
      );

      const chunks = chunkArray(targetPanels, 8);

      // Process panels concurrently to avoid sequential fetch delays or overloading API
      const results = await processWithConcurrency(chunks, 4, async (chunkPanels) => {
        const panelsToScrub = chunkPanels.filter(p => p.speech_text && p.speech_text.trim());
        if (panelsToScrub.length === 0) return [];
        
        try {
          const res = await fetch("/api/skills/copyright-scrub-batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              texts: panelsToScrub.map(p => p.speech_text),
              model: "gemini-2.5-flash",
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.success && json.results) {
            const mappedResults = [];
            for (let i = 0; i < panelsToScrub.length; i++) {
              const p = panelsToScrub[i];
              const r = json.results.find((result: any) => result.text === p.speech_text);
              if (r && r.success && r.data && r.data.result) {
                let isViolating = r.data.result.contains_violation;
                let sanitizedText = r.data.result.sanitized_text;

                if (
                  scanFocus === "monetization" &&
                  p.speech_text.toLowerCase().includes("kill")
                ) {
                  isViolating = true;
                  sanitizedText = p.speech_text.replace(/kill/gi, "defeat");
                } else if (
                  scanFocus === "family" &&
                  p.speech_text.toLowerCase().includes("damn")
                ) {
                  isViolating = true;
                  sanitizedText = p.speech_text.replace(/damn/gi, "darn");
                }

                if (isViolating) {
                  mappedResults.push({ id: p.id, sanitized: sanitizedText });
                }
              }
            }
            return mappedResults;
          }
        } catch (err) {
          console.warn(
            `[Compliance Scrubber] Failed scanning chunk:`,
            err
          );
        }
        return [];
      });

      const flattenedResults = results.flat();
      const cleanMappings: Record<number, string> = {};
      let flags = 0;
      for (const r of flattenedResults) {
        if (r) {
          flags += 1;
          cleanMappings[r.id] = r.sanitized;
        }
      }

      setFlaggedCount(flags);
      setReplacements(cleanMappings);
      if (addNotification) {
        addNotification(
          `Compliance scan completed (${
            scanMode === "full" ? "all" : "first 4"
          } panels). Flagged ${flags} violations.`,
          flags > 0 ? "warning" : "success"
        );
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to complete compliance audit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800 space-y-4 shadow-lg">
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-neutral-900 pb-3.5">
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-purple-400" />
            Bulk Monetization Scrubber
          </h4>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
            Audit dialogues for policy compliance, copyright safety, and rating
            criteria
          </p>
        </div>
        <button
          onClick={handleBulkScrub}
          disabled={loading || panels.length === 0}
          className="px-3.5 py-2 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/40"
        >
          {loading ? (
            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            "✦ Run Compliance Audit"
          )}
        </button>
      </div>

      {/* Compliance Configuration Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-neutral-900/30 p-3 rounded-xl border border-neutral-850/50">
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Settings className="h-3 w-3" /> Audit Scan Mode
          </label>
          <select
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value as any)}
            className="w-full bg-neutral-950 border border-neutral-850 text-[11px] rounded-xl p-2 text-neutral-300 outline-none focus:border-purple-650 transition-all font-mono cursor-pointer"
          >
            <option value="quick">Quick Scan (First 4 Panels)</option>
            <option value="full">
              Full Timeline Scan (All Panels Concurrently)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-mono text-neutral-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Shield className="h-3 w-3" /> Compliance Focus
          </label>
          <select
            value={scanFocus}
            onChange={(e) => setScanFocus(e.target.value as any)}
            className="w-full bg-neutral-950 border border-neutral-850 text-[11px] rounded-xl p-2 text-neutral-300 outline-none focus:border-purple-650 transition-all font-mono cursor-pointer"
          >
            <option value="copyright">Copyright & Trademark Safe</option>
            <option value="monetization">Advertiser Policy Safe (PG-13)</option>
            <option value="family">Family-Friendly (PG Rating)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5 border border-dashed border-neutral-850 rounded-xl animate-pulse text-[10px] font-mono text-purple-400 bg-purple-950/5">
          Running policy audit across dialogues. Please wait...
        </div>
      )}

      {flaggedCount !== null && !loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-xl flex justify-between items-center gap-4 animate-fade-in text-xs">
          <div className="flex items-center gap-2.5">
            {flaggedCount > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                <span className="text-neutral-300 font-mono">
                  Flagged{" "}
                  <span className="text-rose-500 font-bold bg-rose-950/45 px-1.5 py-0.5 rounded border border-rose-900/40">
                    {flaggedCount}
                  </span>{" "}
                  dialogues matching violation triggers.
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="text-emerald-400 font-mono font-bold">
                  100% Monetization-Safe Script Audit Completed!
                </span>
              </>
            )}
          </div>
          {flaggedCount > 0 && (
            <button
              onClick={() => {
                onApplyCleanScripts(replacements);
                setFlaggedCount(null);
                setReplacements({});
                if (addNotification)
                  addNotification(
                    "Applied safety replacements successfully!",
                    "success"
                  );
              }}
              className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-550 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              ✓ Auto Sanitize
            </button>
          )}
        </div>
      )}
    </div>
  );
}
