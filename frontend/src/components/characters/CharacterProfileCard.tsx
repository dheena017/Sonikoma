import React from "react";
import { User, Shield, Zap } from "lucide-react";

export interface CharacterBio {
  name: string;
  estimated_age: string;
  power_description: string;
  clothing_color: string;
  active_role: string;
}

interface CharacterProfileCardProps {
  char: CharacterBio;
}

export default function CharacterProfileCard({ char }: CharacterProfileCardProps) {
  const isProtagonist = char.active_role.toLowerCase().includes("pro");
  const isRival = char.active_role.toLowerCase().includes("riv");

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4.5 space-y-3 shadow-lg hover:border-purple-600/40 transition-all">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-purple-950 flex items-center justify-center border border-purple-800/40">
            <User className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{char.name}</span>
        </div>
        <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
          isProtagonist 
            ? "bg-emerald-950/20 border-emerald-900 text-emerald-450" 
            : isRival 
            ? "bg-rose-950/20 border-rose-900 text-rose-450"
            : "bg-neutral-950 border-neutral-800 text-neutral-400"
        }`}>
          {char.active_role}
        </span>
      </div>

      <div className="space-y-2 text-[10px] font-mono">
        <div className="flex justify-between border-b border-neutral-900 pb-1">
          <span className="text-neutral-500">Estimated Age</span>
          <span className="text-neutral-300 font-semibold">{char.estimated_age}</span>
        </div>
        <div className="flex justify-between border-b border-neutral-900 pb-1">
          <span className="text-neutral-500">Clothing Colors</span>
          <span className="text-neutral-300 font-semibold">{char.clothing_color}</span>
        </div>
        <div className="space-y-0.5 pt-1">
          <span className="text-neutral-500 flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-400" /> Abilities & Powers:
          </span>
          <p className="text-[11px] font-sans text-neutral-300 bg-neutral-950/80 p-2 rounded-lg leading-relaxed">
            {char.power_description}
          </p>
        </div>
      </div>
    </div>
  );
}
