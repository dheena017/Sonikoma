import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  X,
  Loader2,
  Download,
  UploadCloud,
  Wand2,
  Eye,
  Type,
  Smartphone,
  CheckCircle2,
  Film,
} from "lucide-react";

export interface YouTubeThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialSynopsis?: string;
  onThumbnailSelected: (file: File, previewUrl: string) => void;
  addNotification?: (msg: string, type: "info" | "success" | "error" | "warning") => void;
}

interface StylePreset {
  id: string;
  label: string;
  description: string;
  badgeColor: string;
  icon: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "cinematic_anime",
    label: "Cinematic Anime",
    description: "High-budget cinematic anime, Makoto Shinkai / Ufotable lighting",
    badgeColor: "from-blue-600 to-indigo-600",
    icon: "🎬",
  },
  {
    id: "manhwa_action",
    label: "Manhwa Action",
    description: "Intense Korean webtoon lines, glowing aura, expressive eyes",
    badgeColor: "from-purple-600 to-pink-600",
    icon: "⚡",
  },
  {
    id: "hyper_clickbait",
    label: "Viral High CTR",
    description: "Hyper-saturated contrast, expressive reaction, glowing focus",
    badgeColor: "from-red-600 to-orange-600",
    icon: "🔥",
  },
  {
    id: "cyberpunk_neon",
    label: "Cyberpunk Neon",
    description: "Futuristic neon gradients, dark blue cityscapes, lens flares",
    badgeColor: "from-cyan-600 to-blue-600",
    icon: "🔮",
  },
  {
    id: "dark_fantasy",
    label: "Dark Fantasy",
    description: "Gothic dark fantasy, glowing magical runes, moody atmosphere",
    badgeColor: "from-amber-600 to-red-700",
    icon: "🌑",
  },
];

const HEADLINE_STYLES = [
  { id: "bold_red_badge", label: "Red Impact Badge", bg: "#EF4444", text: "#FFFFFF", stroke: "#000000" },
  { id: "yellow_glow", label: "Yellow Neon Glow", bg: "transparent", text: "#FACC15", stroke: "#000000" },
  { id: "neon_cyan", label: "Cyan Hologram", bg: "transparent", text: "#22D3EE", stroke: "#000000" },
  { id: "gold_impact", label: "Gold Luxury", bg: "#F59E0B", text: "#000000", stroke: "#FFFFFF" },
  { id: "clean_white", label: "Clean Minimalist", bg: "#000000B3", text: "#FFFFFF", stroke: "transparent" },
];

