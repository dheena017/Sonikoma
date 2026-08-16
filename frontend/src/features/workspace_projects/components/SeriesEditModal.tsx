import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Sparkles,
  Image,
  User,
  Tag,
  FileText,
  Loader2,
} from "lucide-react";

interface SeriesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  series: {
    id: string;
    slug: string;
    title: string;
    author?: string;
    genre?: string;
    synopsis?: string;
    cover?: string;
  };
  onSave: (updated: {
    title: string;
    author: string;
    genre: string;
    synopsis: string;
    cover: string;
  }) => Promise<void>;
}

export default function SeriesEditModal({
  isOpen,
  onClose,
  series,
  onSave,
}: SeriesEditModalProps) {
  const [title, setTitle] = useState(series.title || "");
  const [author, setAuthor] = useState(series.author || "");
  const [genre, setGenre] = useState(series.genre || "");
  const [synopsis, setSynopsis] = useState(series.synopsis || "");
  const [cover, setCover] = useState(series.cover || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(series.title || "");
    setAuthor(series.author || "");
    setGenre(series.genre || "");
    setSynopsis(series.synopsis || "");
    setCover(series.cover || "");
  }, [series]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Series title cannot be empty.");
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim(),
        synopsis: synopsis.trim(),
        cover: cover.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error("Failed to save series details:", err);
      setError(err.message || "Failed to update series metadata.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-955/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Edit Series Information
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Update metadata across all chapters in this series
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-5 flex-1"
        >
          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs font-semibold text-rose-300">
              ⚠️ {error}
            </div>
          )}

          {/* Series Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Series Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solo Leveling"
              className="w-full bg-neutral-955 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-mono">
                <User className="w-3.5 h-3.5 text-purple-400" /> Author /
                Creator
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Chugong"
                className="w-full bg-neutral-955 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-sans"
              />
            </div>

            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-mono">
                <Tag className="w-3.5 h-3.5 text-purple-400" /> Genre / Tag
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Fantasy Action"
                className="w-full bg-neutral-955 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-sans"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-mono">
              <Image className="w-3.5 h-3.5 text-purple-400" /> Cover Image URL
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://images.example.com/cover.jpg"
                className="flex-1 bg-neutral-955 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-sans"
              />
              {cover && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-neutral-750 shrink-0 bg-neutral-955">
                  <img
                    src={cover}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 font-mono">
              Synopsis / Description
            </label>
            <textarea
              rows={4}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Enter series summary or story background..."
              className="w-full bg-neutral-955 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-sans resize-none scrollbar-thin"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Metadata
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
