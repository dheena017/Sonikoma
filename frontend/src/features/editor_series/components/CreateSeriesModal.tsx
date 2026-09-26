import React, { useState } from "react";
import {
  X,
  Sparkles,
  Film,
  BookOpen,
  Layers,
  ChevronRight,
  Loader2,
  Sliders,
  Volume2,
  CheckCircle2,
  Plus,
  Minus,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { notify } from "@/features/app_notification";

export type MediumType = "anime" | "manhwa" | "comic";

interface CreateSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeriesCreated?: (seriesId: string) => void;
}

export default function CreateSeriesModal({
  isOpen,
  onClose,
  onSeriesCreated,
}: CreateSeriesModalProps) {
  const [mediumType, setMediumType] = useState<MediumType>("anime");
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("action_fantasy");
  const [totalChapters, setTotalChapters] = useState(3);
  const [imageModel, setImageModel] = useState("pollinations-flux");
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [pacing, setPacing] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (totalChapters < 25) setTotalChapters((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (totalChapters > 1) setTotalChapters((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify.warning("Please enter a title for your series.");
      return;
    }
    if (!synopsis.trim()) {
      notify.warning("Please provide a story premise or concept.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/series/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          synopsis: synopsis.trim(),
          genre,
          medium_type: mediumType,
          total_chapters: totalChapters,
          image_model: imageModel,
          voice_language: voiceLanguage,
          pacing,
          enable_dialogue_bubbles: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create series");
      }

      const data = await res.json();
      notify.success(`Series "${title}" created! Chapter 1 generation is underway.`);
      onClose();

      if (onSeriesCreated && data.series_id) {
        onSeriesCreated(data.series_id);
      } else if (data.series_id) {
        const nav = (window as any).navigateTo;
        if (typeof nav === "function") {
          nav(`/series/${data.series_id}`);
        } else {
          window.location.href = `/series/${data.series_id}`;
        }
      }
    } catch (err: any) {
      notify.error(err.message || "Failed to create series.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Multi-Chapter Studio
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Create, Read & Watch entire Anime, Manhwa & Comics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* 1. Medium Choice Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              1. Choose Medium Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Anime Video */}
              <button
                type="button"
                onClick={() => setMediumType("anime")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  mediumType === "anime"
                    ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Film className={`w-5 h-5 ${mediumType === "anime" ? "text-indigo-400" : ""}`} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    WATCH
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-100">Anime Episodes</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    Full video episodes with voice acting, camera pans/zooms & OST.
                  </p>
                </div>
              </button>

              {/* Manhwa Webtoon */}
              <button
                type="button"
                onClick={() => setMediumType("manhwa")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  mediumType === "manhwa"
                    ? "bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers className={`w-5 h-5 ${mediumType === "manhwa" ? "text-purple-400" : ""}`} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    READ
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-100">Manhwa Webtoon</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    Infinite vertical scroll webtoon with vibrant colors & speech bubbles.
                  </p>
                </div>
              </button>

              {/* Comic / Manga */}
              <button
                type="button"
                onClick={() => setMediumType("comic")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  mediumType === "comic"
                    ? "bg-amber-600/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className={`w-5 h-5 ${mediumType === "comic" ? "text-amber-400" : ""}`} />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    READ
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-100">Comic / Manga</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    Paginated multi-panel pages with LTR/RTL flipbook reading mode.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Title & Premise */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Series Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Reborn Shadow King"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Story Premise / Concept Prompt
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Describe the main storyline, the protagonist's awakening, key conflicts, and world setting. The AI will weave this into a complete seasonal narrative arc."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none resize-none transition-all"
                required
              />
            </div>
          </div>

          {/* 3. Number of Chapters & Genre Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Chapters Stepper */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Number of Chapters (1 - 25)
              </label>
              <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={totalChapters <= 1}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center font-mono font-bold text-sm text-neutral-100">
                  {totalChapters} {totalChapters === 1 ? "Chapter" : "Chapters"}
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={totalChapters >= 25}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Chapter 1 renders first so you can start watching/reading immediately.
              </p>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 outline-none cursor-pointer"
              >
                <option value="action_fantasy">Action Fantasy (Solo Leveling style)</option>
                <option value="isekai">Isekai / Reincarnation</option>
                <option value="cyberpunk">Cyberpunk / Sci-Fi</option>
                <option value="supernatural">Supernatural / Mystery</option>
                <option value="romance_otome">Otome / Romance Fantasy</option>
                <option value="shonen_martial">Martial Arts / Murim</option>
              </select>
            </div>
          </div>

          {/* 4. Engine & Voice Settings */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Visual Engine */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                AI Visual Engine
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none cursor-pointer"
              >
                <option value="pollinations-flux">🌟 Pollinations Flux.1 (100% Free - Zero Key)</option>
                <option value="sdxl-turbo">🌟 SDXL Turbo (100% Free)</option>
                <option value="imagen-3">💎 Google Imagen 3 (via Gemini Key)</option>
              </select>
            </div>

            {/* Voice Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Voice Language
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none cursor-pointer"
              >
                <option value="en-US">English (US) — Cinematic Dub</option>
                <option value="ja-JP">Japanese (JA) — Authentic Anime VA</option>
                <option value="ko-KR">Korean (KO) — Manhwa Webtoon VA</option>
                <option value="es-ES">Spanish (ES) — Neutral Dub</option>
                <option value="fr-FR">French (FR) — Studio Voice</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Complete Full-Story Guarantee</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !synopsis.trim()}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Launching AI Studio...</span>
                </>
              ) : (
                <>
                  <span>Create {totalChapters}-Chapter Series</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
