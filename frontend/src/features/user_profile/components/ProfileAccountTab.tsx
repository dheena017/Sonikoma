import React from "react";
import {
  CheckCircle2,
  Award,
  Link2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Compass,
} from "lucide-react";

interface ProfileAccountTabProps {
  user: any;
  profileUser: {
    fullName: string;
    email: string;
    avatarUrl: string;
    role: string;
    bio: string;
    newsletter: boolean;
    language: string;
  };
  setProfileUser: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      email: string;
      avatarUrl: string;
      role: string;
      bio: string;
      newsletter: boolean;
      language: string;
    }>
  >;
  handleProfileSave: (e: React.FormEvent) => void;
  saveSuccess: boolean;

  // Lifted database profile props
  connections: { google: boolean; github: boolean; discord: boolean };
  setConnections: React.Dispatch<
    React.SetStateAction<{ google: boolean; github: boolean; discord: boolean }>
  >;
  achievementPoints: number;
  setAchievementPoints: React.Dispatch<React.SetStateAction<number>>;
  unlockedRewards: string[];
  setUnlockedRewards: React.Dispatch<React.SetStateAction<string[]>>;
  unlockedAchievements: string[];
  onRedeemReward: (
    cost: number,
    type: string,
    value: string
  ) => Promise<boolean>;
  isDirty?: boolean;
}

const ACHIEVEMENTS = [
  {
    id: "1",
    title: "First Scrape",
    desc: "Parsed first vertical webtoon strip",
    unlocked: true,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "2",
    title: "Gemini Translator",
    desc: "Translated storyboard into Korean/Japanese",
    unlocked: true,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "3",
    title: "Keyframe Director",
    desc: "Added camera pan-zoom animation routes",
    unlocked: true,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "4",
    title: "Pro Producer",
    desc: "Compiled a 10-minute recap video stream",
    unlocked: false,
    color: "from-amber-500 to-orange-500",
  },
];

