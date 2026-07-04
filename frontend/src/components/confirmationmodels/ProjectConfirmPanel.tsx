import React, { useEffect, useState } from "react";
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
  Save,
  Wand2,
  Mic,
  Music,
  Eye,
} from "lucide-react";

interface ProjectConfirmPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    details: {
      seriesTitle: string;
      chapterNumber: string;
      chapterTitle: string;
      scrapedGenre: string;
      seriesAuthor: string;
      seriesCoverImage: string;
      seriesSynopsis: string;
      status: string;
      aiTasks: {
        generateScript: boolean;
        generateVoice: boolean;
        generateSFX: boolean;
      };
    },
    shouldGenerate: boolean
  ) => void;
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

export default function ProjectConfirmPanel({
  isOpen,
  onClose,
  onConfirm,
  initialDetails,
}: ProjectConfirmPanelProps) {
  // Existing State
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [scrapedGenre, setScrapedGenre] = useState("");
  const [seriesAuthor, setSeriesAuthor] = useState("");
  const [seriesCoverImage, setSeriesCoverImage] = useState("");
  const [seriesSynopsis, setSeriesSynopsis] = useState("");

  // New Premium State Additions
  const [projectStatus, setProjectStatus] = useState("Draft");
  const [aiTasks, setAiTasks] = useState({
    generateScript: true,
    generateVoice: true,
    generateSFX: false,
  });

  // Sync when initialDetails updates or panel opens
  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (isOpen) {
      setSeriesTitle(initialDetails.seriesTitle || "");
      setChapterNumber(initialDetails.chapterNumber || "");
      setChapterTitle(initialDetails.chapterTitle || "");
      setScrapedGenre(initialDetails.scrapedGenre || "");
      setSeriesAuthor(initialDetails.seriesAuthor || "");
      setSeriesCoverImage(initialDetails.seriesCoverImage || "");
      setSeriesSynopsis(initialDetails.seriesSynopsis || "");
      document.body.style.overflow = "hidden";
      if (container) container.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (container) container.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      if (container) container.style.overflow = "unset";
    };
  }, [isOpen, initialDetails]);

  if (!isOpen) return null;

  const handleConfirm = (shouldGenerate: boolean) => {
    onConfirm(
      {
        seriesTitle: seriesTitle.trim(),
        chapterNumber: chapterNumber.trim(),
        chapterTitle: chapterTitle.trim(),
        scrapedGenre: scrapedGenre.trim(),
        seriesAuthor: seriesAuthor.trim(),
        seriesCoverImage: seriesCoverImage.trim(),
        seriesSynopsis: seriesSynopsis.trim(),
        status: projectStatus,
        aiTasks,
      },
      shouldGenerate
    );
  };

  const toggleTask = (task: keyof typeof aiTasks) => {
    setAiTasks((prev) => ({ ...prev, [task]: !prev[task] }));
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Side Panel Container */}
      <div className="relative ml-auto h-full w-full max-w-xl bg-neutral-900 border-l border-neutral-800 rounded-l-3xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-right-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col">
        {/* Premium Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-850 shrink-0 bg-neutral-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Project Initialization
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wide mt-0.5">
                Verify metadata & select AI generation targets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-450 hover:text-white bg-neutral-950/40 border border-neutral-800 hover:bg-neutral-800 p-2 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 space-y-8 overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] font-mono border-b border-neutral-850 pb-2">
              1. Core Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                  Series Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="e.g. Boundless Necromancer"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-purple-400" />
                  Chapter No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors font-mono shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-purple-400" />
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g. The S-Rank Awakens"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Tags className="h-3.5 w-3.5 text-purple-400" />
                  Genre
                </label>
                <input
                  type="text"
                  value={scrapedGenre}
                  onChange={(e) => setScrapedGenre(e.target.value)}
                  placeholder="e.g. Fantasy, Action"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-purple-400" />
                  Author / Artist
                </label>
                <input
                  type="text"
                  value={seriesAuthor}
                  onChange={(e) => setSeriesAuthor(e.target.value)}
                  placeholder="e.g. Chugong, DUBU"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Media & Extra */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] font-mono border-b border-neutral-850 pb-2">
              2. Media & Details
            </h3>
            
            {/* Project Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                Project Visibility
              </label>
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
              >
                <option value="Draft">Private Draft</option>
                <option value="Review">Ready for Review</option>
                <option value="Published">Published (Public)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                Cover Image URL
              </label>
              <div className="flex gap-3 items-center">
                {/* Live Image Preview */}
                {seriesCoverImage ? (
                  <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden border border-neutral-800 bg-[#0a0a0e]">
                    <img 
                      src={seriesCoverImage} 
                      alt="Cover Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-16 shrink-0 rounded-lg border border-dashed border-neutral-800 bg-[#0a0a0e] flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-neutral-700" />
                  </div>
                )}
                <input
                  type="text"
                  value={seriesCoverImage}
                  onChange={(e) => setSeriesCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <AlignLeft className="h-3.5 w-3.5 text-purple-400" />
                Synopsis / Description
              </label>
              <textarea
                value={seriesSynopsis}
                onChange={(e) => setSeriesSynopsis(e.target.value)}
                placeholder="Brief summary of the series storyline..."
                rows={3}
                className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Section 3: AI Generation Targets */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] font-mono border-b border-neutral-850 pb-2">
              3. Initial AI Generation Targets
            </h3>
            <p className="text-xs text-neutral-400">
              Select which AI tasks should run automatically if you click "Save & Generate All" below.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Task: Script */}
              <button
                type="button"
                onClick={() => toggleTask("generateScript")}
                className={`p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  aiTasks.generateScript 
                    ? "bg-purple-600/10 border-purple-500/40 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)]" 
                    : "bg-[#0a0a0e] border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Wand2 className={`h-4 w-4 ${aiTasks.generateScript ? "text-purple-400" : "text-neutral-500"}`} />
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${aiTasks.generateScript ? "bg-purple-500 border-purple-400" : "border-neutral-700"}`}>
                    {aiTasks.generateScript && <CheckCircle className="h-2 w-2 text-white" />}
                  </div>
                </div>
                <h4 className={`text-xs font-bold ${aiTasks.generateScript ? "text-purple-200" : "text-neutral-400"}`}>Extract Scripts</h4>
              </button>

              {/* Task: Voice */}
              <button
                type="button"
                onClick={() => toggleTask("generateVoice")}
                className={`p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  aiTasks.generateVoice 
                    ? "bg-purple-600/10 border-purple-500/40 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)]" 
                    : "bg-[#0a0a0e] border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Mic className={`h-4 w-4 ${aiTasks.generateVoice ? "text-purple-400" : "text-neutral-500"}`} />
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${aiTasks.generateVoice ? "bg-purple-500 border-purple-400" : "border-neutral-700"}`}>
                    {aiTasks.generateVoice && <CheckCircle className="h-2 w-2 text-white" />}
                  </div>
                </div>
                <h4 className={`text-xs font-bold ${aiTasks.generateVoice ? "text-purple-200" : "text-neutral-400"}`}>Synthesize TTS</h4>
              </button>

              {/* Task: SFX */}
              <button
                type="button"
                onClick={() => toggleTask("generateSFX")}
                className={`p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  aiTasks.generateSFX 
                    ? "bg-purple-600/10 border-purple-500/40 shadow-[inset_0_0_12px_rgba(168,85,247,0.1)]" 
                    : "bg-[#0a0a0e] border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Music className={`h-4 w-4 ${aiTasks.generateSFX ? "text-purple-400" : "text-neutral-500"}`} />
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${aiTasks.generateSFX ? "bg-purple-500 border-purple-400" : "border-neutral-700"}`}>
                    {aiTasks.generateSFX && <CheckCircle className="h-2 w-2 text-white" />}
                  </div>
                </div>
                <h4 className={`text-xs font-bold ${aiTasks.generateSFX ? "text-purple-200" : "text-neutral-400"}`}>Map Audio/SFX</h4>
              </button>
            </div>
          </div>

        </div>

        {/* Premium Footer Actions */}
        <div className="px-6 py-5 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-850 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 sm:py-2.5 bg-[#0a0a0e] hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800 text-center"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={() => handleConfirm(false)}
            disabled={!seriesTitle.trim() || !chapterNumber.trim()}
            className="px-5 py-3 sm:py-2.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 hover:border-neutral-600 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-3.5 w-3.5 text-purple-400" />
            <span>Save Details Only</span>
          </button>

          <button
            type="button"
            onClick={() => handleConfirm(true)}
            disabled={!seriesTitle.trim() || !chapterNumber.trim()}
            className="px-6 py-3 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_4px_14px_rgba(168,85,247,0.3)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer border border-purple-500/30"
          >
            <Sparkles className="h-4 w-4" />
            <span>Save & Generate All</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
