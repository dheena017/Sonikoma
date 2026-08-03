import React, { useState } from "react";
import { UserCheck, ArrowLeft } from "lucide-react";
import type { GeneratedPanel, CharacterBio } from "@/types";
import CharacterProfileCard from "@/features/characters/components/CharacterProfileCard";
import CharacterAutoDetector from "@/features/characters/components/CharacterAutoDetector";
import CharacterEditModal from "@/features/characters/components/CharacterEditModal";

interface CharacterProfilePageProps {
  panels: GeneratedPanel[];
  characters: CharacterBio[];
  setCharacters: React.Dispatch<React.SetStateAction<CharacterBio[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

const CharacterProfilePage = React.memo(
  ({
    panels,
    characters,
    setCharacters,
    onNavigateHome,
    addNotification,
  }: CharacterProfilePageProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCharIdx, setEditingCharIdx] = useState<number | null>(null);

    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <UserCheck className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to start scanning character profiles.
          </p>
        </div>
      );
    }

    const handleDetected = (newChars: CharacterBio[]) => {
      // Deduplicate and append
      setCharacters((prev) => {
        const existing = new Set(prev.map((c) => (c.name || "").toLowerCase()));
        const filtered = newChars.filter(
          (c) => c.name && !existing.has(c.name.toLowerCase())
        );
        if (filtered.length > 0) {
          if (addNotification)
            addNotification(
              `Scanned ${filtered.length} new character profiles!`,
              "success"
            );
          return [...prev, ...filtered];
        }
        if (addNotification)
          addNotification("No new character profiles detected.", "info");
        return prev;
      });
    };

    const handleSaveCharacter = (char: CharacterBio) => {
      setCharacters((prev) => {
        const newChars = [...prev];
        if (editingCharIdx !== null) {
          newChars[editingCharIdx] = char;
          if (addNotification)
            addNotification(`Updated profile for ${char.name}`, "success");
        } else {
          newChars.push(char);
          if (addNotification)
            addNotification(`Added new character ${char.name}`, "success");
        }
        return newChars;
      });
    };

    const handleDeleteCharacter = (idx: number) => {
      setCharacters((prev) => {
        const name = prev[idx]?.name || "Character";
        const newChars = prev.filter((_, i) => i !== idx);
        if (addNotification) addNotification(`Deleted ${name}`, "info");
        return newChars;
      });
    };

    const openAddModal = () => {
      setEditingCharIdx(null);
      setIsModalOpen(true);
    };

    const openEditModal = (idx: number) => {
      setEditingCharIdx(idx);
      setIsModalOpen(true);
    };

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  CONTEXT &amp; SCRIPT
                </span>
                <span className="text-xs text-neutral-400 font-mono">• {characters.length} character bios</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Character DB
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Automatic dialogue character scanning, visual prompt rules, and cast bio profiles.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>{panels.length} Storyboard Panels</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Auto-Scrapers */}
          <div className="flex-1 w-full sm:w-auto">
            <CharacterAutoDetector panels={panels} onDetect={handleDetected} />
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            + Add Custom Character
          </button>
        </div>

        {/* Characters List Grid */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-950/40">
            <UserCheck className="h-10 w-10 text-neutral-600 mb-3" />
            <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
              No Characters Detected
            </h3>
            <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
              Click the "Scan dialogues" button above to automatically scan the current storyboard and build profiles for each character.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {characters.map((char, idx) => (
              <CharacterProfileCard
                key={idx}
                char={char}
                onEdit={() => openEditModal(idx)}
                onDelete={() => handleDeleteCharacter(idx)}
              />
            ))}
          </div>
        )}

        <CharacterEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCharacter}
          initialData={
            editingCharIdx !== null ? characters[editingCharIdx] : undefined
          }
        />
      </div>
    );
  }
);

export default CharacterProfilePage;
