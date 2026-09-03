import React, { useState } from "react";
import {
  Zap,
  Sparkles,
  Gift,
  Check,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export interface HeaderCreditsPopoverProps {
  credits: number;
  hasClaimedToday?: boolean;
  streakDays?: number;
  onClaimDaily?: () => Promise<void>;
  onNavigateToBilling?: () => void;
  onClose?: () => void;
}

export const HeaderCreditsPopover: React.FC<HeaderCreditsPopoverProps> = ({
  credits,
  hasClaimedToday = false,
  streakDays = 1,
  onClaimDaily,
  onNavigateToBilling,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleClaim = async () => {
    if (hasClaimedToday || isClaiming || !onClaimDaily) return;
    setIsClaiming(true);
    try {
      await onClaimDaily();
      setClaimSuccess(true);
    } catch (e) {
      console.error("Failed to claim daily bonus", e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="w-80 bg-neutral-955/95 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl p-4 text-white font-sans z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              AI Credit Balance
            </div>
            <div className="text-xl font-black text-amber-300 font-mono flex items-baseline gap-1">
              {credits.toLocaleString()}
              <span className="text-xs font-normal text-neutral-400">
                Credits
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onNavigateToBilling}
          className="text-xs font-semibold px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-955 font-bold rounded-lg transition-all shadow-md hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
        >
          Top Up
        </button>
      </div>

      {/* Daily Claim Box */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3 mb-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg text-[#3B82F6]">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-200">
                Daily Login Reward
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400 inline" />
                Streak:{" "}
                <span className="text-[#3B82F6] font-mono font-bold">
                  {streakDays} Day{streakDays > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={hasClaimedToday || isClaiming || claimSuccess}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              hasClaimedToday || claimSuccess
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
                : "bg-[#2A2A2A] hover:bg-[#3B82F6] text-white cursor-pointer shadow-md shadow-sm hover:scale-105 active:scale-95"
            }`}
          >
            {hasClaimedToday || claimSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Claimed
              </>
            ) : isClaiming ? (
              "Claiming..."
            ) : (
              "+50 Bonus"
            )}
          </button>
        </div>
      </div>

      {/* Dual Credit Systems Explanation */}
      <div className="space-y-2 text-[11px] mb-3">
        <div className="text-neutral-400 font-semibold text-[10px] uppercase tracking-wider flex items-center justify-between">
          <span>Dual Credit Systems</span>
          <Cpu className="w-3 h-3 text-[#3B82F6]" />
        </div>

        {/* System 1: Website Credits */}
        <div className="p-2 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-200 font-bold">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              1. Sonikoma Website Credits
            </span>
            <span className="font-mono text-amber-300 text-[10px]">
              {credits} Left
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            Used by default when generating with server key (1–3 credits per
            generation).
          </p>
        </div>

        {/* System 2: Google Account Quota */}
        <div className="p-2 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-blue-300 font-bold">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              2. Google Account Quota (BYOK)
            </span>
            <span className="font-mono text-blue-300 text-[10px] font-extrabold">
              0 Web Credits
            </span>
          </div>
          <p className="text-[10px] text-blue-200/80 leading-tight">
            Connect your own Google Gemini API key to use your Google account
            quota directly without spending website credits.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3" />
          Google Account Sync Ready
        </span>
        <button
          onClick={onNavigateToBilling}
          className="text-[#3B82F6] hover:text-[#93C5FD] font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
        >
          Manage Plans <ArrowRight className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

export default HeaderCreditsPopover;
