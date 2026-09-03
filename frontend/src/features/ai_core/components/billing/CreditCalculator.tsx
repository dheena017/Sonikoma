import React from "react";
import { Gift, Zap } from "lucide-react";

export interface CreditCalculatorProps {
  customCredits: number;
  onCreditsChange: (credits: number) => void;
  formatCustomPrice?: (credits: number) => string;
  onPurchase: () => void;
}

export const CreditCalculator: React.FC<CreditCalculatorProps> = ({
  customCredits,
  onCreditsChange,
  formatCustomPrice = (credits) => `$${((credits * 0.02)).toFixed(2)}`,
  onPurchase,
}) => {
  return (
    <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-4.5 h-4.5 text-[#3B82F6]" />
            Interactive Credit Purchase Calculator
          </h3>
          <p className="text-xs text-neutral-400 font-semibold">
            Slide to estimate pricing for custom rendering volume packages
          </p>
        </div>
        <div className="bg-purple-600/10 border border-[#3B82F6]/20 px-4 py-2 rounded-2xl text-[#3B82F6] text-sm font-black font-mono flex items-center gap-1.5 self-start sm:self-auto">
          <Zap className="w-4 h-4 text-[#3B82F6] fill-purple-400" />
          Price: {formatCustomPrice(customCredits)}
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={customCredits}
          onChange={(e) => onCreditsChange(parseInt(e.target.value))}
          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
          <span>100 Credits</span>
          <span className="text-amber-300 font-extrabold text-xs">
            {customCredits.toLocaleString()} Credits selected
          </span>
          <span>10,000 Credits</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onPurchase}
        className="w-full bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-900/10"
      >
        Purchase Custom Package ({formatCustomPrice(customCredits)})
      </button>
    </div>
  );
};

export default CreditCalculator;
