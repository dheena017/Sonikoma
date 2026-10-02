import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

export interface CardPreviewProps {
  cardNo: string;
  cardHolder: string;
  cardExpiry: string;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  cardNo,
  cardHolder,
  cardExpiry,
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative w-full max-w-[320px] h-48 rounded-2xl bg-gradient-to-br from-[#2A2A2A] via-indigo-800 to-neutral-900 p-6 flex flex-col justify-between text-left text-white shadow-2xl shadow-black/50 overflow-hidden font-sans select-none border border-white/10">
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full bg-[#2A2A2A] blur-xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6]">
            Sonikoma AI Studio
          </span>
          <CreditCard className="w-5 h-5 text-white/80" />
        </div>

        <div className="w-10 h-8 rounded-md bg-amber-400/90 border border-amber-300/30 shadow-inner flex items-center justify-center relative z-10">
          <div className="w-5 h-5 border border-black/20 rounded" />
        </div>

        <div className="text-base font-black tracking-widest font-mono text-white/95 relative z-10">
          {cardNo || "•••• •••• •••• ••••"}
        </div>

        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/75 relative z-10">
          <div className="space-y-0.5">
            <span className="text-[7px] text-white/50 block">Card Holder</span>
            <span className="font-bold truncate max-w-[150px] block font-mono">
              {cardHolder || "SONIKOMA CREATOR"}
            </span>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[7px] text-white/50 block">Expires</span>
            <span className="font-bold font-mono">{cardExpiry || "MM/YY"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
