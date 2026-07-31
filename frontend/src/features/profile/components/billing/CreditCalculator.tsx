import React from "react";
import { Gift } from "lucide-react";

interface CreditCalculatorProps {
  customCredits: number;
  onCreditsChange: (credits: number) => void;
  formatCustomPrice: (credits: number) => string;
  onPurchase: () => void;
}

export default function CreditCalculator({
  customCredits,
  onCreditsChange,
  formatCustomPrice,
  onPurchase,
}: CreditCalculatorProps) {
  return (
    <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative space-y-5">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            Interactive Credit Purchase Calculator
          </h3>
          <p className="text-xs text-neutral-400 font-semibold">
            Slide to estimate pricing for custom rendering volume packages
          </p>
        </div>
        <div className="bg-purple-600/10 border border-purple-500/20 px-4 py-2 rounded-2xl text-purple-400 text-sm font-black font-mono">
          Price: {formatCustomPrice(customCredits)}
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={customCredits}
          onChange={(e) => onCreditsChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
          <span>100 Credits</span>
          <span className="text-white font-extrabold text-[11px]">
            {customCredits} Credits chosen
          </span>
          <span>5000 Credits</span>
        </div>
      </div>

      <button
        onClick={onPurchase}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-900/10"
      >
        Purchase Package ({formatCustomPrice(customCredits)})
      </button>
    </div>
  );
}
