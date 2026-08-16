import React from "react";
import {
  Youtube,
  Zap,
  ChevronDown,
  Home,
  Film,
  Flame,
  ListVideo,
  BarChart3,
  Video,
  Radio,
  Sparkles,
} from "lucide-react";

interface YouTubeAppNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  channelTitle: string;
  channelHandle: string;
  channelThumbnail?: string;
  isConnected: boolean;
  onOpenChannelModal: () => void;
  onPublish: () => void;
}

const TABS = [
  { id: "home", label: "Home", icon: Home },
  { id: "videos", label: "Videos", icon: Film },
  { id: "shorts", label: "Shorts", icon: Flame },
  { id: "playlists", label: "Playlists", icon: ListVideo },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "studio", label: "Studio", icon: Video },
];

export default function YouTubeAppNavBar({
  activeTab,
  onTabChange,
  channelTitle,
  channelHandle,
  channelThumbnail,
  isConnected,
  onOpenChannelModal,
  onPublish,
}: YouTubeAppNavBarProps) {
  return (
    <header className="relative w-full rounded-2xl bg-neutral-950/80 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden mb-6">
      {/* Top Ambient Glow Hairline */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent shadow-[0_0_16px_rgba(239,68,68,0.7)]" />

      <div className="px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* ── LEFT: BRAND & CHANNEL SELECTOR ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative group p-2 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center border border-red-400/30 shrink-0">
              <Youtube className="w-4 h-4 text-white fill-white" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white font-sans">
                  SONIKOMA
                </span>
                <span className="px-1.5 py-0.2 rounded bg-red-500/15 border border-red-500/30 text-[8.5px] font-black font-mono text-red-400 tracking-wider">
                  STUDIO
                </span>
              </div>
              <span className="text-[9.5px] text-neutral-400 font-mono hidden sm:inline">
                YouTube Creator Suite
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10 hidden sm:block shrink-0" />

          {/* Connected Channel Pill */}
          <button
            onClick={onOpenChannelModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-red-500/40 transition-all cursor-pointer group shadow-inner shrink-0"
            title="Switch Channel / Manage Account"
          >
            <div className="relative shrink-0">
              {channelThumbnail ? (
                <img
                  src={channelThumbnail}
                  alt={channelTitle}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                  className="w-6 h-6 rounded-full object-cover border border-neutral-700 group-hover:border-red-500/50 transition-colors shadow-sm"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center font-bold text-white text-[9px] font-sans uppercase shadow-sm">
                  {channelTitle ? channelTitle.charAt(0) : "Y"}
                </div>
              )}
              {isConnected && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-neutral-950 shadow-sm" />
              )}
            </div>

            <div className="text-left min-w-0 max-w-[110px] sm:max-w-[140px]">
              <div className="text-xs font-bold text-white leading-tight truncate group-hover:text-red-300 transition-colors">
                {isConnected ? channelTitle : "Select Channel"}
              </div>
              <div className="text-[9.5px] text-neutral-400 font-mono leading-tight truncate">
                {channelHandle || (isConnected ? "Active" : "Click to connect")}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-transform group-hover:translate-y-0.5 shrink-0" />
          </button>
        </div>

        {/* ── CENTER: NAVIGATION TABS ── */}
        <nav className="flex items-center shrink-0">
          <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/6 rounded-xl shadow-inner backdrop-blur-md">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white shadow-[0_0_16px_rgba(239,68,68,0.45)] border border-red-400/40"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? "scale-110 text-white" : "text-neutral-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── RIGHT: LIVE BADGE & PUBLISH CTA ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isConnected && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-[10px] font-mono font-bold shadow-sm">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              <span>LIVE</span>
            </div>
          )}

          <button
            onClick={onPublish}
            className="group relative flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black font-mono rounded-xl shadow-[0_0_18px_rgba(239,68,68,0.35)] hover:shadow-[0_0_24px_rgba(239,68,68,0.55)] border border-red-400/40 transition-all duration-300 cursor-pointer active:scale-98 overflow-hidden shrink-0"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-3.5 h-3.5 fill-current text-white" />
            <span>Publish Video</span>
          </button>
        </div>
      </div>
    </header>
  );
}
