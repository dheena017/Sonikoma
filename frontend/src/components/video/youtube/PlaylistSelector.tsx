import React, { useEffect, useState } from "react";
import { ListMusic, Loader2 } from "lucide-react";

interface PlaylistSelectorProps {
  playlist: string;
  setPlaylist: (val: string) => void;
  hasCustomCredentials: boolean;
}

export default function PlaylistSelector({
  playlist,
  setPlaylist,
  hasCustomCredentials,
}: PlaylistSelectorProps) {
  const [playlists, setPlaylists] = useState<{ id: string; title: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, we would fetch from YouTube API if authenticated.
    // For now, we'll provide a placeholder or mock behavior.
    if (hasCustomCredentials) {
      // Mocking dynamic fetch
      setIsLoading(true);
      setTimeout(() => {
        setPlaylists([
          { id: "PL1", title: "Webtoon Recaps" },
          { id: "PL2", title: "Action Manhwa" },
          { id: "PL3", title: "Romance Stories" },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [hasCustomCredentials]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-neutral-400 font-bold flex items-center gap-1.5">
        <ListMusic className="h-3.5 w-3.5 text-purple-400" />
        Add to Playlist
      </label>
      <div className="relative">
        <select
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
          className="w-full bg-black/50 border border-neutral-855 rounded-xl px-4 py-3 text-xs text-neutral-305 focus:outline-none focus:border-purple-500/80 transition-all cursor-pointer appearance-none"
        >
          <option value="">-- No Playlist (Default) --</option>
          {playlists.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.title}
            </option>
          ))}
          {!hasCustomCredentials && (
            <option value="manual" disabled>
              (Connect API to fetch your playlists)
            </option>
          )}
        </select>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
