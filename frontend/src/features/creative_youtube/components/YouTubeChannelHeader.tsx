import React, { useEffect, useState } from "react";
import { Youtube, Users, Eye, Video, ShieldCheck, RefreshCw, ChevronDown, Check, User } from "lucide-react";

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
}

export default function YouTubeChannelHeader({
  seoScore = 0,
  isPublishing = false,
  onOpenChannelModal,
}: YouTubeChannelHeaderProps) {
  const [profileData, setProfileData] = useState<YouTubeProfileResponse | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const fetchProfileDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
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
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/oauth/connect", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        } else {
          alert("Failed to get YouTube authorization URL. Please try again.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`YouTube connection failed: ${err.detail || res.statusText}`);
      }
    } catch (err) {
      console.error("YouTube connect error:", err);
      alert("Failed to start YouTube connection. Please check that you are logged in.");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const isConnected = Boolean(profileData && profileData.authenticated === true);

  const activeTitle = isConnected
    ? (selectedChannel?.title || profileData?.overview?.title || profileData?.user_name || "YouTube Channel")
    : "YouTube Integration Hub";

  const activeHandle = isConnected
    ? (selectedChannel?.custom_url || profileData?.overview?.custom_url || profileData?.user_email || "Google Account Connected")
    : "Connect YouTube to select your channel & load profile stats";

  const activeThumbnail = isConnected
    ? (selectedChannel?.thumbnail || profileData?.overview?.thumbnail || profileData?.user_picture)
    : undefined;

  const activeDescription = isConnected
    ? (selectedChannel?.description || profileData?.overview?.description || "")
    : "";

  const activeSubscribers = isConnected
    ? (selectedChannel?.subscriber_count || profileData?.overview?.subscriber_count || "0")
    : "--";

  const activeViews = isConnected
    ? (selectedChannel?.view_count || profileData?.overview?.view_count || "0")
    : "--";

  const activeVideos = isConnected
    ? (selectedChannel?.video_count || profileData?.overview?.video_count || "0")
    : "--";

  return (
    <div className="bg-neutral-950/60 backdrop-blur-md border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-neutral-800 font-sans">
      {/* Unified Master Banner Header */}
      <div className="py-5 bg-gradient-to-r from-red-950/80 via-purple-950/50 to-neutral-950 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between px-6 border-b border-neutral-900 gap-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex items-center gap-4">
          {activeThumbnail ? (
            <img
              src={activeThumbnail}
              alt={activeTitle}
              className="w-16 h-16 rounded-2xl border-2 border-red-500/40 shadow-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border-2 border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Youtube className="w-8 h-8" />
            </div>
          )}

          {/* Channel / Profile Details */}
          <div className="relative">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-300 border border-red-500/20">
                YOUTUBE • INTEGRATION STUDIO
              </span>
              {seoScore > 0 && (
                <span className="text-[11px] text-neutral-400 font-mono">
                  • SEO Score: <strong className="text-purple-300">{seoScore}/100</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {channels.length > 1 ? (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                >
                  <h2 className="text-xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">
                    {activeTitle}
                  </h2>
                  <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-200" />
                </button>
              ) : (
                <h2 className="text-xl font-black text-white tracking-tight">
                  {activeTitle}
                </h2>
              )}

              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border font-mono ${
                  isConnected
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-900/60"
                    : "bg-amber-950/80 text-amber-300 border-amber-900/60"
                }`}
              >
                {isConnected ? "CONNECTED CHANNEL" : "NOT CONNECTED"}
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-mono font-medium mt-0.5 flex items-center gap-2">
              <span>{activeHandle}</span>
              {profileData?.user_email && (
                <span className="text-neutral-500">• {profileData.user_email}</span>
              )}
            </p>

            {activeDescription && (
              <p className="text-[11px] text-neutral-400 line-clamp-1 max-w-xl mt-1 font-mono">
                {activeDescription}
              </p>
            )}

            {/* Dropdown Menu for Channel Switching */}
            {isDropdownOpen && channels.length > 1 && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in font-mono">
                <div className="text-[10px] text-neutral-500 font-bold uppercase px-3 py-1.5 border-b border-neutral-800 flex items-center justify-between">
                  <span>Select Channel ({channels.length})</span>
                  {onOpenChannelModal && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenChannelModal();
                      }}
                      className="text-red-400 hover:text-red-300 text-[10px] underline"
                    >
                      Full Modal
                    </button>
                  )}
                </div>
                <div className="space-y-1 mt-1 max-h-56 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {channels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedChannel(ch);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        selectedChannel?.id === ch.id
                          ? "bg-red-950/40 text-white border border-red-900/40 font-bold"
                          : "hover:bg-neutral-800/60 text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={ch.thumbnail || "https://lh3.googleusercontent.com/a/default-user"}
                          alt={ch.title}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <div className="truncate text-xs">
                          <div className="truncate font-bold font-sans">{ch.title}</div>
                          <div className="text-[10px] text-neutral-500">{ch.custom_url || `@${ch.id}`}</div>
                        </div>
                      </div>
                      {selectedChannel?.id === ch.id && (
                        <Check className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-neutral-950/80 border border-neutral-850 text-neutral-300 text-xs font-mono flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPublishing ? "bg-amber-400 animate-ping" : isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{isPublishing ? "Publishing Active" : isConnected ? "YouTube Connected" : "Disconnected"}</span>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnectYouTube}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/30 transition-all font-mono active:scale-98 flex items-center gap-1.5 cursor-pointer"
            >
              <Youtube className={`w-4 h-4 ${isConnecting ? "animate-spin" : ""}`} />
              <span>{isConnecting ? "Connecting..." : "Connect YouTube"}</span>
            </button>
          ) : (
            onOpenChannelModal && (
              <button
                onClick={onOpenChannelModal}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-mono text-xs font-bold rounded-xl border border-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Youtube className="w-3.5 h-3.5 text-red-400" />
                <span>Switch Channel</span>
              </button>
            )
          )}

          <button
            onClick={fetchProfileDetails}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl transition-all cursor-pointer"
            title="Refresh YouTube Profile & Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Disconnected Alert Banner */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-amber-950/40 via-red-950/20 to-neutral-950 p-4 border-b border-amber-900/30 flex items-center justify-between gap-4 animate-fade-in font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/60 border border-amber-800/50 rounded-xl text-amber-400 shrink-0">
              <Youtube className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 font-sans">
                YouTube Integration Not Connected
              </div>
              <div className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Click <strong className="text-amber-200">Connect YouTube</strong> above to authorize YouTube and select your channel.
              </div>
            </div>
          </div>
          <button
            onClick={handleConnectYouTube}
            disabled={isConnecting}
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-60 text-amber-300 font-mono text-xs font-bold rounded-xl border border-amber-500/30 transition-all shrink-0"
          >
            {isConnecting ? "Connecting..." : "Connect Now →"}
          </button>
        </div>
      )}


      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-900 border-t border-neutral-900/50 bg-neutral-950/40 font-mono">
        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-950/30 text-red-400 border border-red-900/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase">Subscribers</div>
            <div className="text-xs font-black text-white">{activeSubscribers}</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/30 text-purple-400 border border-purple-900/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase">Lifetime Views</div>
            <div className="text-xs font-black text-white">{activeViews}</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/30 text-indigo-400 border border-indigo-900/30">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase">Videos Uploaded</div>
            <div className="text-xs font-black text-white">{activeVideos}</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 font-bold uppercase">API Quota Health</div>
            <div className="text-xs font-black text-emerald-400">97.6% Free</div>
          </div>
        </div>
      </div>
    </div>
  );
}
