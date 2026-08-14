import React, { useEffect, useState } from "react";
import { ListMusic, Loader2, Plus, RefreshCw, Check, FolderPlus, X } from "lucide-react";

interface Playlist {
  id: string;
  title: string;
  description?: string;
  item_count?: number;
  thumbnail?: string;
  privacy?: string;
}

interface PlaylistSelectorProps {
  playlist: string;
  setPlaylist: (val: string) => void;
  hasCustomCredentials?: boolean;
  addNotification?: (msg: string, type: any) => void;
}

export default function PlaylistSelector({
  playlist,
  setPlaylist,
  hasCustomCredentials,
  addNotification,
}: PlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrivacy, setNewPrivacy] = useState("public");

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.warn("Failed to fetch YouTube playlists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          privacy: newPrivacy,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.playlist;
        if (created && created.id) {
          setPlaylists((prev) => [created, ...prev]);
          setPlaylist(created.id);
          setShowCreateModal(false);
          setNewTitle("");
          setNewDescription("");
          if (addNotification) {
            addNotification(`Created playlist "${created.title}" successfully!`, "success");
          }
        }
      } else {
        const err = await res.json().catch(() => ({}));
        if (addNotification) {
          addNotification(err.detail || "Failed to create playlist on YouTube", "error");
        }
      }
    } catch (err) {
      console.error("Error creating playlist:", err);
      if (addNotification) {
        addNotification("Network error creating playlist", "error");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-red-400" />
          <span>Add to Playlist</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPlaylists}
            disabled={isLoading}
            className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Refresh playlists from YouTube"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-red-400" : ""}`} />
            <span>Sync</span>
          </button>
          <span className="text-neutral-700">·</span>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="text-[11px] font-mono text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <select
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
          className="w-full bg-neutral-950/70 border border-neutral-700 hover:border-neutral-600 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-3 text-xs text-neutral-200 focus:outline-none transition-all cursor-pointer appearance-none shadow-inner font-mono"
        >
          <option value="" className="bg-neutral-950 text-neutral-400">
            -- No Playlist (Upload as Standalone Video) --
          </option>
          {playlists.map((pl) => (
            <option key={pl.id} value={pl.id} className="bg-neutral-950 text-white">
              {pl.title} {pl.item_count !== undefined ? `(${pl.item_count} videos)` : ""}
            </option>
          ))}
          {playlists.length === 0 && !isLoading && (
            <option value="none_available" disabled className="bg-neutral-950 text-neutral-500">
              (No playlists found on YouTube channel - Click "New Playlist" to create one)
            </option>
          )}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3.5 w-3.5 text-red-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Inline Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-white font-sans tracking-tight">
                  Create YouTube Playlist
                </h4>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider block">
                  Playlist Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solo Leveling Manhwa Chapters"
                  className="w-full bg-neutral-950/70 border border-neutral-700 focus:border-red-500/70 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description for this playlist on your channel"
                  className="w-full bg-neutral-950/70 border border-neutral-700 focus:border-red-500/70 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-neutral-300 font-bold uppercase tracking-wider block">
                  Privacy
                </label>
                <select
                  value={newPrivacy}
                  onChange={(e) => setNewPrivacy(e.target.value)}
                  className="w-full bg-neutral-950/70 border border-neutral-700 focus:border-red-500/70 rounded-xl px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none font-mono cursor-pointer"
                >
                  <option value="public">Public - Anyone can find and view</option>
                  <option value="unlisted">Unlisted - Only with link</option>
                  <option value="private">Private - Only you</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Playlist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
