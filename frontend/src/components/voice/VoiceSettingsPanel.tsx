import React, { useState } from "react";
import { Sparkles, Check, Users, ShieldAlert } from "lucide-react";

interface VoiceSettingsPanelProps {
  addNotification?: (msg: string, type: any) => void;
}

interface CastResult {
  suggested_actor: string;
  tone_description: string;
  match_confidence: number;
}

export default function VoiceSettingsPanel({ addNotification }: VoiceSettingsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("Shadow Sovereign");
  const [dialogue, setDialogue] = useState("Arise. The darkness answers only to me.");
  const [visual, setVisual] = useState("Tall male with glowing violet eyes, clad in midnight black armor radiating shadows.");
  const [castData, setCastData] = useState<CastResult | null>(null);

  const handleCast = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/voice-cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_name: name,
          dialogue_sample: dialogue,
          visual_description: visual,
          model: "gemini-2.5-flash"
        })
      });
      const json = await res.json();
      if (json.success && json.result) {
        setCastData(json.result);
        if (addNotification) {
          addNotification("Character voice recommendation parsed!", "success");
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Voice casting search encountered an issue", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">AI Voice Casting Selector</h4>
        </div>
        <button
          onClick={handleCast}
          disabled={loading || !name}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Searching profiles..." : "✦ Cast Voice"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">Character Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jinwoo"
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-neutral-500 uppercase">Dialogue Sample</label>
            <input
              type="text"
              value={dialogue}
              onChange={(e) => setDialogue(e.target.value)}
              placeholder="e.g. Prepare to perish."
              className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-mono text-neutral-500 uppercase">Visual Appearance Description</label>
          <textarea
            rows={2}
            value={visual}
            onChange={(e) => setVisual(e.target.value)}
            placeholder="Describe character's gender, style, aura, look..."
            className="w-full bg-neutral-950 border border-neutral-850 text-xs rounded-xl p-2.5 text-neutral-350 outline-none focus:border-purple-600 transition-all font-sans"
          />
        </div>

        {castData && !loading && (
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
              <span className="text-[9px] font-mono text-purple-355 uppercase font-bold">Recommended Voice Cast:</span>
              <span className="text-[9px] font-mono bg-purple-950/40 text-purple-400 px-2 py-0.5 border border-purple-800/40 rounded-full">
                Confidence: {Math.round((castData.match_confidence || 0.9) * 100)}%
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-900/25 border border-purple-800/40 flex items-center justify-center font-bold text-sm text-purple-300 uppercase">
                {castData.suggested_actor?.charAt(0) || "V"}
              </div>
              <div className="space-y-1 flex-1">
                <h5 className="text-xs font-bold text-white font-sans">{castData.suggested_actor || "Male Deep Hero"}</h5>
                <p className="text-[11px] font-sans text-neutral-350 leading-relaxed">
                  {castData.tone_description || "A deep, authoritative resonance that commands presence, suitable for main protagonists with mysterious powers."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
