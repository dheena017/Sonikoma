import React, { useEffect, useState } from "react";
import { MessageSquare, ThumbsUp, Loader2, User } from "lucide-react";

interface CommentItem {
  id: string;
  author: string;
  author_profile_image?: string;
  text: string;
  like_count?: number;
  published_at?: string;
}

interface YouTubeCommentsViewerProps {
  videoId: string;
  onClose?: () => void;
}

export function YouTubeCommentsViewer({ videoId }: YouTubeCommentsViewerProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
        const res = await fetch(`/api/export/youtube/videos/${videoId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setComments(data.comments || []);
          }
        } else {
          if (isMounted) {
            setError("Comments are disabled or unavailable for this video.");
          }
        }
      } catch (e) {
        if (isMounted) {
          setError("Failed to load comments.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (videoId) {
      fetchComments();
    }

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
        <span className="text-xs font-mono text-neutral-500">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-xs font-mono text-neutral-500">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-xs font-mono text-neutral-500 flex flex-col items-center gap-2">
        <MessageSquare className="w-5 h-5 text-neutral-600" />
        <span>No comments yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {c.author_profile_image ? (
                <img
                  src={c.author_profile_image}
                  alt={c.author}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center">
                  <User className="w-3 h-3 text-neutral-400" />
                </div>
              )}
              <span className="text-xs font-bold text-white font-sans">{c.author}</span>
            </div>
            {c.published_at && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {new Date(c.published_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-300 font-sans leading-relaxed pl-7">{c.text}</p>
          {typeof c.like_count === "number" && c.like_count > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 pl-7 pt-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{c.like_count}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default YouTubeCommentsViewer;
