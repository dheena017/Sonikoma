import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Youtube, Check, Loader2, AlertTriangle, X, Users, RefreshCw, ExternalLink } from "lucide-react";

export interface YouTubeChannelOption {
  id: string;
  title: string;
  description?: string;
  custom_url?: string;
  thumbnail?: string;
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
}

interface YouTubeChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelSelected: (channel: YouTubeChannelOption) => void;
}

export default function YouTubeChannelModal({
  isOpen,
  onClose,
  onChannelSelected,
}: YouTubeChannelModalProps) {
  const [channels, setChannels] = useState<YouTubeChannelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/channels", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: YouTubeChannelOption[] = data.channels || [];
      setChannels(list);
      if (list.length === 1) setSelectedId(list[0].id);
    } catch {
      setError("Could not load your YouTube channels. Make sure YouTube is connected.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchChannels();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleConnect = async () => {
    if (!selectedId) return;
    const ch = channels.find((c) => c.id === selectedId);
    if (!ch) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/select-channel", {
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
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onChannelSelected(ch);
      onClose();
    } catch {
      setError("Failed to save channel selection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" data-modal="true">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-gradient-to-r from-red-950/60 via-neutral-950 to-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/60 border border-red-900/40 rounded-xl text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white font-sans">Select YouTube Channel</h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Choose which channel to connect to Sonikoma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
              <p className="text-xs text-neutral-400 font-mono">Loading your YouTube channels...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="p-3 bg-amber-950/40 border border-amber-900/40 rounded-2xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-300 font-mono text-center">{error}</p>
              <button
                onClick={fetchChannels}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 hover:text-white font-mono cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          ) : channels.length === 0 ? (
            <div className="flex flex-col items-center py-6 px-4 gap-4 text-center">
              <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-400">
                <Youtube className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white font-sans">No YouTube Channel Found</h3>
                <p className="text-xs text-neutral-400 font-mono max-w-sm leading-relaxed">
                  This Google account does not have a YouTube channel created yet, or the YouTube Data API is disabled in your Google Cloud Console.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
                <a
                  href="https://www.youtube.com/create_channel"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/30 transition-all font-mono flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Create Channel on YouTube ↗</span>
                </a>
                <button
                  onClick={fetchChannels}
                  className="w-full sm:w-auto py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-900 w-full flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span>Wrong Google Account?</span>
                <a
                  href="/api/export/youtube/oauth/connect"
                  className="text-purple-400 hover:text-purple-300 font-bold underline"
                >
                  Switch Account →
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-500 font-bold font-mono uppercase px-1">
                {channels.length} channel{channels.length !== 1 ? "s" : ""} found
              </p>
              {channels.map((ch) => {
                const isSelected = selectedId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedId(ch.id)}
                    className={
                      "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer text-left " +
                      (isSelected
                        ? "bg-red-950/30 border-red-800/60 shadow-md"
                        : "bg-neutral-900/60 border-neutral-800/50 hover:bg-neutral-900 hover:border-neutral-700")
                    }
                  >
                    <div
                      className={
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 " +
                        (isSelected ? "border-red-500 bg-red-500" : "border-neutral-600")
                      }
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    {ch.thumbnail ? (
                      <img
                        src={ch.thumbnail}
                        alt={ch.title}
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                        <Youtube className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm text-white truncate font-sans">{ch.title}</div>
                      {ch.custom_url && (
                        <div className="text-[11px] text-neutral-400 font-mono truncate">{ch.custom_url}</div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {ch.subscriber_count && (
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                            <Users className="w-3 h-3" />
                            {ch.subscriber_count}
                          </span>
                        )}
                        {ch.video_count && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {ch.video_count} videos
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && channels.length === 0 && (
          <div className="px-5 py-3.5 border-t border-neutral-900 bg-neutral-950/80 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all cursor-pointer font-mono"
            >
              Close
            </button>
          </div>
        )}

        {!isLoading && !error && channels.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-900 bg-neutral-950/80 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all cursor-pointer font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={!selectedId || isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-all shadow-lg border border-red-500/30 cursor-pointer font-mono"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Youtube className="w-3.5 h-3.5" />
                  Connect Selected Channel
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}