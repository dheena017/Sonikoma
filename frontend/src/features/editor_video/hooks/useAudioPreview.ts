import { useState, useRef } from "react";

export const useAudioPreview = () => {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayTrack = (trackId: string, audioUrl?: string) => {
    if (playingTrackId === trackId) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(trackId);
      // Fallback demo chime if no url provided
      const dummyAudio = new Audio(audioUrl || "https://actions.google.com/sounds/v1/cartoon/clink_clank.ogg");
      audioRef.current = dummyAudio;
      dummyAudio.play().catch(() => {});
      dummyAudio.onended = () => setPlayingTrackId(null);
    }
  };

  return {
    playingTrackId,
    togglePlayTrack,
  };
};
