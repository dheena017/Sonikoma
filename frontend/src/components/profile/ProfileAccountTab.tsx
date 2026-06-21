import React from "react";
import {
  CheckCircle2,
  Compass,
  Award,
  Link2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
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
  portfolios: { id: string; site: string; url: string }[];
  setPortfolios: React.Dispatch<
    React.SetStateAction<{ id: string; site: string; url: string }[]>
  >;
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
  portfolios,
  setPortfolios,
  onRedeemReward,
  isDirty = false,
}: ProfileAccountTabProps) {
  const [rewardsToast, setRewardsToast] = React.useState<string | null>(null);
  const [newPortfolioUrl, setNewPortfolioUrl] = React.useState("");
  const [newPortfolioSite, setNewPortfolioSite] = React.useState("Webtoons");

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

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioUrl.trim()) return;

    if (
      !newPortfolioUrl.startsWith("http://") &&
      !newPortfolioUrl.startsWith("https://")
    ) {
      alert("Portfolio link must start with http:// or https://");
      return;
    }

    const newLink = {
      id: Date.now().toString(),
      site: newPortfolioSite,
      url: newPortfolioUrl,
    };

    setPortfolios((prev) => [...prev, newLink]);
    setNewPortfolioUrl("");
  };

  const handleDeletePortfolio = (id: string) => {
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCopyPortfolio = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Portfolio URL copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Dynamic Profile Profile Completion Meter & Connected Accounts Split grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion Progress ring card */}
        <div className="md:col-span-1 bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#a855f7"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * completionPct) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-lg font-black text-white font-mono">
              {completionPct}%
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Profile Status
            </h4>
            <p className="text-[10px] text-neutral-500 font-semibold">
              Complete profile setups to unlock developer bonuses
            </p>
          </div>
        </div>

        {/* Connected accounts manager card */}
        <div className="md:col-span-2 bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 space-y-4 flex flex-col justify-center">
          <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Link2 className="w-4 h-4 text-purple-400" />
            Integrate Social logins
          </h4>

          <div className="space-y-2.5">
            {/* Google connection */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-neutral-300 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Google Account Login
              </span>
              <button
                onClick={() => toggleLink("google")}
                className="cursor-pointer text-purple-400"
              >
                {connections.google ? (
                  <ToggleRight className="w-7 h-7 text-purple-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>

            {/* GitHub connection */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-neutral-300 font-medium flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connections.github ? "bg-emerald-500" : "bg-neutral-600"
                  }`}
                />
                GitHub Repositories
              </span>
              <button
                onClick={() => toggleLink("github")}
                className="cursor-pointer text-purple-400"
              >
                {connections.github ? (
                  <ToggleRight className="w-7 h-7 text-purple-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>

            {/* Discord connection */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-neutral-300 font-medium flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connections.discord ? "bg-emerald-500" : "bg-neutral-600"
                  }`}
                />
                Discord Publisher Community
              </span>
              <button
                onClick={() => toggleLink("discord")}
                className="cursor-pointer text-purple-400"
              >
                {connections.discord ? (
                  <ToggleRight className="w-7 h-7 text-purple-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Portfolios links manager card */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative space-y-4">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-400" />
            Creator Portfolios URLs
          </h3>
          <p className="text-xs text-neutral-400 font-semibold">
            Link your publications from popular webcomic hosting websites
          </p>
        </div>

        {/* Existing portfolio links */}
        <div className="space-y-2">
          {portfolios.map((port) => (
            <div
              key={port.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md">
                  {port.site}
                </span>
                <span className="text-[11px] text-neutral-300 font-medium font-mono select-all truncate max-w-xs md:max-w-md">
                  {port.url}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPortfolio(port.url)}
                  className="text-[9px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePortfolio(port.id)}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add portfolio form */}
        <form onSubmit={handleAddPortfolio} className="flex gap-2 pt-2">
          <select
            value={newPortfolioSite}
            onChange={(e) => setNewPortfolioSite(e.target.value)}
            className="bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20"
          >
            <option value="Webtoons">Webtoons</option>
            <option value="Tapas">Tapas</option>
            <option value="ArtStation">ArtStation</option>
            <option value="Behance">Behance</option>
          </select>
          <input
            type="text"
            required
            value={newPortfolioUrl}
            onChange={(e) => setNewPortfolioUrl(e.target.value)}
            placeholder="Paste portfolio link (e.g. https://tapas.io/creator)"
            className="flex-1 bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-700"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-[10px] transition-all cursor-pointer"
          >
            Add Portfolio
          </button>
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
                onClick={() => handleClaimReward(150, "+100 AI Credits")}
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
