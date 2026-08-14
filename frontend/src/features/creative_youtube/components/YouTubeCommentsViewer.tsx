import React, { useEffect, useState } from "react";
import { MessageSquare, ThumbsUp, X, User } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  author_avatar?: string;
  text: string;
  like_count: number;
  published_at?: string;
}

interface YouTubeCommentsViewerProps {
  videoId: string;
  onClose: () => void;
}

export function YouTubeCommentsViewer({ videoId, onClose }: YouTubeCommentsViewerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
        const res = await fetch(`/api/export/youtube/comments/${videoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.warn("Failed to load video comments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [videoId]);

  return (
    <div className="mt-2 p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 font-mono animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5 text-[10px]">
        <span className="text-purple-300 font-bold flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Live YouTube Audience Comments
        </span>
        <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-3 text-center text-[10px] text-neutral-500 animate-pulse">
          Fetching live comments from YouTube...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-2 text-center text-[10px] text-neutral-400 font-sans">
          No comments yet or comments are turned off for this video.
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-neutral-900">
          {comments.map((c) => (
            <div key={c.id} className="pt-2 text-[10.5px] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt={c.author_name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span className="font-bold text-neutral-300">{c.author_name}</span>
                </div>
                <span className="text-[9px] text-neutral-500 flex items-center gap-1">
                  <ThumbsUp className="w-2.5 h-2.5 text-emerald-400" /> {c.like_count}
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed font-sans pl-5">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YouTubeCommentsViewer;
