import React from "react";
import { CreditCard } from "lucide-react";

interface CardPreviewProps {
  cardNo: string;
  cardHolder: string;
  cardExpiry: string;
}

export default function CardPreview({
  cardNo,
  cardHolder,
  cardExpiry,
}: CardPreviewProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative w-72 h-44 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 p-6 flex flex-col justify-between text-left text-white shadow-xl shadow-purple-950/20 overflow-hidden font-sans select-none">
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
            Sonikoma Premium Pay
          </span>
          <CreditCard className="w-5 h-5 text-white/80" />
        </div>

        <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300/20 shadow-inner flex items-center justify-center">
          <div className="w-4 h-4 border border-black/10 rounded" />
        </div>

        <div className="text-base font-black tracking-widest font-mono text-white/95">
          {cardNo || "•••• •••• •••• ••••"}
        </div>

        <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/70">
          <div className="space-y-0.5">
            <span className="text-[7px] text-white/55 block">Card Holder</span>
            <span className="font-bold truncate max-w-[150px] block">
              {cardHolder || "SONIKOMA CREATOR"}
            </span>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[7px] text-white/55 block">Expires</span>
            <span className="font-bold font-mono">{cardExpiry || "MM/YY"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
