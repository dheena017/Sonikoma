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
    if (hasCustomCredentials) {
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
    <div className="space-y-2">
      <label className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-2">
        <ListMusic className="h-4 w-4 text-purple-400" />
        Add to Playlist
      </label>
      <div className="relative">
        <select
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
          className="w-full bg-neutral-950/40 hover:bg-neutral-900/10 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:outline-none transition-all duration-250 cursor-pointer appearance-none shadow-inner"
        >
          <option value="" className="bg-neutral-950">-- No Playlist (Default) --</option>
          {playlists.map((pl) => (
            <option key={pl.id} value={pl.id} className="bg-neutral-950">
              {pl.title}
            </option>
          ))}
          {!hasCustomCredentials && (
            <option value="manual" disabled className="bg-neutral-950 text-neutral-600">
              (Connect API to fetch your playlists)
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
            <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
