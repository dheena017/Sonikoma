import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { CharacterBio, GeneratedPanel } from "../../types.js";
import * as api from "../../api/index.js";
import { fetchWithAuth } from "../../utils.js";

interface CharacterAutoDetectorProps {
  panels: GeneratedPanel[];
  onDetect: (chars: CharacterBio[]) => void;
}

export default function CharacterAutoDetector({
  panels,
  onDetect,
}: CharacterAutoDetectorProps) {
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      // Pick dialogues that contain names or descriptive settings
      const testDialogues = panels
        .map((p) => p.speech_text)
        .filter((text) => text && text.trim().length > 10)
        .slice(0, 3);

      const results: CharacterBio[] = [];

      for (const dial of testDialogues) {
        const json = await api.runCharacterBioSkill(fetchWithAuth, {
          dialogue: dial,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
        if (json.success && json.result) {
          results.push(json.result);
        }
      }

      if (results.length > 0) {
        onDetect(results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-800 flex justify-between items-center">
      <div>
        <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase">
          AI Dialogue Character Scanner
        </h4>
        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
          Scrapes storyboard scripts to compile individual character files
          automatically
        </p>
      </div>
      <button
        onClick={handleScan}
        disabled={loading || panels.length === 0}
        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
      >
        {loading ? "Scanning..." : "✦ Scan dialogues"}
      </button>
    </div>
  );
}
