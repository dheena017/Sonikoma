import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  ArrowRight,
  Wand2,
  Mic,
  Film,
  CheckCircle2,
  Zap,
  Play,
  Flame,
  Layers,
  Volume2,
} from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface WelcomeUserModalProps {
  username?: string;
  title?: string;
  message?: string;
  isOpen?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  onSelectTemplate?: (templateId: string) => void;
}

const STARTER_TEMPLATES = [
  {
    id: "action",
    title: "Solo Hunter Action",
    genre: "Shonen / Dungeon",
    badge: "Most Popular",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    image: "/demo-action-hero.jpg",
    description: "High-intensity lightning auras & impact punch zoom",
  },
  {
    id: "fantasy",
    title: "Celestial Sorcery",
    genre: "Fantasy / Magic",
    badge: "Trending",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/30",
    image: "/voice-lyra.jpg",
    description: "Ornate spell incantations & cinematic palace reveals",
  },
  {
    id: "cyberpunk",
    title: "Neon Rain Katana",
    genre: "Sci-Fi / Action",
    badge: "Dialogue Heavy",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    image: "/demo-cyberpunk.jpg",
    description: "Rapid dialogue cuts & synthwave rainy atmosphere",
  },
];

export function WelcomeUserModal({
  username,
  title = username ? `Welcome, ${username}!` : "Welcome to Sonikoma Studio!",
  message = "Transform static comics and webtoon panels into broadcast-ready animated videos with synchronized AI voice acting and camera motion.",
  isOpen = true,
  onConfirm,
  onCancel,
  confirmText = "Enter Studio",
  cancelText = "Skip",
  onSelectTemplate,
}: WelcomeUserModalProps) {
  const isExecutingRef = useRef(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("action");

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    try {
      if (onSelectTemplate) {
        onSelectTemplate(selectedTemplate);
      }
      onConfirm();
    } finally {
      setTimeout(() => {
        isExecutingRef.current = false;
      }, 300);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 selection:bg-purple-500/30 font-sans"
      data-modal="true"
    >
      {/* Backdrop blur overlay */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel || onConfirm}
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top accent glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 blur-[1px] z-30" />

        {/* HERO IMAGE BANNER HEADER */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 border-b border-white/10 select-none">
          <img
            src="/landing-anime-hero.png"
            alt="Sonikoma Studio Hero Art"
            className="w-full h-full object-cover object-center filter brightness-90 transform scale-105"
          />

          {/* Cinematic Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-neutral-950/70" />

          {/* Close button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-3.5 right-3.5 z-20 text-neutral-400 hover:text-white bg-black/60 hover:bg-black/90 border border-white/10 p-2 rounded-full transition-all cursor-pointer backdrop-blur-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header Content Overlay */}
          <div className="absolute bottom-4 left-5 right-5 sm:left-6 sm:right-6 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/90 px-2.5 py-0.5 rounded-full border border-cyan-500/40 flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AI Webtoon Studio v2.4
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                60 FPS Video Engine
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {title}
            </h2>
            <p className="text-xs text-neutral-300 font-medium max-w-xl line-clamp-1 mt-0.5">
              {message}
            </p>
          </div>
        </div>

        {/* SCROLLABLE MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-left">
          {/* CORE STUDIO CAPABILITIES (3 VISUAL CARDS WITH IMAGES) */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              What You Can Create Today
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Feature 1: Slicing & Clean Inpainting */}
              <div className="p-2.5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-purple-500/30 transition-all flex sm:flex-col gap-3 group">
                <div className="relative w-20 h-20 sm:w-full sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <img
                    src="/motion-scroll-dungeon.jpg"
                    alt="AI Panel Slicing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 text-[8px] font-mono font-bold text-purple-300 bg-black/70 px-1.5 py-0.5 rounded border border-purple-500/30">
                    Vision OCR
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-purple-400 shrink-0" />
                    Auto Inpainting
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                    Cleans speech bubbles and extracts individual panels seamlessly.
                  </p>
                </div>
              </div>

              {/* Feature 2: Neural Voice Studio */}
              <div className="p-2.5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-blue-500/30 transition-all flex sm:flex-col gap-3 group">
                <div className="relative w-20 h-20 sm:w-full sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <img
                    src="/voice-lyra.jpg"
                    alt="Neural Voice Studio"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 text-[8px] font-mono font-bold text-blue-300 bg-black/70 px-1.5 py-0.5 rounded border border-blue-500/30">
                    120+ Voices
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <Mic className="w-3 h-3 text-blue-400 shrink-0" />
                    Character Voices
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                    Assign multi-speaker voice actors and cinematic emotions.
                  </p>
                </div>
              </div>

              {/* Feature 3: Kinetic Motion Engine */}
              <div className="p-2.5 rounded-2xl bg-neutral-900/60 border border-white/10 hover:border-cyan-500/30 transition-all flex sm:flex-col gap-3 group">
                <div className="relative w-20 h-20 sm:w-full sm:h-24 rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <img
                    src="/motion-punch-clash.jpg"
                    alt="Kinetic Motion Engine"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1.5 text-[8px] font-mono font-bold text-cyan-300 bg-black/70 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Dynamic Cam
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1">
                    <Film className="w-3 h-3 text-cyan-400 shrink-0" />
                    Camera Punch
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                    Applies tilts, zooms, and screen rumble synced to sound effects.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STARTER PRESETS SELECTOR */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                Pick a Starter Template
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Click to select
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STARTER_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`relative p-2 rounded-2xl text-left transition-all border cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10"
                        : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/70"
                    }`}
                  >
                    {/* Template Image Header */}
                    <div className="relative w-full h-20 rounded-xl overflow-hidden mb-2">
                      <img
                        src={tmpl.image}
                        alt={tmpl.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span
                        className={`absolute top-1.5 right-1.5 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${tmpl.badgeColor}`}
                      >
                        {tmpl.badge}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 bg-purple-600 text-white p-0.5 rounded-full shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 px-0.5">
                      <div className="text-[11px] font-bold text-white leading-tight">
                        {tmpl.title}
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-snug line-clamp-1">
                        {tmpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STUDIO QUICK METRICS STRIP */}
          <div className="p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400 flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Zap className="w-3 h-3 text-amber-400" />
              Auto Subtitles
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              Impact SFX Library
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Film className="w-3 h-3 text-purple-400" />
              9:16 Shorts & 16:9 4K
            </span>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-neutral-950/80 border-t border-neutral-850 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-neutral-500 font-mono hidden sm:block">
            Press Esc or click Skip to bypass
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirmClick}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{confirmText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default WelcomeUserModal;
