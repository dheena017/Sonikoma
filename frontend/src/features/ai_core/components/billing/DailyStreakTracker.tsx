import React from "react";
import { Gift, CheckCircle2, Ticket, Sparkles } from "lucide-react";

export interface DailyStreakTrackerProps {
  hasClaimedToday: boolean;
  streakDays: number;
  onClaimClick: () => void;
  claimNotification?: boolean;
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

export const DailyStreakTracker: React.FC<DailyStreakTrackerProps> = ({
  hasClaimedToday,
  streakDays,
  onClaimClick,
  claimNotification = false,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 flex-1 text-left">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Gift className="w-4 h-4 text-amber-400 font-bold" />
            Daily Claim Streak Tracker
          </div>
          <p className="text-xs text-neutral-400 font-semibold font-sans">
            Claim consecutive daily login rewards to unlock the Mega Claim Bonus on Day 7 (+150 credits).
          </p>
        </div>

        <div className="bg-neutral-900/80 border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-neutral-400 font-mono uppercase block">
            Current Streak:
          </span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {streakDays} {streakDays === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>

      {/* 7 Day Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {STREAK_REWARDS.map((d) => {
          const isClaimed = d.day < streakDays;
          const isActive = d.day === streakDays && !hasClaimedToday;

          return (
            <button
              key={d.day}
              type="button"
              disabled={!isActive}
              onClick={onClaimClick}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-2 relative min-h-[105px] select-none ${
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
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : d.special ? (
                  <Ticket
                    className={`w-5.5 h-5.5 ${
                      isActive ? "text-amber-400 animate-bounce" : "text-neutral-600"
                    }`}
                  />
                ) : (
                  <Gift
                    className={`w-4.5 h-4.5 ${
                      isActive ? "text-amber-400" : "text-neutral-600"
                    }`}
                  />
                )}
              </div>

              <span className="text-[10px] font-black font-mono">
                {d.label}
              </span>

              {isActive && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-amber-500 text-[8px] font-black text-neutral-950 rounded-full tracking-wider uppercase">
                  Claim!
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={hasClaimedToday}
          onClick={onClaimClick}
          className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            hasClaimedToday
              ? "bg-neutral-900 border-white/5 text-neutral-500 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-500/30 text-neutral-950 active:scale-95 shadow-md shadow-amber-950/30"
          }`}
        >
          <Gift className="w-4 h-4" />
          {hasClaimedToday
            ? "Claimed for today"
            : `Claim Day ${streakDays} Reward`}
        </button>
      </div>

      {claimNotification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center rounded-xl animate-bounce">
          🚀 Streak bonus claimed! Credit balance updated.
        </div>
      )}
    </div>
  );
};

export default DailyStreakTracker;
