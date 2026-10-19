import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Layers,
  CheckCircle2,
  Trophy,
  Zap,
  RefreshCw,
  Sliders,
  Eye,
  Check,
  Flame,
  ArrowRight,
} from "lucide-react";
import { ThumbnailABVariant } from "../types/marketing";

interface ThumbnailABTestingStudioProps {
  onSelectWinningVariant?: (variant: ThumbnailABVariant) => void;
  onDeployRotation?: (variants: ThumbnailABVariant[]) => void;
  seriesTitle?: string;
}

const DEFAULT_VARIANTS: ThumbnailABVariant[] = [
  {
    id: "var-a",
    variantKey: "A",
    archetypeLabel: "Climax Shock / Action Climax",
    hookText: "HE UNLOCKED S-RANK?!",
    headline: "The Moment the S-Rank Sovereign Awoke",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop",
    predictedCtr: 94.8,
    viralTier: "S-Tier (Viral Surge)",
    contrastRatio: "14.2:1 (High Drama)",
    facialClarityScore: 98,
    isWinningPick: true,
  },
  {
    id: "var-b",
    variantKey: "B",
    archetypeLabel: "Monarch Mystery / Dark Intrigue",
    hookText: "FORBIDDEN SHADOW AWAKENING",
    headline: "The Ancient Shadow Monarch Protocol",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop",
    predictedCtr: 88.5,
    viralTier: "A-Tier (High Engagement)",
    contrastRatio: "11.8:1 (Deep Neon)",
    facialClarityScore: 89,
    isWinningPick: false,
  },
  {
    id: "var-c",
    variantKey: "C",
    archetypeLabel: "Emotional Peak / Guild Betrayal",
    hookText: "NEVER ANGER THE S-RANK",
    headline: "The Brutal Betrayal at Gate 7",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop",
    predictedCtr: 81.2,
    viralTier: "B-Tier (Solid Baseline)",
    contrastRatio: "9.5:1 (High Contrast)",
    facialClarityScore: 84,
    isWinningPick: false,
  },
];

export const ThumbnailABTestingStudio: React.FC<ThumbnailABTestingStudioProps> = ({
  onSelectWinningVariant,
  onDeployRotation,
  seriesTitle = "Marriage of Convenience",
}) => {
  const [variants, setVariants] = useState<ThumbnailABVariant[]>(DEFAULT_VARIANTS);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("var-a");
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [rotationActive, setRotationActive] = useState<boolean>(false);

  const handleSelectWinner = (variant: ThumbnailABVariant) => {
    setSelectedVariantId(variant.id);
    onSelectWinningVariant?.(variant);
  };

  const handleStartRotation = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIsRotating(false);
      setRotationActive(true);
      onDeployRotation?.(variants);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-[#3B82F6] border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-tight">
              AI Thumbnail A/B Testing &amp; CTR Prediction
            </h2>
          </div>
          <p className="text-xs text-neutral-300">
            Generate 3 distinct visual variants with catchy text hooks and predictive Click-Through-Rate (CTR) analytics to maximize audience viewership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>AI Neural Vision Scorer Active</span>
          </span>
        </div>
      </div>

      {/* ── 3 Visual Variants Comparison Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {variants.map((v) => {
          const isSelected = selectedVariantId === v.id;

          return (
            <div
              key={v.id}
              className={`rounded-2xl border p-4 bg-[#141414] transition-all flex flex-col justify-between relative ${
                isSelected
                  ? "border-[#3B82F6] shadow-xl shadow-blue-500/15 bg-[#171A24]"
                  : "border-[#282828] hover:border-[#383838]"
              }`}
            >
              {/* Card Header & Winner Tag */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center font-mono font-bold text-xs text-white">
                    {v.variantKey}
                  </span>
                  <span className="text-xs font-bold text-[#E5E5E5]">{v.archetypeLabel}</span>
                </div>

                {v.isWinningPick && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    Top Pick
                  </span>
                )}
              </div>

              {/* Thumbnail Image Preview with Text Hook Overlay */}
              <div className="py-3.5">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#303030] shadow-inner group">
                  <img
                    src={v.imageUrl}
                    alt={v.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Catchy Visual Text Hook Badge Over Image */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-white/20 text-white font-black text-[11px] tracking-wider uppercase font-mono shadow-lg">
                    {v.hookText}
                  </div>

                  {/* CTR Score Gauge Overlay */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#0F1420]/90 backdrop-blur-md border border-blue-500/40 text-blue-300 font-mono font-bold text-xs shadow-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{v.predictedCtr}% CTR</span>
                  </div>
                </div>

                <div className="mt-3 text-xs font-bold text-white leading-snug line-clamp-2">
                  "{v.headline}"
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="space-y-2 py-2 border-t border-[#222] text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Viral Potential</span>
                  <span className="text-emerald-400 font-bold">{v.viralTier}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Contrast Ratio</span>
                  <span className="text-neutral-200">{v.contrastRatio}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Facial Emotion Clarity</span>
                  <span className="text-blue-400">{v.facialClarityScore}/100</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => handleSelectWinner(v)}
                  className={`w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "bg-[#3B82F6] text-white shadow-md shadow-blue-500/30"
                      : "bg-[#202020] hover:bg-[#282828] text-neutral-300 border border-[#303030]"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Selected Primary</span>
                    </>
                  ) : (
                    <span>Choose Variant {v.variantKey}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Rotation & Deployment Controls ── */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#282828] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3B82F6]" />
            <span>Algorithmic A/B Rotation Deployment</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Automatically cycles the 3 thumbnail variants every 3 hours on YouTube &amp; social platforms. Automatically locks the highest performing variant after 24 hours.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartRotation}
          disabled={isRotating}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-mono text-xs font-bold tracking-wide uppercase transition-all cursor-pointer shadow-lg shadow-blue-500/25 shrink-0 active:scale-95"
        >
          {isRotating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Deploying Rotation...</span>
            </>
          ) : rotationActive ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>A/B Rotation Live</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Deploy 3-Way A/B Test</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ThumbnailABTestingStudio;
