import React, { useState } from "react";
import { Narrative } from "../../../../types";
import { Sparkles, RefreshCw, CheckCircle, Wand2, Music, Users, Compass, Smile, Film, Zap, User } from "lucide-react";

interface NarrativeSectionProps {
  narrative: Narrative | null;
  onUpdateNarrative: (updated: Narrative) => void;
  onAction: (action: "analyze" | "regenerate" | "improve" | "apply_narrative", modifier?: string) => Promise<void>;
  isProcessing: boolean;
  panelsLength: number;
}

export default function NarrativeSection({
  narrative,
  onUpdateNarrative,
  onAction,
  isProcessing,
  panelsLength,
}: NarrativeSectionProps) {
  const [localNarrative, setLocalNarrative] = useState<Narrative | null>(narrative);
  const [hasUnappliedEdits, setHasUnappliedEdits] = useState(false);

  // Sync with prop narrative when it updates from AI
  React.useEffect(() => {
    setLocalNarrative(narrative);
    setHasUnappliedEdits(false);
  }, [narrative]);

  const handleFieldChange = (field: keyof Narrative, value: any) => {
    if (!localNarrative) return;
    const updated = { ...localNarrative, [field]: value };
    setLocalNarrative(updated);
    onUpdateNarrative(updated);
    setHasUnappliedEdits(true);
  };

  const handleCharactersChange = (val: string) => {
    const list = val.split(",").map((s) => s.trim()).filter(Boolean);
    handleFieldChange("characters", list);
  };

  const handleEmotionCurveChange = (val: string) => {
    const list = val.split(",").map((s) => s.trim()).filter(Boolean);
    handleFieldChange("emotionCurve", list);
  };

  const modifiers = [
    { label: "Make More Dramatic", value: "Make More Dramatic", icon: Film, color: "from-rose-500/10 to-red-500/5 hover:border-red-500/40 text-red-300" },
    { label: "Make More Funny", value: "Make More Funny", icon: Smile, color: "from-amber-500/10 to-yellow-500/5 hover:border-yellow-500/40 text-yellow-300" },
    { label: "Make More Emotional", value: "Make More Emotional", icon: Zap, color: "from-purple-500/10 to-pink-500/5 hover:border-pink-500/40 text-pink-300" },
    { label: "Make More Cinematic", value: "Make More Cinematic", icon: Film, color: "from-indigo-500/10 to-blue-500/5 hover:border-blue-500/40 text-indigo-300" },
    { label: "Make Faster", value: "Make Faster", icon: Zap, color: "from-cyan-500/10 to-teal-500/5 hover:border-teal-500/40 text-cyan-300" },
    { label: "Make Slower", value: "Make Slower", icon: Zap, color: "from-emerald-500/10 to-green-500/5 hover:border-green-500/40 text-emerald-300" },
  ];

  if (!localNarrative) {
    return (
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 shadow-inner">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">AI Story Director</h3>
          <p className="text-xs text-neutral-400 max-w-md mt-1 leading-relaxed">
            Ready to act as your AI screenplay and story continuity director. Analyze the sequence to generate a cohesive screenplay, metadata, and cinematic pacing.
          </p>
        </div>
        <button
          onClick={() => onAction("analyze")}
          disabled={isProcessing || panelsLength === 0}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Directing Narrative...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Analyze Full Sequence
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950/40 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/25 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              AI Story Screenplay
              {hasUnappliedEdits && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  Unapplied Edits
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-450 font-mono mt-0.5">
              The single source of truth guiding dialogue, continuous action, and sound cues.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onAction("regenerate")}
            disabled={isProcessing}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            Regenerate Story
          </button>

          <button
            onClick={() => onAction("improve")}
            disabled={isProcessing}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            Improve Story
          </button>

          {hasUnappliedEdits && (
            <button
              onClick={() => onAction("apply_narrative")}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-[pulse_1.8s_infinite] active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              Apply to Panels
            </button>
          )}
        </div>
      </div>

      {/* Narrative Summary and Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Title and Summary Textarea */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">Story Title</label>
            <input
              type="text"
              value={localNarrative.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className="w-full bg-neutral-900/90 border border-neutral-850 hover:border-neutral-750 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/15 text-white rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all outline-none"
              placeholder="E.g., The Escape Through Crystal Caverns"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 font-mono uppercase tracking-wider">Narrative Text (Screenplay)</label>
            <textarea
              rows={10}
              value={localNarrative.summary}
              onChange={(e) => handleFieldChange("summary", e.target.value)}
              className="w-full min-h-[220px] bg-neutral-900/90 border border-neutral-850 hover:border-neutral-750 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/15 text-white rounded-xl p-4 text-xs font-sans leading-relaxed transition-all outline-none resize-none"
              placeholder="The screenplay guiding all dialogues, continuous action, and continuity scores..."
            />
          </div>
        </div>

        {/* Right 1 Column: Metadata Fields */}
        <div className="space-y-4 bg-neutral-900/30 border border-neutral-800/60 p-5 rounded-2xl">
          <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono pb-2 border-b border-neutral-850">
            Director Metadata
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase">Genre</label>
              <input
                type="text"
                value={localNarrative.genre}
                onChange={(e) => handleFieldChange("genre", e.target.value)}
                className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-purple-500/40"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase">Tone</label>
              <input
                type="text"
                value={localNarrative.tone}
                onChange={(e) => handleFieldChange("tone", e.target.value)}
                className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-purple-500/40"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase flex items-center gap-1">
              <Users className="w-3 h-3 text-neutral-500" />
              Main Characters
            </label>
            <input
              type="text"
              value={localNarrative.characters.join(", ")}
              onChange={(e) => handleCharactersChange(e.target.value)}
              className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500/40"
              placeholder="Comma-separated characters..."
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase flex items-center gap-1">
              <Compass className="w-3 h-3 text-neutral-500" />
              Story Goal
            </label>
            <input
              type="text"
              value={localNarrative.storyGoal}
              onChange={(e) => handleFieldChange("storyGoal", e.target.value)}
              className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500/40"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-neutral-500" />
              Emotion Curve
            </label>
            <input
              type="text"
              value={localNarrative.emotionCurve.join(", ")}
              onChange={(e) => handleEmotionCurveChange(e.target.value)}
              className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500/40"
              placeholder="Fear, Surprise, Relief..."
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 font-mono uppercase flex items-center gap-1">
              <Music className="w-3 h-3 text-neutral-500" />
              Audio Direction Guidance
            </label>
            <textarea
              rows={2}
              value={localNarrative.audioDirection}
              onChange={(e) => handleFieldChange("audioDirection", e.target.value)}
              className="bg-neutral-900/80 border border-neutral-800/80 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-purple-500/40 resize-none leading-normal"
            />
          </div>
        </div>
      </div>

      {/* Modifier Buttons Panel */}
      <div className="border-t border-neutral-850 pt-5 space-y-3">
        <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">
          Directing Modifiers
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {modifiers.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.value}
                onClick={() => onAction("regenerate", mod.value)}
                disabled={isProcessing}
                className={`py-2 px-3 border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/90 rounded-xl text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 select-none ${mod.color}`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
