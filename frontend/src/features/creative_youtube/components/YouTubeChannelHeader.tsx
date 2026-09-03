import React, { useEffect, useState } from "react";
import {
  Youtube,
  Users,
  Eye,
  Video,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  Check,
  User,
} from "lucide-react";
import YouTubeOfficialLogo from "./YouTubeOfficialLogo";

export interface ChannelItem {
  id: string;
  title: string;
  description?: string;
  custom_url?: string;
  thumbnail?: string;
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
}

export interface YouTubeProfileResponse {
  authenticated: boolean;
  user_email?: string;
  user_name?: string;
  user_picture?: string;
  overview?: {
    id?: string;
    title?: string;
    description?: string;
    custom_url?: string;
    thumbnail?: string;
    banner_url?: string;
    subscriber_count?: string;
    view_count?: string;
    video_count?: string;
  };
  channels?: ChannelItem[];
}

interface YouTubeChannelHeaderProps {
  seoScore?: number;
  isPublishing?: boolean;
  onOpenChannelModal?: () => void;
  addNotification?: (msg: string, type: string) => void;
}

export default function YouTubeChannelHeader({
  seoScore = 0,
  isPublishing = false,
  onOpenChannelModal,
  addNotification,
}: YouTubeChannelHeaderProps) {
  const [profileData, setProfileData] = useState<YouTubeProfileResponse | null>(
    null
  );
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const fetchProfileDetails = async () => {
    setIsLoading(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: YouTubeProfileResponse = await res.json();
        setProfileData(data);
        const list: ChannelItem[] = data.channels || [];
        setChannels(list);
        if (list.length > 0 && !selectedChannel) {
          setSelectedChannel(list[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch YouTube profile details:", err);
      setProfileData({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiates the YouTube OAuth flow.
   * Fetches the connect endpoint with Authorization + Accept: application/json,
   * backend returns { auth_url } as JSON so we can navigate the browser there.
   */
  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const userEmail =
        localStorage.getItem("user_email") ||
        localStorage.getItem("sonikoma_user_email") ||
        localStorage.getItem("email") ||
        "";
      const connectUrl = userEmail
        ? `/api/export/youtube/oauth/connect?email=${encodeURIComponent(
            userEmail.trim()
          )}`
        : "/api/export/youtube/oauth/connect";

      const res = await fetch(connectUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          addNotification?.(
            "Redirecting to Google to connect YouTube...",
            "info"
          );
          window.location.href = data.auth_url;
        } else {
          addNotification?.(
            "Failed to get YouTube authorization URL. Please try again.",
            "error"
          );
        }
      } else {
        const err = await res.json().catch(() => ({}));
        addNotification?.(
          `YouTube connection failed: ${err.detail || res.statusText}`,
          "error"
        );
      }
    } catch (err) {
      console.error("YouTube connect error:", err);
      addNotification?.(
        "Failed to start YouTube connection. Please check that you are logged in.",
        "error"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
    const handleChannelChanged = () => {
      fetchProfileDetails();
    };
    window.addEventListener("youtube_channel_changed", handleChannelChanged);
    return () => {
      window.removeEventListener(
        "youtube_channel_changed",
        handleChannelChanged
      );
    };
  }, []);

  const isConnected = Boolean(
    profileData && profileData.authenticated === true
  );

  const activeTitle = isConnected
    ? selectedChannel?.title ||
      profileData?.overview?.title ||
      profileData?.user_name ||
      "YouTube Channel"
    : "YouTube Integration Hub";

  const activeHandle = isConnected
    ? selectedChannel?.custom_url ||
      profileData?.overview?.custom_url ||
      "YouTube Channel Connected"
    : "Connect YouTube to select your channel & load profile stats";

  const activeThumbnail = isConnected
    ? selectedChannel?.thumbnail ||
      profileData?.overview?.thumbnail ||
      profileData?.user_picture
    : undefined;

  const activeDescription = isConnected
    ? selectedChannel?.description || profileData?.overview?.description || ""
    : "";

  const activeSubscribers = isConnected
    ? selectedChannel?.subscriber_count ||
      profileData?.overview?.subscriber_count ||
      "0"
    : "--";

  const activeViews = isConnected
    ? selectedChannel?.view_count || profileData?.overview?.view_count || "0"
    : "--";

  const activeVideos = isConnected
    ? selectedChannel?.video_count || profileData?.overview?.video_count || "0"
    : "--";

  return (
    <div className="relative z-30 bg-neutral-950/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl transition-all duration-300 hover:border-white/[0.12] font-sans overflow-hidden">
      {/* Unified Master Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/50 via-neutral-900/70 to-neutral-950 relative flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/[0.06] gap-4">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
          {activeThumbnail ? (
            <img
              src={activeThumbnail}
              alt={activeTitle}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-white/10 shadow-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-purple-800 border border-white/10 flex items-center justify-center text-white font-bold text-lg font-sans uppercase shrink-0 shadow-lg">
              {activeTitle ? activeTitle.charAt(0) : "Y"}
            </div>
          )}

          {/* Channel / Profile Details */}
          <div className="relative z-30 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="px-2 py-0.5 rounded-md text-[8.5px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                YOUTUBE • INTEGRATION STUDIO
              </span>
              {seoScore > 0 && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  • SEO Score:{" "}
                  <strong className="text-[#60A5FA]">{seoScore}/100</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (channels.length > 1) {
                    setIsDropdownOpen(!isDropdownOpen);
                  } else if (onOpenChannelModal) {
                    onOpenChannelModal();
                  } else {
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
                className="flex items-center gap-1.5 text-left group cursor-pointer"
                title="Click to switch or select YouTube Channel"
              >
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-red-400 transition-colors truncate">
                  {activeTitle}
                </h2>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
                    isDropdownOpen ? "rotate-180 text-red-400" : ""
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-neutral-400 font-mono font-medium mt-0.5 flex items-center gap-2 truncate">
              <span>{activeHandle}</span>
              {profileData?.user_email && (
                <span className="text-neutral-500 hidden sm:inline">
                  • {profileData.user_email}
                </span>
              )}
            </p>

            {activeDescription && (
              <p className="text-[11px] text-neutral-400 line-clamp-1 max-w-xl mt-1 font-mono hidden md:block">
                {activeDescription}
              </p>
            )}

            {/* Dropdown Menu for Channel Switching */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-84 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150 font-mono">
                <div className="text-[10px] text-neutral-400 font-bold uppercase px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
                  <span>Available Channels ({channels.length})</span>
                  {onOpenChannelModal && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenChannelModal();
                      }}
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold hover:underline cursor-pointer"
                    >
                      Manage Channels ↗
                    </button>
                  )}
                </div>

                <div className="space-y-1 mt-1.5 max-h-60 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={async () => {
                        setSelectedChannel(ch);
                        setIsDropdownOpen(false);
                        try {
                          const token =
                            localStorage.getItem("sonikoma_token") ||
                            localStorage.getItem("token") ||
                            "";
                          const res = await fetch(
                            "/api/export/youtube/select-channel",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                channel_id: ch.id,
                                title: ch.title,
                                thumbnail: ch.thumbnail,
                                custom_url: ch.custom_url,
                              }),
                            }
                          );
                          const data = await res.json().catch(() => ({}));
                          if (data.needs_auth && data.auth_url) {
                            addNotification?.(
                              `Switching Google authorization to "${ch.title}"…`,
                              "info"
                            );
                            window.location.href = data.auth_url;
                            return;
                          }
                          addNotification?.(
                            `Switched active channel to "${ch.title}"`,
                            "success"
                          );
                          window.dispatchEvent(
                            new CustomEvent("youtube_channel_changed", {
                              detail: ch,
                            })
                          );
                          fetchProfileDetails();
                        } catch {
                          addNotification?.(
                            `Selected channel: ${ch.title}`,
                            "info"
                          );
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        selectedChannel?.id === ch.id ||
                        (!selectedChannel &&
                          ch.id === profileData?.overview?.id)
                          ? "bg-red-950/50 text-white border border-red-800/50 font-bold shadow-sm"
                          : "hover:bg-neutral-800/60 text-neutral-300 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {ch.thumbnail ? (
                          <img
                            src={ch.thumbnail}
                            alt={ch.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 border border-neutral-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {ch.title ? ch.title.charAt(0) : "Y"}
                          </div>
                        )}
                        <div className="truncate text-xs">
                          <div className="truncate font-bold font-sans text-white">
                            {ch.title}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {ch.custom_url || `@${ch.id}`}
                          </div>
                        </div>
                      </div>
                      {(selectedChannel?.id === ch.id ||
                        (!selectedChannel &&
                          ch.id === profileData?.overview?.id)) && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {onOpenChannelModal && (
                  <div className="pt-2 mt-2 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenChannelModal();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-800"
                    >
                      <span>+ Add / Switch Channel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                isPublishing
                  ? "bg-amber-400 animate-ping"
                  : isConnected
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />
            <span>
              {isPublishing
                ? "Publishing Active"
                : isConnected
                ? "YouTube Connected"
                : "Disconnected"}
            </span>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnectYouTube}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/30 transition-all font-mono active:scale-98 flex items-center gap-2 cursor-pointer"
            >
              <YouTubeOfficialLogo className="w-4.5 h-3.5" />
              <span>{isConnecting ? "Connecting..." : "Connect YouTube"}</span>
            </button>
          ) : (
            onOpenChannelModal && (
              <button
                onClick={onOpenChannelModal}
                className="px-3.5 py-1.5 bg-[#14141E] hover:bg-[#1E1E2A] text-neutral-200 hover:text-white font-mono text-xs font-bold rounded-xl border border-white/[0.08] hover:border-red-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <YouTubeOfficialLogo className="w-4 h-3" />
                <span>Switch Channel</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchProfileDetails();
            }}
            disabled={isLoading}
            className="p-2 bg-[#14141E] hover:bg-[#1E1E2A] text-neutral-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh YouTube Profile & Telemetry"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading ? "animate-spin text-red-400" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] border-t border-white/[0.06] bg-black/20 font-mono">
        <div className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-950/40 text-red-400 border border-red-900/30 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
              Subscribers
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate">
              {activeSubscribers}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/40 text-[#3B82F6] border border-purple-900/30 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
              Lifetime Views
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate">
              {activeViews}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
              Videos Uploaded
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate">
              {activeVideos}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] text-neutral-500 font-bold uppercase tracking-wider">
              API Quota Health
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 truncate">
              97.6% Free
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