export default function ProfileAccountTab({
  profileUser,
  setProfileUser,
  handleProfileSave,
  saveSuccess,
  connections,
  setConnections,
  achievementPoints,
  setAchievementPoints,
  unlockedRewards,
  setUnlockedRewards,
  unlockedAchievements,
  onRedeemReward,
  isDirty = false,
}: ProfileAccountTabProps) {
  const [rewardsToast, setRewardsToast] = React.useState<string | null>(null);

  const dynamicAchievements = React.useMemo(() => {
    return ACHIEVEMENTS.map((ach) => ({
      ...ach,
      unlocked: (unlockedAchievements || []).includes(ach.title),
    }));
  }, [unlockedAchievements]);

  // Profile completion score calculation
  const completionItems = React.useMemo(() => {
    return [
      { label: "Display Name set", done: profileUser.fullName.length > 0 },
      { label: "Biography written", done: profileUser.bio.length > 15 },
      { label: "Creator Role picked", done: !!profileUser.role },
      {
        label: "Social Account linked",
        done: connections.google || connections.github || connections.discord,
      },
    ];
  }, [profileUser, connections]);

  const completionPct = React.useMemo(() => {
    const doneCount = completionItems.filter((item) => item.done).length;
    return Math.round((doneCount / completionItems.length) * 100);
  }, [completionItems]);

  const toggleLink = (provider: "google" | "github" | "discord") => {
    setConnections((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleClaimReward = async (cost: number, name: string) => {
    setRewardsToast(null);
    if (achievementPoints < cost) {
      setRewardsToast("Insufficient points. Complete more milestones!");
      return;
    }
    if (unlockedRewards.includes(name)) {
      setRewardsToast("You have already claimed this reward!");
      return;
    }

    const isBadge = name.toLowerCase().includes("badge");
    const rewardType = isBadge ? "badge" : "credits";
    const rewardValue = isBadge ? name : "100";

    const ok = await onRedeemReward(cost, rewardType, rewardValue);
    if (ok) {
      setAchievementPoints((prev) => prev - cost);
      setUnlockedRewards((prev) => [...prev, name]);
      setRewardsToast(`Successfully claimed: ${name}!`);
    } else {
      setRewardsToast("Redemption failed on server.");
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Main Account details Form Card */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="space-y-1 text-left mb-6">
          <h3 className="text-lg font-bold text-white">Profile Details</h3>
          <p className="text-xs text-neutral-400">
            Edit account descriptions, names, and profiles
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl text-center mb-6 animate-pulse">
            Profile changes successfully updated!
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
                Full Display Name
              </label>
              <input
                type="text"
                required
                value={profileUser.fullName}
                onChange={(e) =>
                  setProfileUser((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
              />
            </div>

            <div className="space-y-1.5 text-left opacity-75">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 ml-1 flex items-center gap-1">
                Email Address
                <span className="text-[8px] bg-neutral-950 px-1 rounded border border-white/5 uppercase">
                  Fixed
                </span>
              </label>
              <div className="w-full bg-neutral-900/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono text-neutral-400 select-all cursor-not-allowed">
                {profileUser.email}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Studio Creator Role
            </label>
            <input
              type="text"
              required
              value={profileUser.role}
              onChange={(e) =>
                setProfileUser((prev) => ({
                  ...prev,
                  role: e.target.value,
                }))
              }
              className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
              Creator Biography
            </label>
            <textarea
              rows={3}
              value={profileUser.bio}
              onChange={(e) =>
                setProfileUser((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2.5 px-4 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all resize-none"
            />
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer group select-none text-left">
              <input
                type="checkbox"
                checked={profileUser.newsletter}
                onChange={(e) =>
                  setProfileUser((prev) => ({
                    ...prev,
                    newsletter: e.target.checked,
                  }))
                }
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                  profileUser.newsletter
                    ? "bg-purple-600 border-purple-500"
                    : "bg-black/40 border-white/10 group-hover:border-white/20"
                }`}
              >
                {profileUser.newsletter && (
                  <CheckCircle2 className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300 font-medium">
                Receive monthly creator roundups and core feature updates
              </span>
            </label>

            {isDirty ? (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shadow-md shadow-purple-950/30 hover:shadow-purple-900/40 animate-pulse"
              >
                <span>✦</span>
                <span>Save Profile Changes</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 text-xs font-bold tracking-wider select-none shadow-[0_0_10px_-2px_rgba(52,211,153,0.2)] cursor-not-allowed"
              >
                <span className="text-emerald-400">✓</span>
                <span>Saved</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Unlocked Creator Achievements badges */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              Creative Milestones & Achievements
            </h4>
            <p className="text-[10px] text-neutral-500 font-semibold">
              Unlock milestones by using advanced studio configurations
            </p>
          </div>

          {/* Points display & Exchange */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-2 rounded-2xl">
            <div className="text-left">
              <span className="text-[8px] text-neutral-500 block uppercase">
                Reward Points
              </span>
              <span className="text-sm font-black text-purple-400 font-mono">
                {achievementPoints} pts
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleClaimReward(150, "+100 Smart Credits")}
                className="bg-purple-600 hover:bg-purple-500 text-white py-1 px-3 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                title="Exchange 150 pts for 100 bonus trial credits"
              >
                Claim Credits (150 pts)
              </button>
              <button
                type="button"
                onClick={() => handleClaimReward(200, "Pro Editor Badge")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                title="Unlock Pro Editor profile badge for 200 pts"
              >
                Claim Badge (200 pts)
              </button>
            </div>
          </div>
        </div>

        {rewardsToast && (
          <div
            className={`p-2.5 rounded-xl border text-[10px] font-bold text-center animate-pulse ${
              rewardsToast.includes("Successfully")
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {rewardsToast}
          </div>
        )}

        {unlockedRewards.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-neutral-400 items-center">
            <span>Redeemed:</span>
            {unlockedRewards.map((reward, idx) => (
              <span
                key={idx}
                className="bg-purple-500/15 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full"
              >
                {reward}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                ach.unlocked
                  ? "bg-black/30 border-white/5 shadow-inner"
                  : "bg-black/60 border-white/5 opacity-55"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      ach.unlocked ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    {ach.title}
                  </span>
                  {ach.unlocked && (
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
                <p className="text-[9px] text-neutral-500 leading-relaxed font-semibold">
                  {ach.desc}
                </p>
              </div>

              <div className="mt-3 text-right">
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    ach.unlocked
                      ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                      : "bg-neutral-800 text-neutral-500 border border-white/5"
                  }`}
                >
                  {ach.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
