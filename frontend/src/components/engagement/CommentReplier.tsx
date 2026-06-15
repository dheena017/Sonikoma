import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquare } from "lucide-react";

interface CommentReplierProps {
  title: string;
}

interface ReplyData {
  reply_text: string;
  engagement_tactic: string;
}

export default function CommentReplier({ title }: CommentReplierProps) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState(
    "This MC is so overpowered! When is the next episode coming out?"
  );
  const [reply, setReply] = useState<ReplyData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills/comment-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_comment: comment,
          video_title: title || "Solo Leveling Recap",
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setReply(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 space-y-4 max-w-xl mx-auto shadow-xl">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-purple-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase">
            AI Channel Subscriber Reply Generator
          </h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !comment}
          className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? "Drafting..." : "✦ Suggest Reply"}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] font-mono text-neutral-500 uppercase">
          Subscriber Comment
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Paste subscriber comment here..."
          className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl p-2.5 text-neutral-300 outline-none focus:border-purple-600 transition-all font-sans leading-relaxed"
        />
      </div>

      {reply && !loading && (
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-1.5">
            <span className="text-[9px] font-mono text-neutral-500 uppercase">
              Draft reply:
            </span>
            <button
              onClick={() => copyToClipboard(reply.reply_text, "reply")}
              className="text-neutral-500 hover:text-white"
            >
              {copiedField === "reply" ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <p className="text-xs font-sans text-neutral-200 font-semibold leading-relaxed">
            "{reply.reply_text}"
          </p>
          <div className="pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
            <span className="text-purple-355 block font-bold text-[8px] uppercase tracking-wider">
              Tactic reasoning:
            </span>
            {reply.engagement_tactic}
          </div>
        </div>
      )}
    </div>
  );
}
