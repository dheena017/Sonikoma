import React, { useState } from "react";
import {
  Bell,
  BellOff,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  CircleAlert,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Notification } from "./NotificationStack";
import { formatDistanceToNow } from "date-fns";

interface NotificationsPageProps {
  notifications: Notification[];
  onNavigateHome: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  notificationsMuted?: boolean;
  onToggleMute?: () => void;
}

export default function NotificationsPage({
  notifications,
  onNavigateHome,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  notificationsMuted = false,
  onToggleMute,
}: NotificationsPageProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.details?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesFilter =
      filter === "all" ||
      n.type === filter ||
      (filter === "unread" && !n.isRead);
    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    if (!notifications.find((n) => n.id === id)?.isRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#070709] animate-in fade-in duration-300">
      {/* Header Area */}
      <div className="sticky top-[59px] z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-900 px-4 py-4 sm:px-8 sm:py-6">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <button
                onClick={onNavigateHome}
                className="p-2 sm:p-2.5 mt-0.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
                  Notification Hub
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="bg-purple-600 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm shadow-purple-900/50 mt-0.5 sm:mt-0">
                      {notifications.filter((n) => !n.isRead).length} UNREAD
                    </span>
                  )}
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-500 font-mono mt-1 sm:mt-0.5 leading-snug max-w-sm">
                  Track system activity, AI processing updates, and error logs
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/50 sm:border-transparent">
              <button
                onClick={onToggleMute}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  notificationsMuted
                    ? "bg-rose-950/20 border-rose-900/30 text-rose-455 hover:bg-rose-900/40"
                    : "bg-neutral-900 border-neutral-850 text-neutral-300 hover:text-white hover:border-neutral-750"
                }`}
                title={
                  notificationsMuted
                    ? "Unmute notification sounds"
                    : "Mute notification sounds"
                }
              >
                {notificationsMuted ? (
                  <BellOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
                )}
                <span>{notificationsMuted ? "Muted" : "Mute Sound"}</span>
              </button>
              
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={onMarkAllAsRead}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-emerald-400 hover:border-emerald-900/50 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </button>
                    <button
                      onClick={onClearAll}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-450 hover:bg-rose-900/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                      title="Clear history"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Clear history</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder="Search logs, errors, or messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-neutral-600"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              <Filter className="h-4 w-4 text-neutral-500 mr-2 shrink-0" />
              {[
                { id: "all", label: "All Logs" },
                { id: "unread", label: "Unread" },
                { id: "error", label: "Errors" },
                { id: "warning", label: "Warnings" },
                { id: "success", label: "Success" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer border ${
                    filter === f.id
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="h-20 w-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6 text-neutral-700">
                <Bell className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-neutral-300">
                No matching notifications
              </h3>
              <p className="text-neutral-500 max-w-sm mt-2">
                We couldn't find any notifications matching your current filters
                or search query.
              </p>
              {(searchQuery || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="mt-6 text-purple-400 font-bold text-sm hover:text-purple-300 underline underline-offset-4"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((note) => (
                <div
                  key={note.id}
                  className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                    !note.isRead
                      ? "bg-purple-950/10 border-purple-500/30 ring-1 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
                      : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60"
                  }`}
                >
                  <div
                    className="p-5 flex flex-col sm:flex-row gap-5 cursor-pointer"
                    onClick={() => toggleExpand(note.id)}
                  >
                    <div className="flex-1 flex gap-4 min-w-0">
                      <div className="mt-1 shrink-0">
                        <NotificationIcon type={note.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${getTypeStyles(
                              note.type
                            )}`}
                          >
                            {note.type}
                          </span>
                          {note.errorCode && (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-mono">
                              HTTP {note.errorCode}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(note.timestamp, {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                        <h4
                          className={`text-base leading-snug break-words transition-colors ${
                            !note.isRead
                              ? "text-white font-bold"
                              : "text-neutral-300 font-medium group-hover:text-neutral-100"
                          }`}
                        >
                          {note.message}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-neutral-800/50">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(note.id);
                          }}
                          className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800 text-neutral-500 hover:text-rose-400 hover:border-rose-900/50 transition-all"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {note.link && (
                          <a
                            href={note.link}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 rounded-xl bg-purple-600 border border-purple-500 text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500 transition-all"
                            title="Navigate to target"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
                        {expandedId === note.id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedId === note.id && (
                    <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300 border-t border-neutral-800/50 mt-1 pt-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                              Detailed Log Output
                            </h5>
                            <div className="p-4 rounded-xl bg-black border border-neutral-800 font-mono text-xs text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                              {note.details ||
                                "No technical details provided for this event."}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                              Event Meta
                            </h5>
                            <div className="space-y-2">
                              <MetaItem
                                label="Notification ID"
                                value={`#${note.id.toString().slice(-6)}`}
                              />
                              <MetaItem
                                label="Precise Time"
                                value={new Date(
                                  note.timestamp
                                ).toLocaleString()}
                              />
                              <MetaItem
                                label="Source Pipeline"
                                value="Main Application Flow"
                              />
                              <MetaItem
                                label="Status"
                                value={
                                  note.isRead
                                    ? "Resolved / Read"
                                    : "Pending / Unread"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!note.isRead && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "error":
      return (
        <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <CircleAlert className="h-5 w-5 text-rose-500" />
        </div>
      );
    case "warning":
      return (
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
      );
    case "success":
      return (
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Info className="h-5 w-5 text-blue-500" />
        </div>
      );
  }
}

function getTypeStyles(type: string) {
  switch (type) {
    case "error":
      return "text-rose-500 bg-rose-500/5 border-rose-500/20";
    case "warning":
      return "text-amber-500 bg-amber-500/5 border-amber-500/20";
    case "success":
      return "text-emerald-500 bg-emerald-500/5 border-emerald-500/20";
    default:
      return "text-blue-500 bg-blue-500/5 border-blue-500/20";
  }
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] border-b border-neutral-800/50 pb-2">
      <span className="text-neutral-600 font-medium">{label}</span>
      <span className="text-neutral-300 font-mono">{value}</span>
    </div>
  );
}
