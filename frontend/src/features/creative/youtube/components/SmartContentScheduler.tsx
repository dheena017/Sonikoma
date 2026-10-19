import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  ChevronRight,
  TrendingUp,
  Youtube,
  Send,
  Zap,
} from "lucide-react";
import { ScheduledContentItem, SocialPlatform } from "../types/marketing";

interface SmartContentSchedulerProps {
  onScheduleItem?: (item: ScheduledContentItem) => void;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Peak viewer activity distribution across hours (0 to 23)
const HOURLY_PEAK_DATA = [
  { hour: "14:00", score: "62%", label: "Early Afternoon" },
  { hour: "16:00", score: "74%", label: "After School/Work" },
  { hour: "18:00", score: "88%", label: "Prime Start" },
  { hour: "19:30", score: "96%", label: "Peak Viral Surge 🔥", isPeak: true },
  { hour: "21:00", score: "91%", label: "Evening Peak" },
  { hour: "22:30", score: "78%", label: "Late Night Scroll" },
];

const INITIAL_SCHEDULED_ITEMS: ScheduledContentItem[] = [
  {
    id: "sched-1",
    title: "Episode 1: Awakening of the Shadow Monarch [Shorts 9:16]",
    thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop",
    videoFormat: "shorts",
    targetPlatforms: ["youtube", "tiktok", "instagram"],
    scheduledIsoString: "2026-10-12T19:30:00Z",
    scheduledFormattedTime: "Today at 7:30 PM (Peak Hour)",
    dayOfWeek: "Mon",
    isPeakViewerHour: true,
    status: "scheduled",
    estimatedReach: "45K - 90K views",
  },
  {
    id: "sched-2",
    title: "Episode 2: The S-Rank Dungeon Trial [Shorts 9:16]",
    thumbnailUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop",
    videoFormat: "shorts",
    targetPlatforms: ["youtube", "tiktok"],
    scheduledIsoString: "2026-10-13T19:30:00Z",
    scheduledFormattedTime: "Tomorrow at 7:30 PM (Peak Hour)",
    dayOfWeek: "Tue",
    isPeakViewerHour: true,
    status: "scheduled",
    estimatedReach: "50K - 110K views",
  },
  {
    id: "sched-3",
    title: "Episode 3: Betrayal at the Gate [Widescreen 16:9]",
    thumbnailUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop",
    videoFormat: "landscape",
    targetPlatforms: ["youtube"],
    scheduledIsoString: "2026-10-16T20:00:00Z",
    scheduledFormattedTime: "Friday at 8:00 PM (Weekend Surge)",
    dayOfWeek: "Fri",
    isPeakViewerHour: true,
    status: "scheduled",
    estimatedReach: "80K - 160K views",
  },
];

export const SmartContentScheduler: React.FC<SmartContentSchedulerProps> = ({
  onScheduleItem,
}) => {
  const [scheduledItems, setScheduledItems] = useState<ScheduledContentItem[]>(
    INITIAL_SCHEDULED_ITEMS
  );
  const [selectedDay, setSelectedDay] = useState<typeof DAYS_OF_WEEK[number]>("Mon");
  const [selectedHourSlot, setSelectedHourSlot] = useState("19:30");
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const handleQuickAddSlot = (slotHour: string, isPeak: boolean) => {
    const newItem: ScheduledContentItem = {
      id: `sched-${Date.now()}`,
      title: `Scheduled Drop: New Chapter Release [${selectedDay} ${slotHour}]`,
      thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop",
      videoFormat: "shorts",
      targetPlatforms: ["youtube", "tiktok", "instagram"],
      scheduledIsoString: new Date().toISOString(),
      scheduledFormattedTime: `${selectedDay} at ${slotHour} ${isPeak ? "(Peak Hour 🔥)" : ""}`,
      dayOfWeek: selectedDay,
      isPeakViewerHour: isPeak,
      status: "scheduled",
      estimatedReach: isPeak ? "60K - 120K views" : "30K - 60K views",
    };

    setScheduledItems([newItem, ...scheduledItems]);
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2500);
    onScheduleItem?.(newItem);
  };

  const handleDeleteItem = (id: string) => {
    setScheduledItems(scheduledItems.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 text-left">
      {/* ── Top Scheduler Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-[#3B82F6] border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-tight">
              Smart Content Scheduler &amp; Peak Hour Heatmap
            </h2>
          </div>
          <p className="text-xs text-neutral-300">
            Automatically schedules your webtoon releases during peak reader engagement hours to maximize algorithmic reach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Optimal Window: 18:00 – 21:00 UTC</span>
          </span>
        </div>
      </div>

      {/* ── Weekly Interactive Calendar Strip ── */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#282828] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#3B82F6]" />
            Weekly Visual Schedule Grid
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {scheduledItems.length} Videos in Queue
          </span>
        </div>

        {/* 7 Days selector pills */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const countForDay = scheduledItems.filter((i) => i.dayOfWeek === day).length;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#3B82F6]/20 border-[#3B82F6] text-white shadow-md shadow-blue-500/10"
                    : "bg-[#181818] border-[#2A2A2A] text-neutral-400 hover:text-white hover:border-[#383838]"
                }`}
              >
                <div className="text-xs font-bold uppercase font-mono">{day}</div>
                <div className="text-[10px] font-mono mt-1 text-neutral-400">
                  {countForDay > 0 ? (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-bold">
                      {countForDay} drops
                    </span>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Peak Hours Heatmap Slots */}
        <div className="pt-2">
          <div className="text-[11px] font-mono text-neutral-400 mb-2 flex items-center justify-between">
            <span>Peak Viewer Engagement Slots for {selectedDay}:</span>
            <span className="text-amber-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> High Algorithmic Velocity
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {HOURLY_PEAK_DATA.map((slot) => (
              <div
                key={slot.hour}
                onClick={() => handleQuickAddSlot(slot.hour, !!slot.isPeak)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  slot.isPeak
                    ? "bg-amber-950/20 border-amber-600/40 hover:border-amber-500 shadow-sm shadow-amber-500/10"
                    : "bg-[#181818] border-[#2A2A2A] hover:border-[#3B82F6]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">{slot.hour}</span>
                  {slot.isPeak && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1 font-mono">{slot.label}</div>
                <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">{slot.score} Reach</span>
                  <span className="text-blue-400 hover:text-white">+ Slot</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Successfully scheduled video drop for {selectedDay}!</span>
          </div>
        )}
      </div>

      {/* ── Scheduled Queue List ── */}
      <div className="p-5 rounded-2xl bg-[#141414] border border-[#282828] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222]">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9CA3AF]">
            Current Automated Publishing Queue
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Auto-Pilot Active
          </span>
        </div>

        <div className="space-y-3">
          {scheduledItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#181818] border border-[#2A2A2A] hover:border-[#383838] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-16 h-11 rounded-lg object-cover border border-[#333] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#E5E5E5] truncate">{item.title}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-neutral-400">
                    <span className="text-blue-400 font-bold">{item.scheduledFormattedTime}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{item.estimatedReach}</span>
                  </div>
                </div>
              </div>

              {/* Target Platforms & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#252525]">
                <div className="flex items-center gap-1.5">
                  {item.targetPlatforms.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#222] border border-[#333] text-neutral-300 uppercase"
                    >
                      {p === "youtube" ? "YT" : p === "tiktok" ? "TT" : "IG"}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Remove from schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartContentScheduler;
