import React, { useState } from "react";
import {
  Youtube,
  Share2,
  CheckCircle2,
  Sparkles,
  Zap,
  ExternalLink,
  ShieldCheck,
  Send,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";
import { ConnectedSocialAccount, SocialPlatform } from "../types/marketing";

interface MultiPlatformBroadcastPanelProps {
  onPublishToAll?: (platforms: SocialPlatform[]) => void;
  videoUrl?: string | null;
  videoTitle?: string;
  isPublishing?: boolean;
}

const DEFAULT_ACCOUNTS: ConnectedSocialAccount[] = [
  {
    platform: "youtube",
    handle: "@SonikomaCreations",
    displayName: "Sonikoma Official Channel",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
    isConnected: true,
    followersCount: "142.5K",
    autoPublish916: true,
    statusMessage: "Connected via Google OAuth2",
  },
  {
    platform: "tiktok",
    handle: "@sonikoma_anime",
    displayName: "Sonikoma Manga Reels",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop",
    isConnected: true,
    followersCount: "89.2K",
    autoPublish916: true,
    statusMessage: "Direct Video API Connected",
  },
  {
    platform: "instagram",
    handle: "@sonikoma_reels",
    displayName: "Sonikoma Webtoon Stories",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop",
    isConnected: true,
    followersCount: "64.8K",
    autoPublish916: true,
    statusMessage: "Instagram Graph API Connected",
  },
];

export const MultiPlatformBroadcastPanel: React.FC<MultiPlatformBroadcastPanelProps> = ({
  onPublishToAll,
  videoUrl,
  videoTitle = "Episode 1: The Sovereign Awakens [Manhwa Dub]",
  isPublishing = false,
}) => {
  const [accounts, setAccounts] = useState<ConnectedSocialAccount[]>(DEFAULT_ACCOUNTS);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    "youtube",
    "tiktok",
    "instagram",
  ]);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [customCaption, setCustomCaption] = useState(
    "Never underestimate the shadow monarch... Full manhwa series dubbing in bio! 🔥 #webtoon #manhwa #sololeveling #anime #reels #fyp"
  );

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const toggleAccountConnection = (p: SocialPlatform) => {
    setAccounts(
      accounts.map((acc) =>
        acc.platform === p ? { ...acc, isConnected: !acc.isConnected } : acc
      )
    );
  };

  const handleBroadcast = () => {
    setPublishedSuccess(false);
    onPublishToAll?.(selectedPlatforms);
    setTimeout(() => {
      setPublishedSuccess(true);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left">
      {/* ── Top Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-[#3B82F6] border border-blue-500/30">
              <Share2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-tight">
              Multi-Platform 9:16 Shorts Direct Publishing
            </h2>
          </div>
          <p className="text-xs text-neutral-300">
            Publish vertical video episodes simultaneously across YouTube Shorts, TikTok, and Instagram Reels with one click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3 Accounts Active</span>
          </span>
        </div>
      </div>

      {/* ── 3 Connected Accounts Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSelected = selectedPlatforms.includes(acc.platform);

          const getPlatformBranding = () => {
            switch (acc.platform) {
              case "youtube":
                return {
                  name: "YouTube Shorts",
                  badge: "bg-red-500/15 text-red-400 border-red-500/30",
                  borderHover: "hover:border-red-500/40",
                  glow: "",
                  icon: <Youtube className="w-5 h-5 text-red-500" />,
                };
              case "tiktok":
                return {
                  name: "TikTok",
                  badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
                  borderHover: "hover:border-cyan-500/40",
                  glow: "",
                  icon: (
                    <span className="w-5 h-5 flex items-center justify-center font-black text-cyan-400 text-sm">
                      TT
                    </span>
                  ),
                };
              case "instagram":
                return {
                  name: "Instagram Reels",
                  badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",
                  borderHover: "hover:border-pink-500/40",
                  glow: "",
                  icon: (
                    <span className="w-5 h-5 flex items-center justify-center font-black text-pink-400 text-sm">
                      IG
                    </span>
                  ),
                };
            }
          };

          const branding = getPlatformBranding();

          return (
            <div
              key={acc.platform}
              className={`p-4 rounded-2xl bg-[#141414] border transition-all duration-200 relative ${
                isSelected && acc.isConnected
                  ? "border-[#3B82F6] shadow-lg bg-[#16181F]"
                  : "border-[#282828] opacity-80 hover:opacity-100"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  {branding.icon}
                  <span className="text-xs font-bold text-white">{branding.name}</span>
                </div>

                <button
                  type="button"
                  onClick={() => togglePlatform(acc.platform)}
                  disabled={!acc.isConnected}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                    isSelected && acc.isConnected
                      ? "bg-[#3B82F6] text-white border-blue-400"
                      : "bg-[#202020] text-neutral-400 border-[#303030] hover:text-white"
                  }`}
                >
                  {isSelected && acc.isConnected ? "✓ Active" : "Disabled"}
                </button>
              </div>

              {/* Account Details */}
              <div className="flex items-center gap-3 py-3">
                <img
                  src={acc.avatarUrl}
                  alt={acc.displayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#333]"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#E5E5E5] truncate">
                    {acc.displayName}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">{acc.handle}</div>
                </div>
              </div>

              {/* Stats & Connection Status */}
              <div className="flex items-center justify-between pt-2 border-t border-[#222] text-[11px] font-mono">
                <span className="text-neutral-400">{acc.followersCount} Followers</span>
                <button
                  type="button"
                  onClick={() => toggleAccountConnection(acc.platform)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {acc.isConnected ? "Connected" : "Reconnect"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Broadcast Control Bar & Captions ── */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#282828] space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-[#9CA3AF] flex items-center justify-between">
            <span>Synchronized Caption &amp; Viral Hashtags</span>
            <span className="text-[10px] text-[#60A5FA]">Auto-formatted for 9:16 algorithms</span>
          </label>
          <textarea
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            rows={2}
            className="w-full p-3 bg-[#101010] border border-[#2F2F2F] rounded-xl text-xs font-sans text-[#E5E5E5] placeholder-[#555] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all resize-none"
          />
        </div>

        {/* Live Broadcast Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Smartphone className="w-4 h-4 text-[#3B82F6]" />
            <span>Targeting {selectedPlatforms.length} platforms:</span>
            <span className="text-white font-bold uppercase">
              {selectedPlatforms.join(" • ")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBroadcast}
            disabled={isPublishing || selectedPlatforms.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm font-mono tracking-wide uppercase shadow-lg shadow-blue-500/25 border border-blue-400/40 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting to {selectedPlatforms.length} Platforms...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Broadcast 9:16 Shorts Simultaneously</span>
              </>
            )}
          </button>
        </div>

        {/* Success toast banner */}
        {publishedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Direct release dispatched to YouTube Shorts, TikTok, and Instagram Reels!
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">200 OK</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiPlatformBroadcastPanel;
