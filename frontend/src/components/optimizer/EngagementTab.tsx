import React, { useState } from "react";
import { Sparkles, Copy, Check, MessageSquare, Flame, HelpCircle } from "lucide-react";

interface EngagementTabProps {
  title: string;
  storyboardSummary: string;
}

interface CliffhangerData {
  ending_narration: string;
  suspense_question: string;
}

interface OutroData {
  outro_script: string;
  cta_focus: string;
}

interface CommentReplyData {
  reply_text: string;
  engagement_tactic: string;
}

export default function EngagementTab({
  title,
  storyboardSummary,
}: EngagementTabProps) {
  const [loadingCliff, setLoadingCliff] = useState(false);
  const [cliffData, setCliffData] = useState<CliffhangerData | null>(null);

  const [loadingOutro, setLoadingOutro] = useState(false);
  const [outroData, setOutroData] = useState<OutroData | null>(null);
  const [climaxHook, setClimaxHook] = useState("Will the S-Rank Protagonist survive the dungeon gate collapse?");

  const [loadingComment, setLoadingComment] = useState(false);
  const [commentData, setCommentData] = useState<CommentReplyData | null>(null);
  const [userComment, setUserComment] = useState("Bro has infinite plot armor, how does he keep surviving this? 💀");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateCliff = async () => {
    setLoadingCliff(true);
    try {
      const res = await fetch("/api/skills/cliffhanger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_outline: storyboardSummary || "The protagonist faces an unbeatable dungeon boss.",
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setCliffData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCliff(false);
    }
  };

  const handleGenerateOutro = async () => {
    setLoadingOutro(true);
    try {
      const res = await fetch("/api/skills/outro-cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "This Webtoon",
          ending_cliffhanger: climaxHook,
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setOutroData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOutro(false);
    }
  };

  const handleGenerateComment = async () => {
    setLoadingComment(true);
    try {
      const res = await fetch("/api/skills/comment-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_comment: userComment,
          video_title: title || "This Webtoon Recap",
          model: "gemini-2.5-flash",
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setCommentData(json.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cliffhanger Block */}
      <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-250 uppercase">
              End-of-Video Cliffhanger Generator
            </h4>
          </div>
          <button
            onClick={handleGenerateCliff}
            disabled={loadingCliff}
            className="px-3 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            {loadingCliff ? "Generating..." : "✦ Generate Cliffhanger"}
          </button>
        </div>

        {cliffData && !loadingCliff && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                  Cliffhanger Narration Script
                </span>
                <button
                  onClick={() => copyToClipboard(cliffData.ending_narration, "cliff_narration")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "cliff_narration" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-200 italic font-semibold leading-relaxed">
                "{cliffData.ending_narration}"
              </p>
            </div>

            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                  Engagement Hook Question
                </span>
                <button
                  onClick={() => copyToClipboard(cliffData.suspense_question, "cliff_q")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "cliff_q" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-200 font-bold">
                "{cliffData.suspense_question}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Outro CTA Block */}
      <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-purple-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-250 uppercase">
              Recap Video Outro CTA Speech
            </h4>
          </div>
          <button
            onClick={handleGenerateOutro}
            disabled={loadingOutro}
            className="px-3 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            {loadingOutro ? "Generating..." : "✦ Generate Outro"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-neutral-450 uppercase font-bold">
              Climax Hook Input
            </label>
            <input
              type="text"
              value={climaxHook}
              onChange={(e) => setClimaxHook(e.target.value)}
              className="bg-neutral-950 border border-neutral-850 px-3 py-1.5 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-purple-550 w-full"
            />
          </div>

          {outroData && !loadingOutro && (
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase block">
                  Endscreen Outro Script (Max 15 words)
                </span>
                <p className="text-xs font-sans text-neutral-200 font-semibold italic">
                  "{outroData.outro_script}"
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-[9px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-bold">
                  Focus: {outroData.cta_focus}
                </span>
                <button
                  onClick={() => copyToClipboard(outroData.outro_script, "outro")}
                  className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900"
                >
                  {copiedField === "outro" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Comment Reply Coach */}
      <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold text-neutral-250 uppercase">
              Witty Subscriber Comment Reply Coach
            </h4>
          </div>
          <button
            onClick={handleGenerateComment}
            disabled={loadingComment}
            className="px-3 py-1 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-[10px] font-mono font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            {loadingComment ? "Generating..." : "✦ Draft Response"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono text-neutral-450 uppercase font-bold">
              User Comment to Reply
            </label>
            <input
              type="text"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="bg-neutral-950 border border-neutral-850 px-3 py-1.5 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-purple-550 w-full"
            />
          </div>

          {commentData && !loadingComment && (
            <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                  Witty Fan Reply Suggestion
                </span>
                <button
                  onClick={() => copyToClipboard(commentData.reply_text, "reply")}
                  className="text-neutral-500 hover:text-white p-1 rounded"
                >
                  {copiedField === "reply" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-xs font-sans text-neutral-200 font-semibold leading-relaxed">
                {commentData.reply_text}
              </p>
              <div className="pt-1">
                <span className="text-[9px] font-mono bg-emerald-950/50 text-emerald-300 border border-emerald-800/30 px-2 py-0.5 rounded">
                  Strategy: {commentData.engagement_tactic}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
