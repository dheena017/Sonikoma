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
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import YouTubeOfficialLogo from "./YouTubeOfficialLogo";

interface YouTubeAppNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  channelTitle: string;
  channelHandle: string;
  channelThumbnail?: string;
  isConnected: boolean;
  onOpenChannelModal: () => void;
  onPublish: () => void;
  isEmbedded?: boolean;
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
  isEmbedded = false,
}: YouTubeAppNavBarProps) {
  return (
    <div className="relative w-full shrink-0">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        {/* ── LEFT: BRAND & CHANNEL SELECTOR ── */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5 group cursor-default select-none">
            <div className="p-1.5 px-2 bg-[#121212] group-hover:bg-[#1E1E1E] rounded-xl flex items-center justify-center border border-[#2F2F2F] group-hover:border-red-500/30 transition-all shadow-sm shrink-0">
              <YouTubeOfficialLogo className="w-6 h-4.5 drop-shadow-[0_0_8px_rgba(255,0,0,0.35)]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-[#E5E5E5] font-sans">
                  SONIKOMA
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-[8.5px] font-bold font-sans text-red-400 tracking-wider">
                  STUDIO
                </span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-sans hidden sm:inline leading-tight">
                YouTube Creator Suite
              </span>
            </div>
          </div>

          {/* Connected Channel Pill */}
          <Tooltip
            text={
              isConnected
                ? `Active: ${channelTitle || "Channel"} — Click to switch`
                : "Connect YouTube channel"
            }
            placement="bottom"
          >
            <button
              onClick={onOpenChannelModal}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] hover:border-red-500/40 transition-all duration-200 cursor-pointer group shadow-sm shrink-0"
              aria-label="Switch Channel"
            >
              <div className="relative shrink-0">
                {channelThumbnail ? (
                  <img
                    src={channelThumbnail}
                    alt={channelTitle}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                    className="w-6 h-6 rounded-full object-cover border border-[#2F2F2F] group-hover:border-red-500/50 transition-colors shadow-sm"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center font-bold text-white text-[9.5px] font-sans uppercase shadow-sm">
                    {channelTitle ? channelTitle.charAt(0) : "Y"}
                  </div>
                )}
                {/* Live connection dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#0A0A0A] ${
                    isConnected
                      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
                      : "bg-amber-400"
                  }`}
                />
              </div>

              <div className="text-left min-w-0 max-w-[120px] sm:max-w-[160px] md:max-w-[210px]">
                <div className="text-xs font-semibold text-[#E5E5E5] leading-tight truncate group-hover:text-red-300 transition-colors">
                  {isConnected ? channelTitle : "Connect Channel"}
                </div>
                <div className="text-[10px] text-[#9CA3AF] font-sans leading-tight truncate flex items-center gap-1">
                  <span>
                    {channelHandle ||
                      (isConnected ? "Connected" : "Click to connect")}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E5E5E5] transition-transform duration-200 group-hover:translate-y-0.5 shrink-0" />
            </button>
          </Tooltip>
        </div>

        {/* ── CENTER: NAVIGATION TABS ── */}
        <nav className="flex items-center min-w-0 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#2F2F2F] rounded-xl shadow-inner shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? "bg-red-600 text-white font-semibold shadow-sm border border-red-500/50"
                      : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E] border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? "scale-105 text-white" : "text-[#9CA3AF]"
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

        {/* ── RIGHT: PUBLISH CTA ── */}
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip
            text="Publish or schedule video to connected YouTube channel"
            placement="bottom"
          >
            <button
              onClick={onPublish}
              className="group relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold font-sans rounded-xl shadow-md shadow-red-950/40 hover:shadow-red-900/60 border border-red-500/50 transition-all duration-300 cursor-pointer active:scale-95 overflow-hidden shrink-0 whitespace-nowrap"
              aria-label="Publish Video"
            >
              {/* Shimmer reflection */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <Zap className="w-3.5 h-3.5 fill-current text-white transition-transform group-hover:scale-110" />
              <span className="tracking-wide">Publish Video</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