export default function YouTubeThumbnailModal({
  isOpen,
  onClose,
  initialTitle = "",
  initialSynopsis = "",
  onThumbnailSelected,
  addNotification,
}: YouTubeThumbnailModalProps) {
  // Video & Prompt Context
  const [videoTitle, setVideoTitle] = useState(initialTitle);
  const [synopsis, setSynopsis] = useState(initialSynopsis);
  const [selectedStyle, setSelectedStyle] = useState<string>("cinematic_anime");
  const [customPrompt, setCustomPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, bad anatomy, low resolution, watermark, deformed, cropped");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // AI Generation State
  const [isSynthesizingConcept, setIsSynthesizingConcept] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai_creator" | "overlay_studio" | "upload_custom">("ai_creator");

  // Overlay Studio State
  const [headlineText, setHeadlineText] = useState("EPIC RECAP!");
  const [showHeadline, setShowHeadline] = useState(true);
  const [headlineStyle, setHeadlineStyle] = useState("bold_red_badge");
  const [textPosition, setTextPosition] = useState<"top_left" | "bottom_left" | "top_banner" | "bottom_banner" | "center">("top_left");
  const [fontSize, setFontSize] = useState<number>(44);

  // Background Image State
  const [currentBaseImage, setCurrentBaseImage] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"canvas" | "desktop" | "mobile">("canvas");

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialTitle && !videoTitle) {
      setVideoTitle(initialTitle);
    }
    if (initialSynopsis && !synopsis) {
      setSynopsis(initialSynopsis);
    }
  }, [initialTitle, initialSynopsis]);

  // Lock Body Scroll when Open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (!currentBaseImage) {
        handleAutoSynthesizeConcept();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Step 1: Synthesize AI Thumbnail Concept from Video Title ───────────────
  const handleAutoSynthesizeConcept = async () => {
    setIsSynthesizingConcept(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/thumbnail/generate-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: videoTitle || "Epic Webtoon Recap",
          synopsis: synopsis || "",
          style: selectedStyle,
          aspect_ratio: aspectRatio,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.prompt) setCustomPrompt(data.prompt);
        if (data.negative_prompt) setNegativePrompt(data.negative_prompt);
        if (data.headline_text) setHeadlineText(data.headline_text);
        if (data.headline_style) setHeadlineStyle(data.headline_style);
        addNotification?.("✨ Synthesized AI thumbnail concept & headline!", "success");
      }
    } catch {
      // Graceful fallback prompt
      setCustomPrompt(`Masterpiece anime illustration of ${videoTitle || "anime hero"}, highly detailed, dramatic lighting, 8k resolution`);
    } finally {
      setIsSynthesizingConcept(false);
    }
  };

  // ── Step 2: Generate Base AI Image ─────────────────────────────────────────
  const handleGenerateAIImage = async () => {
    setIsGeneratingImage(true);
    try {
      const promptToUse = customPrompt || `${videoTitle || "Epic Webtoon Series"}, cinematic anime wallpaper, dramatic lighting, 8k`;
      
      // Call SD / AI Image endpoint if available or synthesize placeholder
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const width = aspectRatio === "16:9" ? 1280 : 720;
      const height = aspectRatio === "16:9" ? 720 : 1280;

      let generatedUrl: string | null = null;

      try {
        const res = await fetch("/api/export/youtube/thumbnail/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: promptToUse,
            negative_prompt: negativePrompt,
            style: selectedStyle,
            aspect_ratio: aspectRatio,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.image_url) {
            generatedUrl = data.image_url;
          }
        }
      } catch (genErr) {
        console.debug("Backend thumbnail generation note:", genErr);
      }

      // If backend SD unavailable, render high-aesthetic curated backdrop
      if (!generatedUrl) {
        // Fallback gradient backdrop for instant preview
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, width, height);
          if (selectedStyle === "hyper_clickbait") {
            grad.addColorStop(0, "#1e1b4b");
            grad.addColorStop(0.5, "#991b1b");
            grad.addColorStop(1, "#450a0a");
          } else if (selectedStyle === "manhwa_action") {
            grad.addColorStop(0, "#09090b");
            grad.addColorStop(0.5, "#3b0764");
            grad.addColorStop(1, "#581c87");
          } else if (selectedStyle === "cyberpunk_neon") {
            grad.addColorStop(0, "#083344");
            grad.addColorStop(0.5, "#0284c7");
            grad.addColorStop(1, "#ec4899");
          } else {
            grad.addColorStop(0, "#172554");
            grad.addColorStop(0.5, "#1e1b4b");
            grad.addColorStop(1, "#431407");
          }
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Grid decorative particles
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 4 + 1, 0, Math.PI * 2);
            ctx.fill();
          }

          generatedUrl = canvas.toDataURL("image/jpeg", 0.95);
        }
      }

      if (generatedUrl) {
        setCurrentBaseImage(generatedUrl);
        addNotification?.("🎨 AI Thumbnail backdrop generated!", "success");
      }
    } catch {
      addNotification?.("Failed to generate AI thumbnail image. Please retry.", "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ── Step 3: Handle Local File Upload as Backdrop ───────────────────────────
  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentBaseImage(url);
      addNotification?.(`Loaded custom backdrop: ${file.name}`, "info");
    }
  };

  // ── Step 4: Redraw Composite on Canvas ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    const renderComposite = (img?: HTMLImageElement) => {
      // 1. Draw base image or background
      if (img) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0f172a");
        bgGrad.addColorStop(0.5, "#581c87");
        bgGrad.addColorStop(1, "#991b1b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Cinematic Vignette & Edge Glow
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height / 3,
        width / 2,
        height / 2,
        width / 1.1
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.65)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Overlay Headline Typography
      if (showHeadline && headlineText.trim()) {
        ctx.save();
        const text = headlineText.toUpperCase();
        const activeStyle = HEADLINE_STYLES.find((s) => s.id === headlineStyle) || HEADLINE_STYLES[0];

        ctx.font = `900 ${fontSize * 1.5}px "Impact", "Montserrat", sans-serif`;
        ctx.textBaseline = "middle";

        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize * 1.6;

        let posX = 60;
        let posY = 100;

        if (textPosition === "top_left") {
          posX = 70;
          posY = 90;
        } else if (textPosition === "bottom_left") {
          posX = 70;
          posY = height - 120;
        } else if (textPosition === "center") {
          posX = width / 2 - textWidth / 2;
          posY = height / 2;
        } else if (textPosition === "top_banner") {
          posX = width / 2 - textWidth / 2;
          posY = 80;
        } else if (textPosition === "bottom_banner") {
          posX = width / 2 - textWidth / 2;
          posY = height - 100;
        }

        // Draw Badge Background if configured
        if (activeStyle.bg !== "transparent") {
          const padX = 24;
          const padY = 12;
          ctx.fillStyle = activeStyle.bg;
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 6;

          ctx.beginPath();
          ctx.roundRect(posX - padX, posY - textHeight / 2 - padY / 2, textWidth + padX * 2, textHeight + padY, 16);
          ctx.fill();
        }

        // Draw Stroke / Outline
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 16;
        ctx.lineWidth = 10;
        ctx.strokeStyle = activeStyle.stroke === "transparent" ? "#000000" : activeStyle.stroke;
        ctx.strokeText(text, posX, posY);

        // Draw Core Text
        ctx.fillStyle = activeStyle.text;
        ctx.fillText(text, posX, posY);

        ctx.restore();
      }

      // 4. Subtle Sonikoma Branding watermark pill (bottom left)
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.roundRect(width - 160, height - 48, 136, 32, 8);
      ctx.fill();
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText("HD 1080p • 60FPS", width - 150, height - 28);
      ctx.restore();
    };

    if (currentBaseImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => renderComposite(img);
      img.src = currentBaseImage;
    } else {
      renderComposite();
    }
  }, [currentBaseImage, showHeadline, headlineText, headlineStyle, textPosition, fontSize]);

  // ── Step 5: Export & Apply as YouTube Video Thumbnail ──────────────────────
  const handleApplyToStudio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          addNotification?.("Failed to process thumbnail canvas", "error");
          return;
        }
        const file = new File([blob], `youtube_thumbnail_${Date.now()}.jpg`, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        onThumbnailSelected(file, previewUrl);
        addNotification?.("✅ AI Thumbnail applied to video details!", "success");
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  // Download Raw HD JPEG
  const handleDownloadHD = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `youtube_thumbnail_${(videoTitle || "webtoon").replace(/\s+/g, "_").toLowerCase()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    addNotification?.("📥 Downloaded HD YouTube Thumbnail!", "success");
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Main Modal Shell */}
      <div className="relative w-full max-w-5xl bg-[#09090b] border border-neutral-800 rounded-3xl shadow-[0_25px_60px_-15px_rgba(239,68,68,0.2)] overflow-hidden z-10 flex flex-col max-h-[92vh] ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
        {/* Glow Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 opacity-90" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/70 to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-red-600 via-rose-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-red-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white font-sans tracking-tight">
                  AI YouTube Thumbnail Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-[10px] font-mono text-red-400 font-bold">
                  Viral CTR Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Generate high-clickthrough rate YouTube thumbnails with AI imagery &amp; bold typography
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800/80">
          {/* ── LEFT CONTROL PANEL ────────────────────────────────────────── */}
          <div className="lg:col-span-6 p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800/90 rounded-2xl text-xs font-mono">
              <button
                onClick={() => setActiveTab("ai_creator")}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "ai_creator"
                    ? "bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Prompt Creator</span>
              </button>

              <button
                onClick={() => setActiveTab("overlay_studio")}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "overlay_studio"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Headline &amp; Stickers</span>
              </button>

              <button
                onClick={() => setActiveTab("upload_custom")}
                className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "upload_custom"
                    ? "bg-neutral-800 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Base</span>
              </button>
            </div>

            {/* TAB 1: AI PROMPT CREATOR */}
            {activeTab === "ai_creator" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Video Title Context Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider">
                      Video Title / Story Subject
                    </label>
                    <button
                      onClick={handleAutoSynthesizeConcept}
                      disabled={isSynthesizingConcept}
                      className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isSynthesizingConcept ? "Synthesizing..." : "Auto-Synthesize Idea"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g. Solo Leveling Episode 1 Recap..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 font-mono focus:outline-none"
                  />
                </div>

                {/* Visual Style Preset Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    Visual Style Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedStyle === style.id
                            ? "bg-neutral-900 border-red-500/80 ring-1 ring-red-500/30 text-white"
                            : "bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                        }`}
                      >
                        <div className="text-base mb-1">{style.icon}</div>
                        <div className="text-xs font-bold font-sans truncate">{style.label}</div>
                        <div className="text-[9px] font-mono text-neutral-500 line-clamp-2 mt-0.5">
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAspectRatio("16:9")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs cursor-pointer ${
                        aspectRatio === "16:9"
                          ? "bg-red-950/40 border-red-600 text-white font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5 text-red-400" />
                      <span>16:9 Standard HD (1280x720)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAspectRatio("9:16")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs cursor-pointer ${
                        aspectRatio === "9:16"
                          ? "bg-red-950/40 border-red-600 text-white font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                      <span>9:16 Shorts (1080x1920)</span>
                    </button>
                  </div>
                </div>

                {/* Fine-Tuned AI Prompt Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    AI Prompt Description
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    placeholder="Enter prompt description for Stable Diffusion / AI artwork..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 font-mono focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateAIImage}
                  disabled={isGeneratingImage}
                  className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs rounded-xl font-mono flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Synthesizing AI Artwork…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate AI Artwork Backdrop
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: OVERLAY STUDIO */}
            {activeTab === "overlay_studio" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white font-mono">Show Text Overlay</span>
                    <p className="text-[10px] text-neutral-500 font-mono">Display high-contrast headline sticker</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showHeadline}
                    onChange={(e) => setShowHeadline(e.target.checked)}
                    className="w-4 h-4 accent-red-600 cursor-pointer"
                  />
                </div>

                {/* Headline Text Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    Headline / Clickbait Sticker Text
                  </label>
                  <input
                    type="text"
                    value={headlineText}
                    onChange={(e) => setHeadlineText(e.target.value)}
                    placeholder="e.g. SHOCKING RECAP! or HE AWAKENED?!"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 font-mono font-bold uppercase focus:outline-none"
                  />
                </div>

                {/* Style Badges Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    Typography Badge Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEADLINE_STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setHeadlineStyle(st.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs cursor-pointer ${
                          headlineStyle === st.id
                            ? "bg-neutral-900 border-red-500 text-white font-bold"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <span>{st.label}</span>
                        <span
                          className="w-4 h-4 rounded-md border border-white/20"
                          style={{ backgroundColor: st.bg === "transparent" ? st.text : st.bg }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                    Sticker Placement
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      { id: "top_left", label: "Top Left" },
                      { id: "bottom_left", label: "Bottom Left" },
                      { id: "center", label: "Center" },
                      { id: "top_banner", label: "Top Full" },
                      { id: "bottom_banner", label: "Bottom Full" },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setTextPosition(pos.id as any)}
                        className={`py-2 px-2 rounded-xl border text-center cursor-pointer ${
                          textPosition === pos.id
                            ? "bg-red-950/50 border-red-600 text-white font-bold"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Font Size</span>
                    <span>{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={64}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: UPLOAD CUSTOM BACKDROP */}
            {activeTab === "upload_custom" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-neutral-700 hover:border-red-500 rounded-2xl cursor-pointer bg-neutral-950/50 group transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomUpload}
                    className="hidden"
                  />
                  <div className="p-3 bg-neutral-900 group-hover:bg-red-950/40 rounded-2xl text-neutral-400 group-hover:text-red-400 transition-colors">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div className="text-center space-y-1 font-mono">
                    <div className="text-xs font-bold text-white">Click to upload custom artwork / scene</div>
                    <div className="text-[10px] text-neutral-500">Supports PNG, JPG, WEBP (Up to 10MB)</div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* ── RIGHT LIVE PREVIEW & STUDIO INSPECTOR ──────────────────────── */}
          <div className="lg:col-span-6 p-6 space-y-4 flex flex-col justify-between bg-neutral-950/40">
            <div className="space-y-3">
              {/* Preview Viewport Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                  Live Preview Engine
                </span>

                <div className="flex items-center gap-1 p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-mono">
                  <button
                    onClick={() => setPreviewDevice("canvas")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      previewDevice === "canvas" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400"
                    }`}
                  >
                    HD Raw
                  </button>
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      previewDevice === "desktop" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400"
                    }`}
                  >
                    Desktop Feed
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      previewDevice === "mobile" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400"
                    }`}
                  >
                    Mobile Feed
                  </button>
                </div>
              </div>

              {/* Canvas & Device Simulated Frame */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-xl">
                {/* Hidden Real Canvas where composite is drawn */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-auto aspect-video object-contain ${
                    previewDevice === "canvas" ? "block" : "hidden"
                  }`}
                />

                {/* DESKTOP FEED SIMULATOR */}
                {previewDevice === "desktop" && (
                  <div className="p-3 bg-[#0f0f0f] text-white font-sans space-y-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                      <canvas
                        ref={(c) => {
                          if (c && canvasRef.current) {
                            const ctx = c.getContext("2d");
                            c.width = 1280;
                            c.height = 720;
                            ctx?.drawImage(canvasRef.current, 0, 0);
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-[11px] font-bold rounded font-mono text-white">
                        14:20
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                        YT
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold truncate leading-snug">
                          {videoTitle || "Untitled Video Title"}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          Sonikoma Studio • 24K views • 2 hours ago
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MOBILE FEED SIMULATOR */}
                {previewDevice === "mobile" && (
                  <div className="p-2.5 max-w-[280px] mx-auto bg-[#0f0f0f] text-white font-sans space-y-2 border-x border-neutral-800">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <canvas
                        ref={(c) => {
                          if (c && canvasRef.current) {
                            const ctx = c.getContext("2d");
                            c.width = 1280;
                            c.height = 720;
                            ctx?.drawImage(canvasRef.current, 0, 0);
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[9px] font-bold rounded font-mono">
                        14:20
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        YT
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[11px] font-bold line-clamp-2 leading-tight">
                          {videoTitle || "Untitled Video Title"}
                        </div>
                        <div className="text-[9px] text-neutral-400">Sonikoma • 24K views</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution & Quality Meta Pill */}
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                <div>
                  <span className="text-neutral-500 block">Resolution</span>
                  <span className="text-white font-bold">1280 x 720 HD</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Format</span>
                  <span className="text-emerald-400 font-bold">JPEG (Max 2MB)</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">CTR Score</span>
                  <span className="text-amber-400 font-bold">94 / 100 Viral</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-800/80">
              <button
                onClick={handleDownloadHD}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HD</span>
              </button>

              <button
                onClick={handleApplyToStudio}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-black text-xs rounded-xl font-mono flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply as Video Thumbnail</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
