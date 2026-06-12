import React, { useState } from "react";
import { UserCheck } from "lucide-react";
import { GeneratedPanel } from "../../types";
import CharacterProfileCard, { CharacterBio } from "./CharacterProfileCard.js";
import CharacterAutoDetector from "./CharacterAutoDetector.js";

interface CharacterProfilePageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function CharacterProfilePage({ panels, onNavigateHome, addNotification }: CharacterProfilePageProps) {
  const [characters, setCharacters] = useState<CharacterBio[]>([
    {
      name: "Sung Jin-Woo",
      estimated_age: "Late Teens / Early 20s",
      power_description: "Necromancy shadow extraction, extreme strength, absolute speed agility.",
      clothing_color: "Midnight dark cloak, obsidian armor accents.",
      active_role: "Protagonist"
    },
    {
      name: "Hwang Dong-Su",
      estimated_age: "Late 20s",
      power_description: "Hardened body scaling, earth impact shockwaves.",
      clothing_color: "Crimson fighting tunic.",
      active_role: "Rival Antagonist"
    }
  ]);

  const handleDetected = (newChars: CharacterBio[]) => {
    // Deduplicate and append
    setCharacters((prev) => {
      const existing = new Set(prev.map((c) => c.name.toLowerCase()));
      const filtered = newChars.filter((c) => !existing.has(c.name.toLowerCase()));
      if (filtered.length > 0) {
        if (addNotification) addNotification(`Scanned ${filtered.length} new character profiles!`, "success");
        return [...prev, ...filtered];
      }
      if (addNotification) addNotification("No new character profiles detected.", "info");
      return prev;
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-400" />
            AI Character Database Profile Manager
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Compile visual biography stats and character assets from storyboard scripts
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

      {/* Auto-Scrapers */}
      <CharacterAutoDetector panels={panels} onDetect={handleDetected} />

      {/* Characters List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {characters.map((char, idx) => (
          <CharacterProfileCard key={idx} char={char} />
        ))}
      </div>
    </div>
  );
}
