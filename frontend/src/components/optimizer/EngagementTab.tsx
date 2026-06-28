import * as api from "../../api/index.js";
import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  Flame,
  HelpCircle,
  Video,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { GeneratedPanel } from "../../types";

interface EngagementTabProps {
  title: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
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
  videoUrl,
  panels = [],
  addNotification,
}: EngagementTabProps) {
  const [loadingCliff, setLoadingCliff] = useState(false);
  const [cliffData, setCliffData] = useState<CliffhangerData | null>(null);

  const [loadingOutro, setLoadingOutro] = useState(false);
  const [outroData, setOutroData] = useState<OutroData | null>(null);
  const [climaxHook, setClimaxHook] = useState(
    "Will the S-Rank Protagonist survive the dungeon gate collapse?"
  );

  const [loadingComment, setLoadingComment] = useState(false);
  const [commentData, setCommentData] = useState<CommentReplyData | null>(null);
  const [userComment, setUserComment] = useState(
    "Bro has infinite plot armor, how does he keep surviving this? 💀"
  );

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateCliff = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification(
          "Please compile your video first on the Dashboard before generating cliffhangers.",
          "warning"
        );
      }
      return;
    }

    setLoadingCliff(true);
    try {
      const json = await api.runCliffhangerSkill({
          story_outline:
            storyboardSummary ||
            "The protagonist faces an unbeatable dungeon boss.",
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
      if (json.success && json.result) {
        setCliffData(json.result);
        if (addNotification) {
          addNotification(
            "Successfully compiled End-of-Video Cliffhanger!",
            "success"
          );
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Failed to generate cliffhanger details.", "error");
      }
    } finally {
      setLoadingCliff(false);
    }
  };

  const handleGenerateOutro = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification(
          "Please compile your video first on the Dashboard before generating outro CTAs.",
          "warning"
        );
      }
      return;
    }

    setLoadingOutro(true);
    try {
      const json = await api.runOutroCtaSkill({
          title: title || "This Webtoon",
          ending_cliffhanger: climaxHook,
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
      if (json.success && json.result) {
        setOutroData(json.result);
        if (addNotification) {
          addNotification(
            "Successfully generated Outro CTA Speech!",
            "success"
          );
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Failed to generate outro speech.", "error");
      }
    } finally {
      setLoadingOutro(false);
    }
  };

  const handleGenerateComment = async () => {
    if (!videoUrl) {
      if (addNotification) {
        addNotification(
          "Please compile your video first on the Dashboard before using the Comment Coach.",
          "warning"
        );
      }
      return;
    }

    setLoadingComment(true);
    try {
      const json = await api.runCommentReplySkill({
          user_comment: userComment,
          video_title: title || "This Webtoon Recap",
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        });
      if (json.success && json.result) {
        setCommentData(json.result);
        if (addNotification) {
          addNotification(
            "Successfully compiled fan reply suggestion!",
            "success"
          );
        }
      }
    } catch (e) {
      console.error(e);
      if (addNotification) {
        addNotification("Failed to generate comment reply.", "error");
      }
    } finally {
      setLoadingComment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Media Reference Panel */}
      <div className="lg:col-span-5 space-y-6 lg:border-r lg:border-neutral-800/60 lg:pr-6">
        {/* Full Video Preview Block */}
        <div className="space-y-2">
          <h5 className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-purple-400" />
            Full Video Preview
          </h5>
          {videoUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-inner">
              <video
                src={videoUrl}
                controls
                className="w-full aspect-video object-contain"
              />
            </div>
          ) : (
            <div className="border border-dashed border-neutral-800/80 rounded-xl p-8 text-center bg-neutral-950/20 flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-500/80" />
              <p className="text-xs text-neutral-400 font-mono">
                No compiled video found
              </p>
              <p className="text-[10px] text-neutral-500 font-sans max-w-[250px]">
                Please compile your story panels on the main workspace dashboard
                to view the preview here.
              </p>
            </div>
          )}
        </div>

        {/* Manhwa Storyboard Panels Block */}
        <div className="space-y-2">
          <h5 className="text-xs font-mono font-bold text-neutral-400 uppercase flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            Manhwa Panels ({panels.length})
          </h5>
          {panels.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id || idx}
                  className="bg-neutral-950/60 border border-neutral-850 rounded-lg p-2 flex flex-col space-y-1.5 hover:border-neutral-700 transition-colors"
                >
                  <div className="relative aspect-[3/4] rounded overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    {panel.image_url ? (
                      <img
                        src={panel.image_url}
                        alt={`Panel ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-black/85 text-[9px] text-purple-300 px-1.5 py-0.5 rounded font-bold font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-350 line-clamp-2 italic leading-tight px-1 font-sans">
                    {panel.speech_text
                      ? `"${panel.speech_text}"`
                      : "(No Dialogue)"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-neutral-855 rounded-xl bg-neutral-950/10">
              <p className="text-xs text-neutral-500 font-mono">
                No story panels in timeline
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Engagement Tools */}
      <div className="lg:col-span-7 space-y-6">
        {/* Warn if not compiled */}
        {!videoUrl && (
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-250 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-mono font-bold block">
                ⚠️ COMPILATION CHECK REQUIRED
              </span>
              <p className="text-neutral-400 leading-relaxed font-sans">
                Engagement utilities and subscriber outro CTAs require complete
                visual and audio duration reference from the compiled video.
                Please compile the video on the Dashboard first.
              </p>
            </div>
          </div>
        )}

        {/* 1. Cliffhanger Block */}
        <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <h4 className="text-xs font-mono font-bold text-neutral-255 uppercase">
                End-of-Video Cliffhanger Generator
              </h4>
            </div>
            <button
              onClick={handleGenerateCliff}
              disabled={loadingCliff}
              className={`px-3 py-1 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                !videoUrl
                  ? "bg-purple-800/30 border border-purple-900/30 text-purple-400/50 cursor-not-allowed opacity-60"
                  : "bg-purple-600/80 hover:bg-purple-500"
              }`}
            >
              {loadingCliff ? "Generating..." : "✦ Generate Cliffhanger"}
            </button>
          </div>

          {cliffData && !loadingCliff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                    Cliffhanger Narration Script
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        cliffData.ending_narration,
                        "cliff_narration"
                      )
                    }
                    className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900"
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
                    onClick={() =>
                      copyToClipboard(cliffData.suspense_question, "cliff_q")
                    }
                    className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900"
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
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-mono font-bold text-neutral-255 uppercase">
                Recap Video Outro CTA Speech
              </h4>
            </div>
            <button
              onClick={handleGenerateOutro}
              disabled={loadingOutro}
              className={`px-3 py-1 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                !videoUrl
                  ? "bg-purple-800/30 border border-purple-900/30 text-purple-400/50 cursor-not-allowed opacity-60"
                  : "bg-purple-600/80 hover:bg-purple-500"
              }`}
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
              <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3 animate-fade-in">
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
                    onClick={() =>
                      copyToClipboard(outroData.outro_script, "outro")
                    }
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
          <div className="flex justify-between items-center border-b border-neutral-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold text-neutral-255 uppercase">
                Witty Subscriber Comment Reply Coach
              </h4>
            </div>
            <button
              onClick={handleGenerateComment}
              disabled={loadingComment}
              className={`px-3 py-1 text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                !videoUrl
                  ? "bg-purple-800/30 border border-purple-900/30 text-purple-400/50 cursor-not-allowed opacity-60"
                  : "bg-purple-600/80 hover:bg-purple-500"
              }`}
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
              <div className="bg-neutral-950/60 border border-neutral-850 p-3 rounded-lg space-y-2 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">
                    Witty Fan Reply Suggestion
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(commentData.reply_text, "reply")
                    }
                    className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-900"
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
                  <span className="text-[9px] font-mono bg-emerald-950/50 text-emerald-300 border border-emerald-800/30 px-2 py-0.5 rounded font-bold">
                    Strategy: {commentData.engagement_tactic}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
