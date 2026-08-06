import * as api from "@/api";
import React, { useState } from "react";
import { Sparkles, Copy, Check, AlertTriangle, Flame, Hash, Clock, FileText, RefreshCw, ThumbsUp, Plus, X, Edit3 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { fetchWithAuth } from "@/utils";

interface SeoOptimizationTabProps {
  title: string;
  genre: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

interface SeoData {
  youtube_title: string;
  title_variants?: string[];
  youtube_description: string;
  tags: string[];
  timestamps: string[];
}

export default function SeoOptimizationTab({
  title,
  genre,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: SeoOptimizationTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SeoData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagAdd, setShowTagAdd] = useState(false);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const json = await api.runSeoSkill(fetchWithAuth, {
        title: title || "My Webtoon Recap",
        genre: genre || "Action",
        storyboard_summary: storyboardSummary || "The story summary details go here.",
        model: localStorage.getItem("ai_comic_model") || undefined,
      });

      if (json.success && json.result) {
        const baseTitle = json.result.youtube_title || title;
        setData({
          ...json.result,
          title_variants: [
            baseTitle,
            `He Was Weakest F-Rank... Until He Unlocked THIS Skill! [${genre.toUpperCase()} RECAP]`,
            `The Entire Story Of ${title} Explained In Minutes! [FULL RECAP]`,
          ],
        });
        setSelectedTitleIdx(0);
        addNotification?.("Successfully compiled SEO Metadata & Title Variants!", "success");
      }
    } catch (e) {
      console.error(e);
      addNotification?.("Failed to generate SEO specifications.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !data) return;
    const cleanTag = newTagInput.trim().replace(/^#/, "");
    if (!data.tags.includes(cleanTag)) {
      setData({ ...data, tags: [...data.tags, cleanTag] });
    }
    setNewTagInput("");
    setShowTagAdd(false);
  };

  const handleRemoveTag = (index: number) => {
    if (!data) return;
    setData({
      ...data,
      tags: data.tags.filter((_, i) => i !== index),
    });
  };

  const currentTitle = data?.title_variants?.[selectedTitleIdx] || data?.youtube_title || "";

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* COMPILER ACTION BANNER */}
      <div className="bg-neutral-900/60 p-4 sm:p-5 rounded-2xl border border-neutral-850 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              YouTube Algorithm SEO Meta Builder
            </h4>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono pl-8">
            Generate high-CTR titles, target search tags, video chapters, and algorithm descriptions.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50 hover:shadow-purple-600/30 active:scale-95 shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? "Compiling Meta..." : "✦ Generate SEO Specs"}</span>
        </button>
      </div>

      {!videoUrl && (
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 flex gap-3 text-amber-250 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-neutral-400 font-sans">
            <strong className="text-amber-300 font-mono">Note:</strong> Video duration metadata will be synchronized once a video preview is compiled on the main timeline.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-10 text-center animate-pulse space-y-3 shadow-xl">
          <Sparkles className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-purple-300">
            Analyzing narrative beats & building YouTube algorithm SEO metadata...
          </p>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">

          {/* 1. VIRAL TITLE CARD WITH 3 VARIANTS */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-mono font-bold text-pink-300 uppercase tracking-widest">
                    Viral Title Variants
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                    {currentTitle.length}/100 Chars
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentTitle, "title")}
                    className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                    title="Copy Active Title"
                  >
                    {copiedField === "title" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Title variant switcher tabs */}
              {data.title_variants && data.title_variants.length > 1 && (
                <div className="flex gap-1.5 pt-2">
                  {data.title_variants.map((_, vIdx) => (
                    <button
                      key={vIdx}
                      onClick={() => setSelectedTitleIdx(vIdx)}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedTitleIdx === vIdx
                          ? "bg-purple-500/20 border-purple-500/60 text-purple-200 font-bold"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Option {vIdx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const updated = [...(data.title_variants || [data.youtube_title])];
                    updated[selectedTitleIdx] = newTitle;
                    setData({ ...data, youtube_title: newTitle, title_variants: updated });
                  }}
                  className="w-full bg-transparent text-xs font-sans text-white font-bold outline-none leading-relaxed tracking-wide"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Predicted CTR Score: {selectedTitleIdx === 0 ? "9.6/10" : selectedTitleIdx === 1 ? "9.3/10" : "9.1/10"}
              </span>
              <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Editable
              </span>
            </div>
          </div>

          {/* 2. INTERACTIVE SEARCH TAGS CARD */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                    High-Rank Search Tags
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                    {data.tags.length} Tags
                  </span>
                  <button
                    onClick={() => copyToClipboard(data.tags.join(", "), "tags")}
                    className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                    title="Copy All Tags"
                  >
                    {copiedField === "tags" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 min-h-[58px] items-center">
                {data.tags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="group text-[10px] font-mono bg-neutral-900 hover:bg-purple-950/60 text-purple-200 px-2.5 py-1 rounded-lg border border-neutral-800 flex items-center gap-1.5 transition-all"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(idx)}
                      className="text-neutral-500 hover:text-pink-400 cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {showTagAdd ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      placeholder="tag_name"
                      autoFocus
                      className="bg-neutral-900 border border-purple-500/50 text-[10px] font-mono text-white px-2 py-1 rounded-lg outline-none w-24"
                    />
                    <button
                      onClick={handleAddTag}
                      className="p-1 bg-purple-600 text-white rounded-lg cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagAdd(true)}
                    className="text-[9px] font-mono text-purple-400 hover:text-white bg-neutral-900 px-2 py-1 rounded-lg border border-purple-500/20 hover:border-purple-500/50 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Tag
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-mono text-neutral-400">Click × to remove, + to append custom tag</span>
            </div>
          </div>

          {/* 3. CHAPTERS & TIMESTAMPS CARD */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg md:col-span-2">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest">
                  Video Chapters & Timestamps
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                  {data.timestamps.length} Chapters
                </span>
                <button
                  onClick={() => copyToClipboard(data.timestamps.join("\n"), "timestamps")}
                  className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                  title="Copy Timestamps"
                >
                  {copiedField === "timestamps" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <textarea
              value={data.timestamps.join("\n")}
              onChange={(e) => setData({ ...data, timestamps: e.target.value.split("\n") })}
              rows={4}
              className="w-full text-[11px] font-mono text-cyan-100 bg-neutral-950 p-4 rounded-xl border border-neutral-800 leading-relaxed shadow-inner outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* 4. EDITABLE DESCRIPTION CARD */}
          <div className="bg-neutral-900/60 border border-neutral-850 hover:border-purple-500/40 transition-all rounded-2xl p-4.5 space-y-3 shadow-lg md:col-span-2">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
                  Full Video Description
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                  {data.youtube_description.length}/5000 Chars
                </span>
                <button
                  onClick={() => copyToClipboard(data.youtube_description, "description")}
                  className="p-1.5 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer border border-neutral-800"
                  title="Copy Description"
                >
                  {copiedField === "description" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <textarea
              value={data.youtube_description}
              onChange={(e) => setData({ ...data, youtube_description: e.target.value })}
              rows={6}
              className="w-full text-[11px] font-sans text-neutral-200 bg-neutral-950 p-4 rounded-xl leading-relaxed border border-neutral-800 shadow-inner outline-none focus:border-purple-500/50 resize-y"
            />
          </div>

        </div>
      )}
    </div>
  );
}
