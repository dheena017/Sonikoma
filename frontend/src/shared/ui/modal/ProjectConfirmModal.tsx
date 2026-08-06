import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronRight,
  Video,
  Monitor,
  Smartphone,
  Crop,
  Layers,
  Globe,
  FolderTree,
  Upload,
  Download,
  BookOpen,
  Hash,
  FileText,
  Tags,
  User,
  Image as ImageIcon,
  AlignLeft,
  Sparkles,
  CheckCircle,
  Loader2,
  Wand2,
  Mic,
  Music,
  Eye,
  Save,
} from "lucide-react";

interface ProjectConfirmModalProps {
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

      targetLayout: string;
      narrationTone: string;
      cropSensitivity: string;
      splitTallStrips: boolean;
      ageRating: string;
      primaryLanguage: string;
      subtitleLanguage: string;
      customTags: string[];
      workspaceFolder: string;
      episodePrefix: string;
      localCoverImage: string | null;
      aiTasks: {
        generateScript: boolean;
        generateVoice: boolean;
        generateSFX: boolean;
      };
    },
    shouldGenerate: boolean
  ) => Promise<boolean>;
  onAutoExtractCover?: () => Promise<string | null>;
  initialDetails: {
    seriesTitle: string;
    chapterNumber: string;
    chapterTitle: string;
    scrapedGenre: string;
    seriesAuthor: string;
    seriesCoverImage: string;
    seriesSynopsis: string;
    status?: string;
  };
}

