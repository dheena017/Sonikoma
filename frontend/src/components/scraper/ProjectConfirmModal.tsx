import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookOpen,
  Hash,
  FileText,
  Tags,
  User,
  Image as ImageIcon,
  AlignLeft,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface ProjectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: {
    seriesTitle: string;
    chapterNumber: string;
    chapterTitle: string;
    scrapedGenre: string;
    seriesAuthor: string;
    seriesCoverImage: string;
    seriesSynopsis: string;
  }) => void;
  initialDetails: {
    seriesTitle: string;
    chapterNumber: string;
    chapterTitle: string;
    scrapedGenre: string;
    seriesAuthor: string;
    seriesCoverImage: string;
    seriesSynopsis: string;
  };
}

export default function ProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  initialDetails,
}: ProjectConfirmModalProps) {
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [scrapedGenre, setScrapedGenre] = useState("");
  const [seriesAuthor, setSeriesAuthor] = useState("");
  const [seriesCoverImage, setSeriesCoverImage] = useState("");
  const [seriesSynopsis, setSeriesSynopsis] = useState("");

  // Sync when initialDetails updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setSeriesTitle(initialDetails.seriesTitle || "");
      setChapterNumber(initialDetails.chapterNumber || "");
      setChapterTitle(initialDetails.chapterTitle || "");
      setScrapedGenre(initialDetails.scrapedGenre || "");
      setSeriesAuthor(initialDetails.seriesAuthor || "");
      setSeriesCoverImage(initialDetails.seriesCoverImage || "");
      setSeriesSynopsis(initialDetails.seriesSynopsis || "");
    }
  }, [isOpen, initialDetails]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      seriesTitle: seriesTitle.trim(),
      chapterNumber: chapterNumber.trim(),
      chapterTitle: chapterTitle.trim(),
      scrapedGenre: scrapedGenre.trim(),
      seriesAuthor: seriesAuthor.trim(),
      seriesCoverImage: seriesCoverImage.trim(),
      seriesSynopsis: seriesSynopsis.trim(),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Confirm Project Details
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono">
                Verify meta properties before initial sync and asset download
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-450 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          <div className="bg-purple-950/10 border border-purple-800/20 rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
              Creating a project stores the chapter metadata and downloaded
              panel assets in your workspace. You can refine narration scripts
              and manage storyboard frames below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-purple-400" />
                Series / Comic Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                placeholder="e.g. Boundless Necromancer"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors"
                required
              />
            </div>

            {/* Chapter Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <Hash className="h-3 w-3 text-purple-400" />
                Chapter / Episode No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="e.g. 72"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors font-mono"
                required
              />
            </div>

            {/* Chapter Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <FileText className="h-3 w-3 text-purple-400" />
                Chapter Title (Optional)
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. The S-Rank Awakens"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors"
              />
            </div>

            {/* Genre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <Tags className="h-3 w-3 text-purple-400" />
                Genre
              </label>
              <input
                type="text"
                value={scrapedGenre}
                onChange={(e) => setScrapedGenre(e.target.value)}
                placeholder="e.g. Fantasy Action"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors"
              />
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <User className="h-3 w-3 text-purple-400" />
                Author / Artist
              </label>
              <input
                type="text"
                value={seriesAuthor}
                onChange={(e) => setSeriesAuthor(e.target.value)}
                placeholder="e.g. Chugong, DUBU"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <ImageIcon className="h-3 w-3 text-purple-400" />
                Cover Image URL (Optional)
              </label>
              <input
                type="text"
                value={seriesCoverImage}
                onChange={(e) => setSeriesCoverImage(e.target.value)}
                placeholder="e.g. https://example.com/cover.jpg"
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors"
              />
            </div>

            {/* Synopsis */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                <AlignLeft className="h-3 w-3 text-purple-400" />
                Synopsis / Series Description (Optional)
              </label>
              <textarea
                value={seriesSynopsis}
                onChange={(e) => setSeriesSynopsis(e.target.value)}
                placeholder="Brief summary of the series storyline..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-850 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors resize-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!seriesTitle.trim() || !chapterNumber.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Confirm & Create Project</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
