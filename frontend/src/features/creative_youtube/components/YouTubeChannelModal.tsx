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
  Radio,
  Eye,
  Video,
  Sparkles,
  Zap,
  TrendingUp,
  Globe,
  BadgeCheck,
} from "lucide-react";

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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "brand">("all");

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
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/channels", {
        headers: { Authorization: `Bearer ${token}` },
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
      const msg = "Could not load your YouTube channels. Make sure YouTube is connected.";
      setError(msg);
      addNotification?.(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeYouTube = async () => {
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
          addNotification?.("Opening Google account & Brand Account chooser…", "info");
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
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
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
        setLookupError(data.detail || "No YouTube channel found matching this handle/ID.");
      }
    } catch {
      setLookupError("Network error during channel lookup. Please check the handle and retry.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddPreviewChannel = () => {
    if (!previewChannel) return;
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === previewChannel.id);
      if (exists) {
        return prev.map((c) => (c.id === previewChannel.id ? { ...c, ...previewChannel } : c));
      }
      return [previewChannel, ...prev];
    });
    setSelectedId(previewChannel.id);
    addNotification?.(`Added channel: ${previewChannel.title}`, "success");
    setPreviewChannel(null);
    setLookupQuery("");
    setShowLookupDrawer(false);
  };

  const handleDeleteChannel = async (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(channelId);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
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
      addNotification?.(`✅ Connected active YouTube channel: ${ch.title}`, "success");
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

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchesSearch =
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ch.custom_url && ch.custom_url.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ch.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === "active") return ch.is_selected === 1 || ch.id === selectedId;
      if (filterType === "brand") return ch.type === "brand";
      return true;
    });
  }, [channels, searchQuery, filterType, selectedId]);

  const selectedChannelObj = channels.find((c) => c.id === selectedId);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6" data-modal="true">
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
              <div className="relative p-2.5 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl text-white shadow-lg shadow-red-500/20 ring-1 ring-white/20">
                <Youtube className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" />
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
                  Choose, manage, and sync your YouTube channels & Brand Accounts
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

          {/* Action Toolbar */}
          {!isLoading && !needsReauth && channels.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-neutral-800/40">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, @handle, or ID..."
                  className="w-full bg-neutral-900/90 border border-neutral-800 focus:border-red-500/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLookupDrawer(!showLookupDrawer)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border ${
                    showLookupDrawer
                      ? "bg-red-950/50 border-red-700/60 text-red-300"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{showLookupDrawer ? "Close Search" : "Add by @Handle"}</span>
                </button>

                <button
                  onClick={handleAuthorizeYouTube}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-900/60 to-purple-800/40 hover:from-purple-900 hover:to-purple-700 border border-purple-700/50 rounded-xl text-xs font-mono font-bold text-purple-200 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-60"
                  title="Connect another YouTube Brand Account via Google"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isConnecting ? "Opening…" : "+ Link Brand Account"}</span>
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
                  Example: @MotivationNow or UC...
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
                  {isLookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
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
                      <div className="text-xs font-bold text-white truncate">{previewChannel.title}</div>
                      <div className="text-[11px] text-neutral-400 font-mono truncate">{previewChannel.custom_url || previewChannel.id}</div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {previewChannel.subscriber_count} subscribers • {previewChannel.video_count} videos
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
                Discovering your YouTube channels & Brand Accounts…
              </p>
            </div>
          ) : needsReauth ? (
            /* ── Needs Authorization State ── */
            <div className="flex flex-col items-center py-8 px-4 gap-5 text-center">
              <div className="p-4 bg-purple-950/40 border border-purple-800/50 rounded-3xl text-purple-400 shadow-xl shadow-purple-950/30">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-white font-sans">
                  {reauthMessage.includes("re-authorize")
                    ? "YouTube Re-authorization Required"
                    : "Connect YouTube Channel"}
                </h3>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  Sonikoma uses the YouTube Data API to publish webtoon video recaps and analytics. Sign in with Google to choose your channel or Brand Account.
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
                <span>Google OAuth 2.0 Verified • Direct YouTube Data API v3 integration</span>
              </div>
            </div>
          ) : error ? (
            /* ── Error State ── */
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="p-3.5 bg-amber-950/40 border border-amber-900/50 rounded-2xl text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-xs text-neutral-300 font-mono text-center max-w-md">{error}</p>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/50 border border-purple-800/60 rounded-xl text-xs text-purple-300 hover:text-white font-mono transition-all cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {isConnecting ? "Opening…" : "Re-authorize in Google"}
                </button>
              </div>
            </div>
          ) : channels.length === 0 ? (
            /* ── No Channels Found ── */
            <div className="flex flex-col items-center py-8 px-4 gap-4 text-center">
              <div className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-400">
                <Youtube className="w-9 h-9" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-sm font-bold text-white font-sans">No Channels Found on Account</h3>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                  Choose another Google Brand Account or enter your channel handle directly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-3 max-w-md">
                <button
                  onClick={handleAuthorizeYouTube}
                  disabled={isConnecting}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg border border-red-500/30 transition-all font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isConnecting ? "Opening Google…" : "Choose Channel in Google"}</span>
                </button>
                <button
                  onClick={() => setShowLookupDrawer(true)}
                  className="w-full sm:w-auto py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find by Handle</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Channel List ── */
            <div className="space-y-3.5">
              {/* Channels List Header & Filters */}
              <div className="flex items-center justify-between px-1">
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
                <div className="flex items-center gap-1 p-0.5 bg-neutral-900/90 border border-neutral-800 rounded-lg">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                      filterType === "all" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType("active")}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                      filterType === "active" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilterType("brand")}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                      filterType === "brand" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Brand
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
                        <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-red-500 to-purple-500" />
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
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />}
                        </div>

                        {/* Channel Avatar Thumbnail */}
                        <div className="relative shrink-0">
                          {ch.thumbnail ? (
                            <img
                              src={ch.thumbnail}
                              alt={ch.title}
                              className="w-13 h-13 rounded-2xl object-cover border border-neutral-700/80 shadow-md group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700 shrink-0">
                              <Youtube className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          {isDbActive && (
                            <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-black ring-2 ring-neutral-950" title="Active channel">
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
                            {isDbActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 shadow-sm">
                                <BadgeCheck className="w-3 h-3" /> Active
                              </span>
                            )}
                            {ch.type === "brand" && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 text-[9px] font-mono shrink-0">
                                Brand
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            {ch.custom_url && (
                              <span className="text-xs text-neutral-300 font-mono truncate">
                                {ch.custom_url}
                              </span>
                            )}
                            <button
                              onClick={(e) => handleCopy(ch.custom_url || ch.id, ch.id, e)}
                              className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5"
                              title="Copy handle / ID"
                            >
                              {copiedId === ch.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Stats Pills */}
                          <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] font-mono">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-300">
                              <Users className="w-3 h-3 text-red-400" />
                              <span>{ch.subscriber_count && ch.subscriber_count !== "--" ? `${ch.subscriber_count} subs` : "0 subs"}</span>
                            </span>

                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-300">
                              <Video className="w-3 h-3 text-purple-400" />
                              <span>{ch.video_count || "0"} videos</span>
                            </span>

                            {ch.view_count && ch.view_count !== "--" && ch.view_count !== "0" && (
                              <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 text-neutral-400">
                                <Eye className="w-3 h-3 text-sky-400" />
                                <span>{ch.view_count} views</span>
                              </span>
                            )}
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
                            className="p-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
                            title="Open channel on YouTube ↗"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete / Unlink Button */}
                          <button
                            onClick={(e) => handleDeleteChannel(ch.id, e)}
                            disabled={deletingId === ch.id}
                            className="p-2 rounded-xl bg-neutral-950/80 hover:bg-red-950/50 border border-neutral-800 hover:border-red-800 text-neutral-500 hover:text-red-400 transition-all cursor-pointer"
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

              {/* Selected Channel Summary Card */}
              {selectedChannelObj && (
                <div className="mt-4 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Publishing Target: <span className="text-white font-black">{selectedChannelObj.title}</span>
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-neutral-400">
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">Channel ID</div>
                      <div className="text-neutral-300 truncate font-mono mt-0.5">{selectedChannelObj.id}</div>
                    </div>
                    <div className="p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">Content ID Guard</div>
                      <div className="text-emerald-400 font-bold mt-0.5">Pre-scan Active</div>
                    </div>
                    <div className="hidden sm:block p-2 bg-neutral-950/80 border border-neutral-800/60 rounded-xl">
                      <div className="text-[10px] text-neutral-500 uppercase">Quota Pool</div>
                      <div className="text-purple-400 font-bold mt-0.5">10,000 Units/day</div>
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
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-400" : ""}`} />
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
              className="relative group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 hover:from-red-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-all shadow-[0_4px_20px_rgba(239,68,68,0.3)] border border-red-500/40 cursor-pointer font-mono overflow-hidden"
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