import React from "react";
import { Gift, CheckCircle2, Ticket } from "lucide-react";

interface DailyStreakTrackerProps {
  hasClaimedToday: boolean;
  streakDays: number;
  onClaimClick: () => void;
  claimNotification: boolean;
}

const STREAK_REWARDS = [
  { day: 1, reward: 50, label: "+50 Credits" },
  { day: 2, reward: 60, label: "+60 Credits" },
  { day: 3, reward: 75, label: "+75 Credits" },
  { day: 4, reward: 90, label: "+90 Credits" },
  { day: 5, reward: 110, label: "+110 Credits" },
  { day: 6, reward: 130, label: "+130 Credits" },
  { day: 7, reward: 150, label: "+150 Mega", special: true },
];

export default function DailyStreakTracker({
  hasClaimedToday,
  streakDays,
  onClaimClick,
  claimNotification,
}: DailyStreakTrackerProps) {
  return (
    <>
      <div className="pt-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Gift className="w-4.5 h-4.5 text-amber-400 font-bold" />
              Daily Claim Streak Tracker
            </div>
            <p className="text-xs text-neutral-400 font-semibold font-sans">
              Claim consecutive daily credits to unlock the Mega Claim Bonus on
              Day 7 (+150 credits!).
            </p>
          </div>

          <div className="bg-neutral-900/80 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-neutral-500 font-mono uppercase block">
              Streak
            </span>
            <span className="text-xs font-black text-amber-400 font-mono">
              {hasClaimedToday ? streakDays - 1 : streakDays - 1}{" "}
              {streakDays - 1 === 1 ? "Day" : "Days"}
            </span>
          </div>
        </div>

        {/* 7 Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {STREAK_REWARDS.map((d) => {
            const isClaimed = d.day < streakDays;
            const isActive = d.day === streakDays && !hasClaimedToday;
            const isLocked =
              d.day > streakDays || (d.day === streakDays && hasClaimedToday);

            return (
              <button
                key={d.day}
                type="button"
                disabled={!isActive}
                onClick={onClaimClick}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-2 relative min-h-[110px] ${
                  isClaimed
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80 opacity-80"
                    : isActive
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400 cursor-pointer animate-pulse shadow-md shadow-amber-900/10"
                    : "bg-[#09090b]/40 border-white/5 text-neutral-600"
                }`}
              >
                <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">
                  Day {d.day}
                </span>

                <div className="flex items-center justify-center py-1">
                  {isClaimed ? (
                    <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" />
                  ) : d.special ? (
                    <Ticket
                      className={`w-6 h-6 ${
                        isActive
                          ? "text-amber-400 animate-bounce"
                          : "text-neutral-650"
                      }`}
                    />
                  ) : (
                    <Gift
                      className={`w-5 h-5 ${
                        isActive ? "text-amber-400" : "text-neutral-700"
                      }`}
                    />
                  )}
                </div>

                <span className="text-[10px] font-black font-mono">
                  {d.label}
                </span>

                {/* Status Overlay Badge */}
                {isActive && (
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-500 text-[8px] font-black text-neutral-950 rounded-full tracking-wider uppercase">
                    Claim!
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            disabled={hasClaimedToday}
            onClick={onClaimClick}
            className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              hasClaimedToday
                ? "bg-neutral-900 border-white/5 text-neutral-500 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-amber-500/30 text-neutral-950 active:scale-95 shadow-md shadow-amber-950/30"
            }`}
          >
            <Gift className="w-4 h-4" />
            {hasClaimedToday
              ? "Claimed for today"
              : `Claim Day ${streakDays} Reward`}
          </button>
        </div>
      </div>

      {claimNotification && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center rounded-xl animate-bounce">
          🚀 Streak bonus claimed! Compute workspace updated.
        </div>
      )}
    </>
  );
}
