import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle } from "lucide-react";

interface TitleOptimizerProps {
  title: string;
  setTitle: (val: string) => void;
  scrapedTitle: string;
  scrapedGenre: string;
  onInjectPowerWord: (word: string) => void;
}

export default function TitleOptimizer({
  title,
  setTitle,
  scrapedTitle,
  scrapedGenre,
  onInjectPowerWord,
}: TitleOptimizerProps) {
  const [variants, setVariants] = useState<string[]>([]);

  // Generate Clickbait title variants based on active title or scraped Title
  const handleGenerateVariants = () => {
    const base = title.trim() || scrapedTitle || "This Webtoon MC";

    // Clean brackets/recap tag from base to avoid doubling
    const cleanBase = base.replace(/\[.*?\]/g, "").trim();

    const option1 = `Reborn as ${cleanBase}, I Unlocked a Cheat System!`;
    const option2 = `He Was F-Rank, Until He Became the Ultimate ${
      scrapedGenre || "OP"
    } King!`;
    const option3 = `I Spent 10,000 Years Leveling Up ${cleanBase}...!`;

    setVariants([option1, option2, option3]);
  };

  useEffect(() => {
    handleGenerateVariants();
  }, [title, scrapedTitle, scrapedGenre]);

  const isShortOverOptimal = title.length > 70;
  const isShortTooLong = title.length > 100;

  return (
    <div className="space-y-2.5 animate-fade-in">
      {/* Title field */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-mono">
          <label className="text-neutral-300 font-bold flex items-center gap-1">
            <span>Video Title</span>
            {isShortOverOptimal && (
              <span className="text-[10px] text-amber-400 font-normal italic flex items-center gap-0.5 animate-pulse">
                <HelpCircle className="text-amber-400 h-3 w-3" />
                Keep under 70 chars for mobile
              </span>
            )}
          </label>
          <span
            className={`font-semibold text-[10.5px] font-mono ${
              isShortTooLong
                ? "text-red-400 font-bold"
                : isShortOverOptimal
                ? "text-amber-400"
                : "text-neutral-450"
            }`}
          >
            {title.length}/100
          </span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Write a catchy, high-CTR title..."
          className="w-full bg-neutral-950/40 hover:bg-neutral-900/10 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none transition-all duration-200 font-sans font-bold shadow-inner"
        />

        {/* Title Power Words suggestions */}
        <div className="flex flex-wrap gap-1.5 pt-0.5 font-mono text-[9.5px] text-neutral-400 items-center">
          <span className="font-bold text-neutral-500 block mr-0.5">
            💡 Power Tags:
          </span>
          {[
            "[OP MC]",
            "[RECAP]",
            "[FULL EPISODE]",
            "[LEVEL 999+]",
            "[VILLAINESS]",
            "[MANHWA]",
          ].map((word) => {
            const isPresent = title.includes(word);
            return (
              <button
                key={word}
                onClick={() => !isPresent && onInjectPowerWord(word)}
                disabled={isPresent}
                className={`px-2 py-0.5 rounded-lg border text-[9px] font-medium font-mono transition-all duration-200 cursor-pointer ${
                  isPresent
                    ? "bg-neutral-950/20 border-neutral-900/40 text-neutral-600 cursor-not-allowed opacity-50"
                    : "bg-neutral-900/30 border-neutral-850/60 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 hover:bg-purple-950/10"
                }`}
              >
                +{word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clickbait Slogans / Variants tool */}
      <div className="p-3 bg-neutral-950/40 backdrop-blur-sm rounded-xl border border-neutral-900 space-y-2 font-mono text-[10.5px] text-neutral-450">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
          <span className="text-neutral-250 font-bold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Clickbait Title Generator
          </span>
          <button
            onClick={handleGenerateVariants}
            className="text-[9px] text-purple-400 hover:text-purple-305 flex items-center gap-1 cursor-pointer bg-purple-950/20 px-2.5 py-0.5 rounded-lg border border-purple-900/30 hover:bg-purple-900/10 transition-all duration-200"
          >
            Re-Roll
          </button>
        </div>

        <div className="space-y-1.5 font-sans">
          {variants.map((v, i) => (
            <button
              key={i}
              onClick={() => {
                if (v.length <= 100) {
                  setTitle(v);
                }
              }}
              className="w-full text-left bg-neutral-900/40 hover:bg-purple-950/10 border border-neutral-900 hover:border-purple-500/25 rounded-lg p-2 text-[10px] text-neutral-350 hover:text-purple-300 transition-all duration-200 cursor-pointer leading-relaxed shadow-sm"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
