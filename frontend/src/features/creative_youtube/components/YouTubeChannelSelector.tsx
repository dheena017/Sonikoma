import React, { useState, useEffect } from "react";
import { Youtube, RefreshCw, CheckCircle2, User, ChevronDown } from "lucide-react";

export interface YouTubeChannel {
  id: string;
  title: string;
  description?: string;
  custom_url?: string;
  thumbnail?: string;
  subscriber_count?: string;
  video_count?: string;
}

interface YouTubeChannelSelectorProps {
  selectedChannelId?: string;
  onSelectChannel: (channel: YouTubeChannel) => void;
  addNotification?: (msg: string, type: "info" | "success" | "error" | "warning") => void;
}

export default function YouTubeChannelSelector({
  selectedChannelId,
  onSelectChannel,
  addNotification,
}: YouTubeChannelSelectorProps) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/channels", {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch YouTube channels`);
      }

      const data = await res.json();
      const channelList: YouTubeChannel[] = data.channels || [];

      setChannels(channelList);
      if (channelList.length > 0) {
        // If none selected, default to the first channel
        const current = channelList.find((c) => c.id === selectedChannelId) || channelList[0];
        onSelectChannel(current);
        if (addNotification) {
          addNotification(`Found ${channelList.length} YouTube channel(s) linked to your Google Account.`, "success");
        }
      } else {
        setError("No YouTube channels found for this Google Account.");
      }
    } catch (err: any) {
      console.warn("YouTube channel fetch notice:", err.message);
      setError("Unable to load channels. Sign in with Google to load live accounts.");
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  return (
    <div className="bg-neutral-950/50 backdrop-blur-md p-5 border border-neutral-900 rounded-2xl space-y-3 font-mono text-xs text-neutral-300 transition-all duration-300 hover:border-neutral-800 shadow-xl">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-400">
            <Youtube className="h-4 w-4" />
          </div>
          <div>
            <span className="text-white font-bold text-xs block font-sans">
              Target YouTube Channel / Brand Account
            </span>
            <span className="text-[10px] text-neutral-500 block font-sans">
              Choose which YouTube channel under your Google email to publish to
            </span>
          </div>
        </div>

        <button
          onClick={fetchChannels}
          disabled={isLoading}
          className="p-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          title="Refresh connected YouTube channels"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-purple-400" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-neutral-500 text-[11px] animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
          Fetching YouTube channels for your Google Account...
        </div>
      ) : activeChannel ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-850 hover:border-purple-500/50 rounded-xl transition-all duration-200 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {activeChannel.thumbnail ? (
                <img
                  src={activeChannel.thumbnail}
                  alt={activeChannel.title}
                  className="w-8 h-8 rounded-full border border-neutral-750 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-100 font-bold text-xs truncate group-hover:text-purple-300 transition-colors">
                    {activeChannel.title}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-red-950/40 text-red-400 border border-red-900/30 rounded">
                    Active
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 flex items-center gap-2 font-sans truncate">
                  {activeChannel.custom_url && (
                    <span>{activeChannel.custom_url}</span>
                  )}
                  {activeChannel.subscriber_count && (
                    <span>• {activeChannel.subscriber_count} subscribers</span>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-neutral-400 group-hover:text-white transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-neutral-950 border border-neutral-850 rounded-xl shadow-2xl overflow-hidden py-1 divide-y divide-neutral-900">
              <div className="px-3 py-1.5 text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                Available Channels ({channels.length})
              </div>
              {channels.map((ch) => {
                const isSelected = ch.id === activeChannel.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      onSelectChannel(ch);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-purple-950/20 text-purple-200" : "hover:bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ch.thumbnail ? (
                        <img
                          src={ch.thumbnail}
                          alt={ch.title}
                          className="w-7 h-7 rounded-full border border-neutral-800 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-850 border border-neutral-750 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{ch.title}</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {ch.custom_url || ch.id}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl text-[11px] text-neutral-400 text-center font-sans">
          {error || "No YouTube channels detected."}
        </div>
      )}
    </div>
  );
}
