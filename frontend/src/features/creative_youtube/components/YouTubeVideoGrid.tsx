import React, { useEffect, useState } from "react";
import {
  Film,
  Eye,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { YouTubeCommentsViewer } from "./YouTubeCommentsViewer";

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description?: string;
  published_at?: string;
  thumbnail: string;
  view_count: string;
  like_count: string;
  comment_count: string;
  privacy_status: string;
  youtube_url: string;
}

export default function YouTubeVideoGrid() {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCommentVideoId, setActiveCommentVideoId] = useState<
    string | null
  >(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/videos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.warn("Failed to load uploaded videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="bg-neutral-950/50 backdrop-blur-md p-5 border border-neutral-900 rounded-3xl space-y-4 transition-all duration-300 hover:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3 font-mono">
        <div className="flex items-center gap-2">
          <Film className="w-4.5 h-4.5 text-purple-400" />
          <span className="text-white font-bold text-xs font-sans">
            Published Webtoon Recaps & Shorts
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-400 font-bold">
            {videos.length} Videos
          </span>
        </div>
        <button
          onClick={fetchVideos}
          disabled={isLoading}
          className="p-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg border border-neutral-800 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isLoading ? "animate-spin text-purple-400" : ""
            }`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-neutral-500 font-mono animate-pulse">
          Loading published YouTube videos...
        </div>
      ) : videos.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500 font-mono">
          No YouTube uploads found. Publish your first video above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-neutral-900/60 border border-neutral-850 rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-black">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-emerald-400 border border-emerald-900/40 uppercase">
                  {vid.privacy_status}
                </span>
              </div>

              <div className="p-3.5 space-y-2.5 font-mono">
                <h4 className="text-xs font-bold text-neutral-200 line-clamp-2 font-sans group-hover:text-purple-300 transition-colors">
                  {vid.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-850">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-purple-400" /> {vid.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-emerald-400" />{" "}
                    {vid.like_count}
                  </span>
                  <button
                    onClick={() =>
                      setActiveCommentVideoId(
                        activeCommentVideoId === vid.id ? null : vid.id
                      )
                    }
                    className="flex items-center gap-1 hover:text-purple-300 cursor-pointer font-bold text-purple-400"
                  >
                    <MessageSquare className="w-3 h-3" /> {vid.comment_count}{" "}
                    Comments
                  </button>
                  <a
                    href={vid.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white p-1"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500 hover:text-white" />
                  </a>
                </div>

                {activeCommentVideoId === vid.id && (
                  <YouTubeCommentsViewer
                    videoId={vid.id}
                    onClose={() => setActiveCommentVideoId(null)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
