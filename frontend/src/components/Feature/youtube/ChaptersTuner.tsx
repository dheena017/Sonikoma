import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Check } from "lucide-react";
import { GeneratedPanel } from "../../../types";

interface ChapterItem {
  time: string;
  title: string;
}

interface ChaptersTunerProps {
  panels: GeneratedPanel[];
  onInsertChapters: (chaptersText: string) => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function ChaptersTuner({
  panels,
  onInsertChapters,
  addNotification,
}: ChaptersTunerProps) {
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Automatically initialize chapters from panels
  const handleAutoLoad = () => {
    if (!panels || panels.length === 0) return;

    let currentTime = 0;
    const items: ChapterItem[] = [{ time: "00:00", title: "Introduction" }];

    panels.forEach((panel, idx) => {
      currentTime += panel.duration || 4.5;
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

      const panelSpeech = panel.speech_text
        ? panel.speech_text.slice(0, 30).trim() +
          (panel.speech_text.length > 30 ? "..." : "")
        : `Scene Outline #${idx + 1}`;

      items.push({ time: timeStr, title: panelSpeech });
    });

    setChapters(items);
  };

  useEffect(() => {
    handleAutoLoad();
  }, [panels]);

  const handleUpdateChapter = (
    index: number,
    field: "time" | "title",
    value: string
  ) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const handleAddChapter = () => {
    setChapters([...chapters, { time: "00:00", title: "New Chapter Scene" }]);
  };

  const handleRemoveChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleInsert = () => {
    if (chapters.length === 0) return;
    const chaptersText =
      `\n\n📌 VIDEO CHAPTERS:\n` +
      chapters.map((c) => `${c.time} - ${c.title}`).join("\n");

    onInsertChapters(chaptersText);
    if (addNotification) {
      addNotification(
        "Tuned chapters outline appended to description!",
        "success"
      );
    }
  };

  return (
    <div className="bg-neutral-950/40 backdrop-blur-sm p-5 border border-neutral-900 rounded-2xl space-y-4 font-mono text-xs text-neutral-400 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
        <span className="text-neutral-200 font-bold flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-purple-400" />
          Chapters Timeline Tuner
        </span>
        <button
          onClick={handleAutoLoad}
          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer bg-purple-950/25 px-2.5 py-1 rounded-lg border border-purple-900/35 hover:bg-purple-900/20 transition-all duration-200"
          title="Re-estimate chapter offsets from active storyboard panels"
        >
          Load Storyboard Defaults
        </button>
      </div>

      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
        {chapters.length === 0 ? (
          <div className="text-neutral-500 text-[11px] italic py-3 text-center">
            No chapters created yet. Click default or add button below.
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={index}
              className="flex gap-2 items-center animate-fade-in"
            >
              <input
                type="text"
                value={chapter.time}
                onChange={(e) =>
                  handleUpdateChapter(index, "time", e.target.value)
                }
                placeholder="MM:SS"
                className="w-16 bg-neutral-905/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none text-center shadow-inner"
              />
              <input
                type="text"
                value={chapter.title}
                onChange={(e) =>
                  handleUpdateChapter(index, "title", e.target.value)
                }
                placeholder="Chapter Outline Title"
                className="flex-1 bg-neutral-905/40 border border-neutral-900 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none shadow-inner"
              />
              <button
                onClick={() => handleRemoveChapter(index)}
                className="p-2 bg-red-950/10 hover:bg-red-950/30 border border-red-900/20 hover:border-red-500/40 rounded-xl text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer"
                title="Delete Chapter"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center gap-2 pt-2.5 border-t border-neutral-900">
        <button
          onClick={handleAddChapter}
          className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold bg-neutral-900/40 border border-neutral-850 hover:border-neutral-700 text-neutral-350 hover:text-white rounded-xl transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Chapter Offset
        </button>

        <button
          onClick={handleInsert}
          disabled={chapters.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-550 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-md shadow-purple-950/20"
        >
          <Check className="h-3.5 w-3.5" />
          Insert to Description
        </button>
      </div>
    </div>
  );
}
