import React from "react";
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
  Copy,
  Download,
  Trash,
} from "lucide-react";
import { Notification } from "@/features/app_notification/components/types";
import { formatDistanceToNow } from "date-fns";
import {
  useNotificationExpand,
  useNotificationFiltering,
} from "@/features/app_notification/hooks";
import {
  getNotificationIconBox,
  getTypeStyles,
} from "@/features/app_notification/utils";

interface NotificationsPageProps {
  notifications: Notification[];
  onNavigateHome: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  onClearRead?: () => void;
  notificationsMuted?: boolean;
  onToggleMute?: () => void;
}

const NotificationsPage = React.memo(
  ({
    notifications,
    onNavigateHome,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
    onClearRead,
    notificationsMuted = false,
    onToggleMute,
  }: NotificationsPageProps) => {
    const { expandedId, toggleExpand } = useNotificationExpand();
    const {
      filter,
      setFilter,
      searchQuery,
      setSearchQuery,
      sortOrder,
      setSortOrder,
      filteredNotifications,
      groupedNotifications,
    } = useNotificationFiltering(notifications);

    const handleClearRead = () => {
      if (onClearRead) {
        onClearRead();
      } else {
        notifications.filter((n) => n.isRead).forEach((n) => onDelete(n.id));
      }
    };

    const handleToggleExpand = (id: number) => {
      toggleExpand(id, () => {
        if (!notifications.find((n) => n.id === id)?.isRead) {
          onMarkAsRead(id);
        }
      });
    };

    const exportLogs = () => {
      const data = JSON.stringify(filteredNotifications, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sonikoma_Notifications_Export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="w-full flex-1 text-[#E5E5E5] py-4 sm:py-6 max-w-7xl mx-auto relative animate-fade-in text-left">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-7 relative overflow-hidden text-left">
          {/* Unified Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2F2F2F] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF] mb-1.5">
                <span
                  className="hover:text-white cursor-pointer"
                  onClick={onNavigateHome}
                >
                  Dashboard
                </span>
                <span className="text-[#6B7280]">&gt;</span>
                <span className="text-[#3B82F6] font-bold">Notifications</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#E5E5E5] tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#121212] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] shadow-inner">
                  <Bell className="h-5 w-5" />
                </div>
                <span>Notification Hub</span>
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="bg-[#3B82F6] text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                    {notifications.filter((n) => !n.isRead).length} UNREAD
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#9CA3AF] font-mono mt-1">
                Track system activity, AI processing updates, and error logs
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={onToggleMute}
                className={`btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono ${
                  notificationsMuted
                    ? "text-[#EF4444] border-[#EF4444]/30"
                    : ""
                }`}
                title={notificationsMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {notificationsMuted ? (
                  <BellOff className="h-3.5 w-3.5 text-[#EF4444]" />
                ) : (
                  <Bell className="h-3.5 w-3.5 text-[#3B82F6]" />
                )}
                <span>{notificationsMuted ? "Muted" : "Mute Sound"}</span>
              </button>

              {filteredNotifications.length > 0 && (
                <button
                  onClick={exportLogs}
                  className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono"
                  title="Export logs as JSON"
                >
                  <Download className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>Export JSON</span>
                </button>
              )}

              {notifications.length > 0 && (
                <>
                  <button
                    onClick={onMarkAllAsRead}
                    className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono hover:text-[#10B981]"
                    title="Mark all as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                  {notifications.some((n) => n.isRead) && (
                    <button
                      onClick={handleClearRead}
                      className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono hover:text-[#EF4444]"
                      title="Clear read notifications"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      <span>Clear read</span>
                    </button>
                  )}
                  <button
                    onClick={onClearAll}
                    className="btn-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-[#EF4444] hover:bg-[#EF4444]/10"
                    title="Clear history"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear all</span>
                  </button>
                </>
              )}

              <button
                onClick={onNavigateHome}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] group-focus-within:text-[#3B82F6] transition-colors" />
              <input
                type="text"
                placeholder="Search logs, errors, or messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-[#2F2F2F] rounded-xl py-2.5 pl-11 pr-4 text-xs sm:text-sm text-[#E5E5E5] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#6B7280]"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === "newest" ? "oldest" : "newest"
                  )
                }
                className="btn-secondary px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
              >
                {sortOrder === "newest" ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
            </div>
            <div className="flex items-center gap-2 min-w-[220px]">
              <Filter className="h-4 w-4 text-[#3B82F6] shrink-0" />
              <div className="relative w-full">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full appearance-none bg-[#121212] border border-[#2F2F2F] text-[#E5E5E5] rounded-xl py-2.5 pl-4 pr-10 text-xs sm:text-sm font-bold uppercase tracking-widest outline-none focus:border-[#3B82F6] transition-all cursor-pointer"
                >
                  <option value="all">All Logs</option>
                  <option value="unread">Unread</option>
                  <option value="error">Errors</option>
                  <option value="warning">Warnings</option>
                  <option value="success">Success</option>
                  <option value="info">Info</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              </div>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="py-16 sm:py-20 p-8 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] flex flex-col items-center justify-center text-center shadow-lg animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center justify-center mb-4 text-[#3B82F6] shadow-inner">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#E5E5E5]">
                No matching notifications
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-sm mt-2">
                We couldn't find any notifications matching your current filters
                or search query.
              </p>
              {(searchQuery || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="mt-6 text-[#3B82F6] font-bold text-xs hover:underline cursor-pointer uppercase tracking-wider font-mono"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedNotifications).map(
                ([groupName, notes]) => {
                  if (notes.length === 0) return null;
                  return (
                    <div key={groupName} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest pl-2 font-mono">
                          {groupName}
                        </h3>
                        {notes.some((n) => !n.isRead) && (
                          <button
                            onClick={() =>
                              notes
                                .filter((n) => !n.isRead)
                                .forEach((n) => onMarkAsRead(n.id))
                            }
                            className="btn-secondary text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                              !note.isRead
                                ? "bg-[#1E1E1E] border-[#3B82F6]/70 ring-1 ring-[#3B82F6]/30 shadow-md"
                                : "bg-[#1E1E1E] border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#262626]"
                            }`}
                          >
                            <div
                              className="p-5 flex flex-col sm:flex-row gap-5 cursor-pointer"
                              onClick={() => handleToggleExpand(note.id)}
                            >
                              <div className="flex-1 flex gap-4 min-w-0">
                                <div className="mt-1 shrink-0">
                                  {getNotificationIconBox(note.type)}
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
                                      className="p-2.5 rounded-xl bg-[#2A2A2A] border border-[#3B82F6] text-white shadow-lg shadow-black/50 hover:bg-[#3B82F6] transition-all"
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
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                          Detailed Log Output
                                        </h5>
                                        <button
                                          onClick={() =>
                                            navigator.clipboard.writeText(
                                              note.details || ""
                                            )
                                          }
                                          className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-900 hover:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-800"
                                          title="Copy to clipboard"
                                        >
                                          <Copy className="h-3 w-3" />
                                          Copy
                                        </button>
                                      </div>
                                      <div className="p-4 rounded-xl bg-black border border-neutral-800 font-mono text-xs text-neutral-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                        {note.details ||
                                          JSON.stringify(
                                            {
                                              event: {
                                                id: note.id,
                                                type: note.type,
                                                timestamp: new Date(
                                                  note.timestamp
                                                ).toISOString(),
                                                status: note.isRead
                                                  ? "read"
                                                  : "unread",
                                                toast_dismissed:
                                                  note.toastDismissed || false,
                                              },
                                              payload: {
                                                message: note.message,
                                                error_code:
                                                  note.errorCode || null,
                                                retry_delay_seconds:
                                                  note.retryDelay || null,
                                                action_link: note.link || null,
                                                has_retry_handler:
                                                  !!note.onRetry,
                                              },
                                              context: {
                                                environment:
                                                  (import.meta as any).env
                                                    ?.MODE || "development",
                                                browser:
                                                  typeof window !== "undefined"
                                                    ? navigator.userAgent
                                                    : "unknown",
                                                url:
                                                  typeof window !== "undefined"
                                                    ? window.location.href
                                                    : "unknown",
                                                resolution:
                                                  typeof window !== "undefined"
                                                    ? `${window.innerWidth}x${window.innerHeight}`
                                                    : "unknown",
                                              },
                                            },
                                            null,
                                            2
                                          )}
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
                                          value={`#${note.id
                                            .toString()
                                            .slice(-6)}`}
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
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#3B82F6]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default NotificationsPage;

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[11px] border-b border-neutral-800/50 pb-2">
      <span className="text-neutral-600 font-medium">{label}</span>
      <span className="text-neutral-300 font-mono">{value}</span>
    </div>
  );
}
