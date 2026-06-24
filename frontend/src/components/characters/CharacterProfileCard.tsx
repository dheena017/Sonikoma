import React, { useState } from "react";
import { User, Shield, Zap, Pencil, Trash2 } from "lucide-react";
import type { CharacterBio } from "../../types";

interface CharacterProfileCardProps {
  char: CharacterBio;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CharacterProfileCard({
  char,
  onEdit,
  onDelete,
}: CharacterProfileCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const isProtagonist = (char.active_role || "").toLowerCase().includes("pro");
  const isRival = (char.active_role || "").toLowerCase().includes("riv");

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4.5 space-y-3 shadow-lg hover:border-purple-600/40 transition-all relative group">
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-1.5 bg-neutral-950/80 hover:bg-purple-600/20 text-neutral-400 hover:text-purple-400 rounded-lg transition-colors border border-neutral-800 backdrop-blur-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => setShowConfirm(true)}
            className="p-1.5 bg-neutral-950/80 hover:bg-red-600/20 text-neutral-400 hover:text-red-400 rounded-lg transition-colors border border-neutral-800 backdrop-blur-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-neutral-950/95 rounded-2xl z-20 flex flex-col items-center justify-center p-4 animate-fade-in text-center border border-red-900/30">
          <Trash2 className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-sm font-bold text-white mb-1">Delete Character?</p>
          <p className="text-[10px] text-neutral-400 mb-4">This cannot be undone.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start border-b border-neutral-800 pb-3 pr-16">
        <div className="flex items-center gap-3">
          {char.avatar_url ? (
            <img 
              src={char.avatar_url} 
              alt={char.name}
              className="h-9 w-9 rounded-xl object-cover border border-purple-800/40 shadow-sm"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-purple-950 flex items-center justify-center border border-purple-800/40 shadow-sm shrink-0">
              <User className="h-4 w-4 text-purple-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-mono font-bold text-white uppercase tracking-wider truncate">
              {char.name}
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block w-fit mt-1 ${
                isProtagonist
                  ? "bg-emerald-950/20 border-emerald-900 text-emerald-450"
                  : isRival
                  ? "bg-rose-950/20 border-rose-900 text-rose-450"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              {char.active_role || "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-[10px] font-mono">
        <div className="flex justify-between border-b border-neutral-900 pb-1">
          <span className="text-neutral-500">Estimated Age</span>
          <span className="text-neutral-300 font-semibold">
            {char.estimated_age}
          </span>
        </div>
        <div className="flex justify-between border-b border-neutral-900 pb-1">
          <span className="text-neutral-500">Clothing Colors</span>
          <span className="text-neutral-300 font-semibold">
            {char.clothing_color}
          </span>
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
