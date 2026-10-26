import React from "react";
import {
  Award,
  Sparkles,
  Compass,
  Globe2,
  MapPin,
  Clock3,
  User,
  Mail,
  Lock,
  Check,
  ChevronDown,
  FileText,
} from "lucide-react";

interface ProfileAccountTabProps {
  user: any;
  profileUser: {
    fullName: string;
    email: string;
    avatarUrl: string;
    role: string;
    bio: string;
    location: string;
    website: string;
    timezone: string;
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
      location: string;
      website: string;
      timezone: string;
      newsletter: boolean;
      language: string;
    }>
  >;
  handleProfileSave: (e: React.FormEvent) => void;
  saveSuccess: boolean;

  // Lifted database profile props
  connections: { google: boolean; discord: boolean };
  setConnections: React.Dispatch<
    React.SetStateAction<{ google: boolean; discord: boolean }>
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
    icon: Sparkles,
  },
  {
    id: "2",
    title: "Gemini Translator",
    desc: "Translated storyboard into Korean/Japanese",
    icon: Globe2,
  },
  {
    id: "3",
    title: "Keyframe Director",
    desc: "Added camera pan-zoom animation routes",
    icon: Compass,
  },
  {
    id: "4",
    title: "Pro Producer",
    desc: "Compiled a 10-minute recap video stream",
    icon: Award,
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
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-7 shadow-lg relative">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#222222]">
          <div className="space-y-1 text-left">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <User className="w-4 h-4 text-[#3B82F6]" />
              <span>Profile Details</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Manage your creator identity, personal info, and preferences
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/25 text-[#60A5FA] text-xs font-semibold rounded-xl text-center mb-6">
            Profile changes successfully updated!
          </div>
        )}

        <form noValidate onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span>Full Display Name</span>
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
                className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 px-3.5 text-xs font-medium text-neutral-200 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Email Address</span>
                </span>
                <span className="text-[9px] bg-[#1A1A1A] text-neutral-400 px-2 py-0.5 rounded border border-[#2A2A2A] uppercase font-mono">
                  Fixed
                </span>
              </label>
              <div className="relative flex items-center">
                <div className="w-full bg-[#101010] border border-[#222222] rounded-xl py-2.5 pl-3.5 pr-9 text-xs font-mono text-neutral-400 select-all cursor-not-allowed">
                  {profileUser.email}
                </div>
                <Lock className="w-3.5 h-3.5 text-neutral-600 absolute right-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-neutral-500" />
              <span>Studio Creator Role</span>
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
              className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 px-3.5 text-xs font-medium text-neutral-200 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={profileUser.location}
                placeholder="City, Country"
                onChange={(e) =>
                  setProfileUser((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 px-3.5 text-xs font-medium text-neutral-200 placeholder:text-neutral-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
                <Globe2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Website</span>
              </label>
              <input
                type="url"
                value={profileUser.website}
                placeholder="https://example.com"
                onChange={(e) =>
                  setProfileUser((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 px-3.5 text-xs font-medium text-neutral-200 placeholder:text-neutral-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
                <Clock3 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Timezone</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={profileUser.timezone}
                  onChange={(e) =>
                    setProfileUser((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 pl-3.5 pr-9 text-xs font-medium text-neutral-200 focus:outline-none transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="UTC" className="bg-[#141414] text-white">UTC</option>
                  <option value="America/Los_Angeles" className="bg-[#141414] text-white">Pacific Time (US & Canada)</option>
                  <option value="America/New_York" className="bg-[#141414] text-white">Eastern Time (US & Canada)</option>
                  <option value="Europe/London" className="bg-[#141414] text-white">London (GMT)</option>
                  <option value="Europe/Berlin" className="bg-[#141414] text-white">Central Europe (CET)</option>
                  <option value="Asia/Tokyo" className="bg-[#141414] text-white">Tokyo (JST)</option>
                  <option value="Asia/Seoul" className="bg-[#141414] text-white">Seoul (KST)</option>
                  <option value="Australia/Sydney" className="bg-[#141414] text-white">Sydney (AEST)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-semibold text-neutral-300 tracking-wider uppercase flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Creator Biography</span>
            </label>
            <textarea
              rows={3}
              value={profileUser.bio}
              placeholder="Tell other creators about your style, workflows, and current projects..."
              onChange={(e) =>
                setProfileUser((prev) => ({ ...prev, bio: e.target.value }))
              }
              className="w-full bg-[#0D0D0D] border border-[#262626] hover:border-[#383838] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/40 rounded-xl py-2.5 px-3.5 text-xs font-medium text-neutral-200 placeholder:text-neutral-600 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          <div className="border-t border-[#222222] pt-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${
                  profileUser.newsletter
                    ? "bg-[#3B82F6] border-[#3B82F6]"
                    : "bg-[#101010] border-[#2E2E2E] group-hover:border-neutral-500"
                }`}
              >
                {profileUser.newsletter && (
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                )}
              </div>
              <span className="text-xs text-neutral-400 group-hover:text-neutral-300 font-medium">
                Receive monthly creator roundups and core feature updates
              </span>
            </label>

            {isDirty ? (
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-500/20"
              >
                <span>Save Changes</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#282828] bg-[#141414] text-neutral-400 text-xs font-medium select-none cursor-default shadow-sm">
                <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Saved</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Unlocked Creator Achievements badges */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-7 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#222222] pb-5">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center text-[#3B82F6]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Creative Milestones & Achievements
              </h4>
              <p className="text-xs text-neutral-400">
                Unlock milestones by using advanced studio configurations
              </p>
            </div>
          </div>

          {/* Points display & Exchange */}
          <div className="flex items-center gap-3 bg-[#101010] border border-[#262626] p-2 rounded-xl shadow-inner">
            <div className="text-left px-2">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">
                Reward Points
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {achievementPoints} <span className="text-xs text-[#3B82F6]">pts</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleClaimReward(150, "+100 Smart Credits")}
                className="bg-[#181818] hover:bg-[#222222] border border-[#2C2C2C] hover:border-neutral-500 text-neutral-200 hover:text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Exchange 150 pts for 100 bonus trial credits"
              >
                Claim Credits (150 pts)
              </button>
              <button
                type="button"
                onClick={() => handleClaimReward(200, "Pro Editor Badge")}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Unlock Pro Editor profile badge for 200 pts"
              >
                Claim Badge (200 pts)
              </button>
            </div>
          </div>
        </div>

        {rewardsToast && (
          <div
            className={`p-2.5 rounded-xl border text-xs font-semibold text-center ${
              rewardsToast.includes("Successfully")
                ? "bg-blue-500/10 border-blue-500/20 text-[#60A5FA]"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {rewardsToast}
          </div>
        )}

        {unlockedRewards.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs font-medium text-neutral-400 items-center">
            <span>Redeemed:</span>
            {unlockedRewards.map((reward, idx) => (
              <span
                key={idx}
                className="bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
              >
                {reward}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {dynamicAchievements.map((ach) => {
            const Icon = ach.icon || Sparkles;
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  ach.unlocked
                    ? "bg-[#161616] border-[#2C2C2C] hover:border-neutral-500 shadow-sm"
                    : "bg-[#101010] border-[#202020] opacity-60"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        ach.unlocked
                          ? "bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#3B82F6]"
                          : "bg-[#181818] border border-[#282828] text-neutral-500"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {ach.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/25 px-2 py-0.5 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500 bg-[#161616] border border-[#242424] px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        ach.unlocked ? "text-white" : "text-neutral-400"
                      }`}
                    >
                      {ach.title}
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-relaxed mt-1">
                      {ach.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
