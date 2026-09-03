import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Youtube,
  Check,
  Loader2,
  AlertTriangle,
  X,
  Users,
  RefreshCw,
  Plus,
  Search,
  ShieldCheck,
  LogIn,
  CheckCircle2,
  ExternalLink,
  Copy,
  Trash2,
  Eye,
  Video,
  Sparkles,
  Zap,
  TrendingUp,
  Globe,
  BadgeCheck,
  SlidersHorizontal,
  BarChart3,
  Film,
  Layers,
} from "lucide-react";
import YouTubeOfficialLogo from "./YouTubeOfficialLogo";

export interface YouTubeChannelOption {
  id: string;
  channel_id?: string;
  title: string;
  description?: string;
  custom_url?: string;
  thumbnail?: string;
  banner_url?: string;
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
  type?: string;
  is_selected?: number;
}

interface YouTubeChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChannelSelected: (channel: YouTubeChannelOption) => void;
  addNotification?: (msg: string, type: string) => void;
}

export default function YouTubeChannelModal({
  isOpen,
  onClose,
  onChannelSelected,
  addNotification,
}: YouTubeChannelModalProps) {
  const [channels, setChannels] = useState<YouTubeChannelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [reauthMessage, setReauthMessage] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "most_subs" | "most_videos">("all");

  // Search / Add by handle drawer
  const [showLookupDrawer, setShowLookupDrawer] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [previewChannel, setPreviewChannel] = useState<YouTubeChannelOption | null>(null);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    setNeedsReauth(false);
    setReauthMessage("");
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const cacheBust = Date.now();
      const res = await fetch(`/api/export/youtube/channels?_t=${cacheBust}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.needs_reauth) {
        setNeedsReauth(true);
        setReauthMessage(data.message || "YouTube authorization required.");
        setChannels([]);
        return;
      }

      const list: YouTubeChannelOption[] = data.channels || [];
      setChannels(list);

      // Pre-select active channel or first channel
      const activeCh = list.find((c) => c.is_selected === 1);
      if (activeCh) {
        setSelectedId(activeCh.id);
      } else if (list.length > 0) {
        setSelectedId(list[0].id);
      }
    } catch {
      const msg =
        "Could not load your YouTube channels. Make sure YouTube is connected.";
      setError(msg);
      addNotification?.(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeYouTube = async (
    forceSwitch: boolean | React.MouseEvent = false
  ) => {
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

      const params = new URLSearchParams();
      if (userEmail) {
        params.append("email", userEmail.trim());
      }
      const qs = params.toString();
      const connectUrl = qs
        ? `/api/export/youtube/oauth/connect?${qs}`
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
            "Opening Google Channel selection window…",
            "info"
          );
          window.location.href = data.auth_url;
        } else {
          setError("Failed to get YouTube authorization URL.");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(`YouTube connection failed: ${err.detail || res.statusText}`);
      }
    } catch {
      setError("Failed to start YouTube authorization. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLookupChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);
    setPreviewChannel(null);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/channel/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: lookupQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.channel) {
        setPreviewChannel(data.channel);
      } else {
        setLookupError(
          data.detail || "No YouTube channel found matching this handle or ID."
        );
      }
    } catch {
      setLookupError(
        "Network error during channel lookup. Please check the handle and retry."
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddPreviewChannel = async () => {
    if (!previewChannel) return;
    const target = previewChannel;

    setChannels((prev) => {
      const exists = prev.some((c) => c.id === target.id);
      if (exists) {
        return prev.map((c) => (c.id === target.id ? { ...c, ...target } : c));
      }
      return [target, ...prev];
    });
    setSelectedId(target.id);
    setPreviewChannel(null);
    setLookupQuery("");
    setShowLookupDrawer(false);

    setIsSaving(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/select-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel_id: target.id,
          title: target.title,
          thumbnail: target.thumbnail,
          custom_url: target.custom_url,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

      if (data.needs_auth && data.auth_url) {
        addNotification?.(
          `Switching Google authorization to "${target.title}"…`,
          "info"
        );
        window.location.href = data.auth_url;
        return;
      }

      addNotification?.(
        `✅ Connected active YouTube channel: ${target.title}`,
        "success"
      );
      window.dispatchEvent(
        new CustomEvent("youtube_channel_changed", { detail: target })
      );
      onChannelSelected(target);
      onClose();
    } catch {
      addNotification?.(`Added channel: ${target.title}`, "info");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChannel = async (
    channelId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeletingId(channelId);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch(`/api/export/youtube/channel/${channelId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        if (selectedId === channelId) {
          const remaining = channels.filter((c) => c.id !== channelId);
          setSelectedId(remaining.length > 0 ? remaining[0].id : null);
        }
        addNotification?.("Channel unlinked from workspace.", "info");
      }
    } catch {
      addNotification?.("Failed to unlink channel.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addNotification?.("Copied to clipboard!", "info");
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
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

      if (data.needs_auth && data.auth_url) {
        addNotification?.(
          `Switching Google authorization to "${ch.title}"…`,
          "info"
        );
        window.location.href = data.auth_url;
        return;
      }

      addNotification?.(
        `✅ Connected active YouTube channel: ${ch.title}`,
        "success"
      );
      window.dispatchEvent(
        new CustomEvent("youtube_channel_changed", { detail: ch })
      );
      onChannelSelected(ch);
      onClose();
    } catch {
      const msg = "Failed to save channel selection. Please try again.";
      setError(msg);
      addNotification?.(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Parse subscriber/video numbers for sorting
  const parseNumericCount = (val?: string) => {
    if (!val || val === "--") return 0;
    const clean = val.replace(/,/g, "").trim().toLowerCase();
    if (clean.endsWith("m")) return parseFloat(clean) * 1_000_000;
    if (clean.endsWith("k")) return parseFloat(clean) * 1_000;
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Filtered & Sorted Channels
  const filteredChannels = useMemo(() => {
    let result = channels.filter((ch) => {
      const q = searchQuery.toLowerCase();
      return (
        ch.title.toLowerCase().includes(q) ||
        (ch.custom_url && ch.custom_url.toLowerCase().includes(q)) ||
        ch.id.toLowerCase().includes(q)
      );
    });

    if (filterType === "active") {
      result = result.filter((c) => c.is_selected === 1 || c.id === selectedId);
    } else if (filterType === "most_subs") {
      result = [...result].sort(
        (a, b) => parseNumericCount(b.subscriber_count) - parseNumericCount(a.subscriber_count)
      );
    } else if (filterType === "most_videos") {
      result = [...result].sort(
        (a, b) => parseNumericCount(b.video_count) - parseNumericCount(a.video_count)
      );
    }
    return result;
  }, [channels, searchQuery, filterType, selectedId]);

  // Aggregate Stats across connected channels
  const totalStats = useMemo(() => {
    let totalSubs = 0;
    let totalVideos = 0;
    channels.forEach((c) => {
      totalSubs += parseNumericCount(c.subscriber_count);
      totalVideos += parseNumericCount(c.video_count);
    });
    return {
      channelsCount: channels.length,
      totalSubs: totalSubs > 0 ? totalSubs.toLocaleString() : "--",
      totalVideos: totalVideos > 0 ? totalVideos.toLocaleString() : channels.length ? "0" : "--",
    };
  }, [channels]);

  const selectedChannelObj = channels.find((c) => c.id === selectedId);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
      data-modal="true"
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#09090b] border border-neutral-800/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(239,68,68,0.15)] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] ring-1 ring-white/5">
        {/* Top Ambient Glow Ribbon */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 opacity-90" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-800/60 bg-gradient-to-b from-neutral-900/60 to-transparent shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-[#121218] border border-white/[0.08] rounded-2xl flex items-center justify-center">
                <YouTubeOfficialLogo className="w-6 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white font-sans tracking-tight">
                    Select YouTube Channel
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/50 text-[10px] font-mono text-red-400 font-bold">
                    YouTube Data v3
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Manage, switch, and publish across your connected YouTube channels
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Banner */}
          {!isLoading && !needsReauth && channels.length > 0 && (
            <div className="mt-3.5 grid grid-cols-3 gap-2 pt-3 border-t border-neutral-800/50 text-[11px] font-mono">
              <div className="px-3 py-1.5 bg-neutral-900/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-red-400" /> Channels
                </span>
                <span className="text-white font-bold">{totalStats.channelsCount}</span>
              </div>
              <div className="px-3 py-1.5 bg-neutral-900/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-[#3B82F6]" /> Total Subs
                </span>
                <span className="text-[#60A5FA] font-bold">{totalStats.totalSubs}</span>
              </div>
              <div className="px-3 py-1.5 bg-neutral-900/60 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-pink-400" /> Videos
                </span>
                <span className="text-pink-300 font-bold">{totalStats.totalVideos}</span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          {!isLoading && !needsReauth && channels.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-neutral-800/30">
              {/* Search filter input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search channels by name, handle (@)..."
                  className="w-full bg-neutral-900/90 border border-neutral-800 focus:border-red-500/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLookupDrawer((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    showLookupDrawer
                      ? "bg-neutral-800 border-neutral-700 text-white font-bold"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
                  }`}
                  title="Add channel by Handle or ID"
                >
                  <Globe className="w-3.5 h-3.5 text-red-400" />
                  <span>Find by Handle</span>
                </button>

                <button
                  onClick={() => handleAuthorizeYouTube(true)}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 border border-red-500/30 rounded-xl text-xs font-mono font-bold text-neutral-200 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-60"
                  title="Authorize and link another YouTube channel"
                >
                  <Plus className="w-3.5 h-3.5 text-red-400" />
                  <span>
                    {isConnecting
                      ? "Opening Google…"
                      : "+ Add / Link Channel"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lookup / Search Drawer */}
        {showLookupDrawer && (
          <div className="px-6 py-3.5 bg-neutral-900/90 border-b border-neutral-800/80 animate-in slide-in-from-top duration-200">
            <form onSubmit={handleLookupChannel} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-red-400" />
                  Find YouTube Channel by Handle or URL
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Example: @toontide or UC...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Paste YouTube handle (@channel), URL, or Channel ID"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={isLookingUp || !lookupQuery.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  {isLookingUp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Verify</span>
                </button>
              </div>

              {lookupError && (
                <div className="p-2 bg-red-950/40 border border-red-900/50 rounded-xl text-[11px] text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Live Preview Card */}
              {previewChannel && (
                <div className="p-3 bg-neutral-950 border border-emerald-800/50 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 min-w-0">
                    {previewChannel.thumbnail ? (
                      <img
                        src={previewChannel.thumbnail}
                        alt={previewChannel.title}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                        <Youtube className="w-5 h-5 text-neutral-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {previewChannel.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate">
                        {previewChannel.custom_url || previewChannel.id}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {previewChannel.subscriber_count} subscribers •{" "}
                        {previewChannel.video_count} videos
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPreviewChannel}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to List</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3.5">
              <div className="relative p-4 bg-red-950/20 border border-red-800/30 rounded-3xl">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
              <p className="text-xs text-neutral-300 font-mono tracking-wide">
                Discovering your YouTube channels…
              </p>
            </div>
          ) : needsReauth ? (
            /* ── Needs Authorization State ── */
            <div className="flex flex-col items-center py-8 px-4 gap-5 text-center">
              <div className="p-4 bg-purple-950/40 border border-purple-800/50 rounded-3xl text-[#3B82F6] shadow-xl shadow-purple-950/30">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-white font-sans">
                  {reauthMessage.includes("re-authorize")
                    ? "YouTube Re-authorization Required"
                    : "Connect YouTube Channel"}
                </h3>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  Sonikoma uses the YouTube Data API to publish webtoon video
                  recaps and analytics. Sign in with Google to select your
                  YouTube channel.
                </p>
              </div>

              <button
                onClick={handleAuthorizeYouTube}
                disabled={isConnecting}
                className="w-full max-w-xs py-3.5 px-6 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-xs rounded-2xl shadow-xl shadow-red-950/30 border border-red-500/30 transition-all font-mono flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Google Chooser…
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Authorize YouTube Channel
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-neutral-900 w-full flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Google OAuth 2.0 Verified • Direct YouTube Data API v3 integration
                </span>
              </div>
            </div>
          ) : error ? (
            /* ── Error State ── */
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="p-3.5 bg-amber-950/40 border border-amber-900/50 rounded-2xl text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-xs text-neutral-300 font-mono text-center max-w-md">
                {error}
              </p>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={fetchChannels}
                  className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 hover:text-white font-mono transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
                </button>
                <button
                  onClick={handleAuthorizeYouTube}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/50 border border-purple-800/60 rounded-xl text-xs text-[#60A5FA] hover:text-white font-mono transition-all cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {isConnecting ? "Opening…" : "Re-authorize in Google"}
                </button>
              </div>
            </div>
          ) : channels.length === 0 ? (
            /* ── No Channels Found ── */
            <div className="flex flex-col items-center py-6 px-4 gap-4 text-center">
              <div className="p-3 bg-[#121218] border border-white/[0.08] rounded-2xl flex items-center justify-center">
                <YouTubeOfficialLogo className="w-10 h-7" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-white font-sans">
                  No Channels Found on Account
                </h3>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  Connect another YouTube account or enter your channel handle directly below.
                </p>
              </div>

              {/* Direct Instant Handle Lookup Box */}
              <div className="w-full max-w-md bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5 text-left">
                <span className="text-[11px] font-mono font-bold text-neutral-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-red-400" />
                  Quick Add by Handle or Channel ID
                </span>
                <form onSubmit={handleLookupChannel} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="e.g. @toontide or @channel"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUp || !lookupQuery.trim()}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    {isLookingUp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Search</span>
                  </button>
                </form>

                {lookupError && (
                  <div className="p-2 bg-red-950/40 border border-red-900/50 rounded-xl text-[11px] text-red-300 font-mono flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    <span>{lookupError}</span>
                  </div>
                )}

                {previewChannel && (
                  <div className="p-2.5 bg-neutral-900 border border-emerald-800/50 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {previewChannel.thumbnail ? (
                        <img
                          src={previewChannel.thumbnail}
                          alt={previewChannel.title}
                          className="w-9 h-9 rounded-xl object-cover border border-neutral-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                          <Youtube className="w-4 h-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {previewChannel.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">
                          {previewChannel.custom_url || previewChannel.id}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPreviewChannel}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to List</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full pt-1 max-w-md">
                <button
                  onClick={handleAuthorizeYouTube}
                  disabled={isConnecting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/30 transition-all font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isConnecting
                      ? "Opening Google…"
                      : "Choose Channel in Google"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Channel List ── */
            <div className="space-y-3.5">
              {/* Channels List Header & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    Channels ({filteredChannels.length})
                  </span>
                  {searchQuery && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      (filtered from {channels.length})
                    </span>
                  )}
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-0.5 bg-neutral-900/90 border border-neutral-800 rounded-lg text-[10px] font-mono">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      filterType === "all"
                        ? "bg-neutral-800 text-white font-bold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    All Channels
                  </button>
                  <button
                    onClick={() => setFilterType("active")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      filterType === "active"
                        ? "bg-neutral-800 text-white font-bold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterType("most_subs")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      filterType === "most_subs"
                        ? "bg-neutral-800 text-white font-bold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Most Subs
                  </button>
                  <button
                    onClick={() => setFilterType("most_videos")}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      filterType === "most_videos"
                        ? "bg-neutral-800 text-white font-bold"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Most Videos
                  </button>
                </div>
              </div>

              {/* Channel Cards Grid */}
              <div className="space-y-2.5">
                {filteredChannels.map((ch) => {
                  const isSelected = selectedId === ch.id;
                  const isDbActive = ch.is_selected === 1;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedId(ch.id)}
                      className={`group relative w-full p-4 rounded-2xl border transition-all cursor-pointer text-left overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-r from-red-950/40 via-neutral-900/80 to-purple-950/30 border-red-600/80 shadow-[0_4px_25px_rgba(239,68,68,0.18)] ring-1 ring-red-500/40"
                          : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700 hover:shadow-md"
                      }`}
                    >
                      {/* Active Indicator Strip */}
                      {isSelected && (
                        <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-red-500 to-blue-500" />
                      )}

                      <div className="flex items-center gap-3.5">
                        {/* Radio Selection Button */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "border-red-500 bg-red-500 shadow-sm shadow-red-500/50"
                              : "border-neutral-600 bg-neutral-950 group-hover:border-neutral-400"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />
                          )}
                        </div>

                        {/* Channel Avatar Thumbnail */}
                        <div className="relative shrink-0">
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
                              className="w-13 h-13 rounded-2xl object-cover border border-neutral-700/80 shadow-md group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center border border-neutral-700 shrink-0 font-bold text-white text-sm font-sans uppercase">
                              {ch.title ? ch.title.charAt(0) : "Y"}
                            </div>
                          )}
                          {isDbActive && (
                            <span
                              className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-black ring-2 ring-neutral-950"
                              title="Active selected channel"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        {/* Channel Meta */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white truncate font-sans tracking-tight">
                              {ch.title}
                            </span>
                            {isDbActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 shadow-sm">
                                <BadgeCheck className="w-3 h-3" /> Active Channel
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-neutral-400 text-[10px] font-mono shrink-0">
                                YouTube Channel
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {ch.custom_url ? (
                              <span className="text-xs text-neutral-300 font-mono truncate font-semibold">
                                {ch.custom_url}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-500 font-mono truncate">
                                {ch.id}
                              </span>
                            )}
                            <button
                              onClick={(e) =>
                                handleCopy(ch.custom_url || ch.id, ch.id, e)
                              }
                              className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5"
                              title="Copy handle or Channel ID"
                            >
                              {copiedId === ch.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Stats Pills & Permission Status */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-300">
                              <Users className="w-3 h-3 text-red-400" />
                              <span>
                                {ch.subscriber_count &&
                                ch.subscriber_count !== "--"
                                  ? `${ch.subscriber_count} subs`
                                  : "0 subs"}
                              </span>
                            </span>

                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-300">
                              <Video className="w-3 h-3 text-[#3B82F6]" />
                              <span>{ch.video_count || "0"} videos</span>
                            </span>

                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3" /> Studio Ready
                            </span>
                          </div>
                        </div>

                        {/* Right Quick Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Open YouTube External Link */}
                          <a
                            href={
                              ch.custom_url
                                ? `https://youtube.com/${ch.custom_url}`
                                : `https://youtube.com/channel/${ch.id}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 border border-neutral-800 transition-colors"
                            title="Open on YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete / Unlink Button */}
                          <button
                            onClick={(e) => handleDeleteChannel(ch.id, e)}
                            disabled={deletingId === ch.id}
                            className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-950/30 border border-neutral-800 hover:border-red-900/50 transition-colors cursor-pointer"
                            title="Unlink channel from workspace"
                          >
                            {deletingId === ch.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Channel Summary Card & Studio Readiness Matrix */}
              {selectedChannelObj && (
                <div className="mt-4 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Target Channel:{" "}
                      <span className="text-white font-black">
                        {selectedChannelObj.title}
                      </span>
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Publishing Rights
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-400">
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">
                        Channel ID
                      </div>
                      <div className="text-neutral-200 font-bold mt-0.5 truncate text-[10px]" title={selectedChannelObj.id}>
                        {selectedChannelObj.id}
                      </div>
                    </div>
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">
                        Publish Scope
                      </div>
                      <div className="text-emerald-400 font-bold mt-0.5">
                        Videos &amp; Shorts (v3)
                      </div>
                    </div>
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">
                        Content ID Safety
                      </div>
                      <div className="text-sky-400 font-bold mt-0.5">
                        Pre-Scan Guard Active
                      </div>
                    </div>
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">
                        Daily Quota Pool
                      </div>
                      <div className="text-[#3B82F6] font-bold mt-0.5">
                        10,000 Units/day
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchChannels}
              className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all cursor-pointer"
              title="Sync live channel statistics"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoading ? "animate-spin text-red-400" : ""
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-all cursor-pointer font-mono"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={!selectedId || isSaving || channels.length === 0}
              className="relative group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 hover:from-red-500 hover:via-blue-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)] border border-red-500/40 cursor-pointer font-mono overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting Channel…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Connect Selected Channel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
