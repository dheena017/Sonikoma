import React, { useState } from "react";
import { UserCheck, ArrowLeft } from "lucide-react";
import type { GeneratedPanel, CharacterBio } from "@/types";
import CharacterProfileCard from "./CharacterProfileCard.js";
import CharacterAutoDetector from "./CharacterAutoDetector.js";
import CharacterEditModal from "./CharacterEditModal.js";

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
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Character DB</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <UserCheck className="h-5 w-5" />
              </div>
              AI Character Database Profile Manager
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Compile visual biography stats and character assets from storyboard scripts
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
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
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
            <UserCheck className="h-10 w-10 text-neutral-600 mb-3" />
            <h3 className="text-neutral-400 font-mono text-sm font-semibold mb-1">
              No characters detected
            </h3>
            <p className="text-neutral-500 text-xs text-center max-w-sm">
              Click the "Scan dialogues" button above to automatically scan the
              current storyboard and build profiles for each character.
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
