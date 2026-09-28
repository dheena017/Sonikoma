import React, { useEffect, useState } from "react";
import {
  Users,
  Sparkles,
  Shield,
  Plus,
  ArrowLeft,
  Volume2,
  Check,
  Edit2,
  Tag,
  Palette,
} from "lucide-react";
import { aiSeriesApi, CharacterDNA, AISeriesProject } from "@/api/endpoints/aiSeries";
import { useSeriesNavigation } from "../hooks/useSeriesNavigation";

export const CharacterVaultPage: React.FC = () => {
  const { navigate, seriesId } = useSeriesNavigation();
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [characters, setCharacters] = useState<CharacterDNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChar, setSelectedChar] = useState<CharacterDNA | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    const load = async () => {
      try {
        setLoading(true);
        const p = await aiSeriesApi.getSeries(seriesId);
        setProject(p);
        const chars = await aiSeriesApi.getCharacters(seriesId);
        setCharacters(chars.length > 0 ? chars : p.cast || []);
        if (chars.length > 0) setSelectedChar(chars[0]);
      } catch (err) {
        console.error("Failed to load cast vault:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [seriesId]);

  const handleSaveCharacter = async () => {
    if (!seriesId || !selectedChar) return;
    try {
      const charId = selectedChar.character_id || selectedChar.id || "char_1";
      await aiSeriesApi.updateCharacter(seriesId, charId, selectedChar);
      setEditing(false);
      alert("Character DNA updated and synchronized with Franchise Continuity Memory!");
    } catch (err) {
      alert("Failed to update character.");
    }
  };

  const getStudioLink = () => {
    if (!project) return `/ai-series`;
    const format = project.format_type;
    if (format === "anime") return `/studio/anime/${seriesId}`;
    if (format === "comic_manga") return `/studio/comic/${seriesId}`;
    return `/studio/manhwa/${seriesId}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(getStudioLink())}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-violet-400 font-semibold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Character DNA Vault
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                {project ? project.title : "Series"} Cast Architecture
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate(getStudioLink())}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-md"
          >
            Return to Studio
          </button>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-400">Loading Character DNA Vault...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cast List Column */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Locked Character Cast ({characters.length})
              </h2>

              {characters.map((char) => {
                const isSelected = selectedChar?.name === char.name;
                return (
                  <div
                    key={char.name}
                    onClick={() => {
                      setSelectedChar(char);
                      setEditing(false);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-violet-600/10 border-violet-500 text-white shadow-md shadow-violet-900/10"
                        : "bg-[#121316] border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-base text-white">{char.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-violet-500/20 text-violet-300">
                        {char.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{char.visual_summary || char.visual_prompt}</p>
                  </div>
                );
              })}
            </div>

            {/* Character DNA Profile Detail */}
            {selectedChar && (
              <div className="lg:col-span-2 bg-[#121316] border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-violet-400 font-bold">
                      {selectedChar.role}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white">{selectedChar.name}</h2>
                  </div>

                  <button
                    onClick={() => {
                      if (editing) {
                        handleSaveCharacter();
                      } else {
                        setEditing(true);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
                  >
                    {editing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {editing ? "Save Changes" : "Edit DNA Tokens"}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Visual Summary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Physical Appearance Anchor
                    </label>
                    {editing ? (
                      <textarea
                        rows={3}
                        value={selectedChar.visual_summary || ""}
                        onChange={(e) =>
                          setSelectedChar({ ...selectedChar, visual_summary: e.target.value })
                        }
                        className="w-full bg-[#18191E] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
                      />
                    ) : (
                      <div className="p-3 bg-[#18191E] border border-slate-800 rounded-xl text-sm text-slate-300">
                        {selectedChar.visual_summary || "Standard physical description."}
                      </div>
                    )}
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Hair Style & Color
                      </label>
                      <input
                        type="text"
                        disabled={!editing}
                        value={selectedChar.hair_color || "Dark layered hair"}
                        onChange={(e) => setSelectedChar({ ...selectedChar, hair_color: e.target.value })}
                        className="w-full bg-[#18191E] border border-slate-800 disabled:opacity-70 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Eye Color & Gaze
                      </label>
                      <input
                        type="text"
                        disabled={!editing}
                        value={selectedChar.eye_color || "Piercing Amber"}
                        onChange={(e) => setSelectedChar({ ...selectedChar, eye_color: e.target.value })}
                        className="w-full bg-[#18191E] border border-slate-800 disabled:opacity-70 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Wardrobe & Color Palette */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-violet-400" /> Signature Clothing Palette
                    </label>
                    <input
                      type="text"
                      disabled={!editing}
                      value={selectedChar.clothing_palette || "Obsidian black, gunmetal grey, and violet accents"}
                      onChange={(e) => setSelectedChar({ ...selectedChar, clothing_palette: e.target.value })}
                      className="w-full bg-[#18191E] border border-slate-800 disabled:opacity-70 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>

                  {/* Scars & Signature Traits */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" /> Signature Traits & Battle Scars
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedChar.signature_traits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Edge-TTS Vocal Casting */}
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-lg">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Assigned Voice Actor (Edge-TTS Neural)</div>
                        <div className="text-sm font-bold text-white">
                          {selectedChar.voice_id || "en-US-ChristopherNeural (Heroic / Protagonist)"}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => alert("Auditioning character voice sample...")}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
                    >
                      Audition Voice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterVaultPage;