export default function ProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onAutoExtractCover,
  initialDetails,
}: ProjectConfirmModalProps) {
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
  const [isSaving, setIsSaving] = useState(false);

  // New Configuration States
  const [targetLayout, setTargetLayout] = useState("9:16");
  const [narrationTone, setNarrationTone] = useState("Dramatic");
  const [cropSensitivity, setCropSensitivity] = useState("Balanced");
  const [splitTallStrips, setSplitTallStrips] = useState(true);
  const [ageRating, setAgeRating] = useState("All Ages");
  const [primaryLanguage, setPrimaryLanguage] = useState("English");
  const [subtitleLanguage, setSubtitleLanguage] = useState("None");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [workspaceFolder, setWorkspaceFolder] = useState("");
  const [episodePrefix, setEpisodePrefix] = useState("");
  const [localCoverImage, setLocalCoverImage] = useState<string | null>(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);

  // Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    media: true,
    video: false,
    processing: false,
    audience: false,
    organization: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
      setProjectStatus(initialDetails.status || "Draft");
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

  const handleConfirm = async (shouldGenerate: boolean) => {
    setIsSaving(true);
    try {
      const success = await onConfirm(
        {
          seriesTitle: seriesTitle.trim(),
          chapterNumber: chapterNumber.trim(),
          chapterTitle: chapterTitle.trim(),
          scrapedGenre: scrapedGenre.trim(),
          seriesAuthor: seriesAuthor.trim(),
          seriesCoverImage: seriesCoverImage.trim(),
          seriesSynopsis: seriesSynopsis.trim(),
          status: projectStatus,
          targetLayout,
          narrationTone,
          cropSensitivity,
          splitTallStrips,
          ageRating,
          primaryLanguage,
          subtitleLanguage,
          customTags,
          workspaceFolder: workspaceFolder.trim(),
          episodePrefix: episodePrefix.trim(),
          localCoverImage,
          aiTasks,
        },
        shouldGenerate
      );
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = (task: keyof typeof aiTasks) => {
    setAiTasks((prev) => ({ ...prev, [task]: !prev[task] }));
  };


  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !customTags.includes(val)) {
        setCustomTags([...customTags, val.startsWith("#") ? val : `#${val}`]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCoverImage(reader.result as string);
        setSeriesCoverImage(""); // Clear URL if local file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoExtract = async () => {
    if (onAutoExtractCover) {
      setIsExtractingCover(true);
      try {
        const url = await onAutoExtractCover();
        if (url) {
          setSeriesCoverImage(url);
          setLocalCoverImage(null);
        }
      } finally {
        setIsExtractingCover(false);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex project-confirm-modal-overlay" data-modal="true">
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('core')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" />
                1. Core Metadata
              </div>
              {openSections.core ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.core && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

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
            )}
          </div>



          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('media')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                2. Media & Details
              </div>
              {openSections.media ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.media && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

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

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                Cover Image
              </label>

              <div className="flex gap-4 items-start flex-col sm:flex-row">
                <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-neutral-800 bg-[#0a0a0e] flex items-center justify-center relative group">
                  {(localCoverImage || seriesCoverImage) ? (
                    <>
                      <img
                        src={localCoverImage || seriesCoverImage}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      {isExtractingCover && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-700">
                      {isExtractingCover ? (
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      ) : (
                        <ImageIcon className="h-6 w-6" />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={seriesCoverImage}
                      onChange={(e) => {
                         setSeriesCoverImage(e.target.value);
                         if (e.target.value) setLocalCoverImage(null);
                      }}
                      placeholder="Image URL (e.g. https://.../cover.jpg)"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl cursor-pointer transition-colors text-sm text-neutral-300">
                      <Upload className="h-4 w-4 text-purple-400" />
                      <span>Upload Local</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {onAutoExtractCover && (
                      <button
                        type="button"
                        onClick={handleAutoExtract}
                        disabled={isExtractingCover}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExtractingCover ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>Auto-Extract</span>
                      </button>
                    )}
                  </div>
                </div>
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
            )}
          </div>



          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('video')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-400" />
                3. Video & Layout
              </div>
              {openSections.video ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.video && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Target Layout
                </label>
                <select
                  value={targetLayout}
                  onChange={(e) => setTargetLayout(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                >
                  <option value="9:16">📱 Vertical Shorts (9:16)</option>
                  <option value="16:9">🎬 Landscape Video (16:9)</option>
                  <option value="1:1">⏹️ Square Post (1:1)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Narration Tone
                </label>
                <select
                  value={narrationTone}
                  onChange={(e) => setNarrationTone(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                >
                  <option value="Dramatic">Dramatic / Cinematic</option>
                  <option value="Dialogue-focused">Dialogue-focused</option>
                  <option value="Action-paced">Action-paced</option>
                  <option value="Minimalistic">Minimalistic</option>
                </select>
              </div>
            </div>

              </div>
            )}
          </div>



          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('processing')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Crop className="h-4 w-4 text-purple-400" />
                4. Panel Processing
              </div>
              {openSections.processing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.processing && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Crop Sensitivity
                </label>
                <select
                  value={cropSensitivity}
                  onChange={(e) => setCropSensitivity(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                >
                  <option value="Conservative">Conservative (Preserve full panels)</option>
                  <option value="Balanced">Balanced (Recommended)</option>
                  <option value="Aggressive">Aggressive (Tight on speech bubbles)</option>
                </select>
              </div>
              <div className="space-y-1.5 flex flex-col justify-center pt-5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={splitTallStrips}
                      onChange={(e) => setSplitTallStrips(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${splitTallStrips ? 'bg-purple-500' : 'bg-neutral-800'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${splitTallStrips ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm text-neutral-300">Auto-split long tall strips</span>
                </label>
              </div>
            </div>

              </div>
            )}
          </div>



          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('audience')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-400" />
                5. Tags & Audience
              </div>
              {openSections.audience ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.audience && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Age Rating
                </label>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="Teen (13+)">Teen (13+)</option>
                  <option value="Mature (18+)">Mature (18+)</option>
                  <option value="Action Violence">Action Violence</option>
                  <option value="Flash Warning">Flash Warning</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Languages (Primary / Subtitles)
                </label>
                <div className="flex gap-2">
                   <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-1/2 bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Korean">Korean</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                  <select
                    value={subtitleLanguage}
                    onChange={(e) => setSubtitleLanguage(e.target.value)}
                    className="w-1/2 bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="English">English</option>
                    <option value="Korean">Korean</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Custom Tags (Press Enter)
                </label>
                <div className="w-full bg-[#0a0a0e] border border-neutral-800 focus-within:border-purple-500 rounded-xl px-3 py-2 flex flex-wrap gap-2 transition-colors shadow-inner min-h-[46px] items-center">
                  {customTags.map((tag) => (
                    <span key={tag} className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-purple-500/30">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={customTags.length === 0 ? "e.g. #manhwa, #action" : ""}
                    className="bg-transparent border-none outline-none text-sm text-neutral-200 flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            </div>

              </div>
            )}
          </div>



          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection('organization')}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-purple-400" />
                6. Workspace & Organization
              </div>
              {openSections.organization ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.organization && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Folder / Series Grouping
                </label>
                <input
                  type="text"
                  value={workspaceFolder}
                  onChange={(e) => setWorkspaceFolder(e.target.value)}
                  placeholder="e.g. Season 1, Action Recaps"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  Episode Numbering Prefix
                </label>
                <input
                  type="text"
                  value={episodePrefix}
                  onChange={(e) => setEpisodePrefix(e.target.value)}
                  placeholder="e.g. EP {num} • S1"
                  className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors font-mono shadow-inner"
                />
              </div>
            </div>

              </div>
            )}
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
            disabled={!seriesTitle.trim() || isSaving}
            className="px-5 py-3 sm:py-2.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 hover:border-neutral-600 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-purple-400" />
                <span>Save</span>
              </>
            )}
          </button>

        </div>
      </div>
    </div>,
    document.body
  );
}
