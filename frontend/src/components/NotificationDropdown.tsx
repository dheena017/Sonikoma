import React, { useState } from "react";
import {
  Bell,
  BellOff,
  X,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  CircleAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Notification } from "./NotificationStack";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  onNavigateToAll: () => void;
  notificationsMuted?: boolean;
  onToggleMute?: () => void;
}

export default function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNavigateToAll,
  notificationsMuted = false,
  onToggleMute,
}: NotificationDropdownProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    onMarkAsRead(id);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {notificationsMuted ? (
            <BellOff className="h-4 w-4 text-rose-500 animate-pulse" />
          ) : (
            <Bell className="h-4 w-4 text-purple-400" />
          )}
          <h3 className="font-bold text-sm text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg transition-colors ${
              notificationsMuted
                ? "text-rose-500 hover:text-rose-450 hover:bg-neutral-800"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title={notificationsMuted ? "Unmute notification sounds" : "Mute notification sounds"}
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4 animate-bounce" style={{ animationDuration: "1.5s" }} />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Mark all as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="h-10 w-10 text-neutral-700 mx-auto mb-3 opacity-20" />
            <p className="text-neutral-500 text-sm italic font-mono">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {notifications.slice(0, 10).map((note) => (
              <div
                key={note.id}
                className={`p-4 transition-colors relative group ${
                  !note.isRead ? "bg-purple-500/5" : "hover:bg-neutral-800/30"
                }`}
              >
                <div className="flex gap-3">
                  <NotificationIcon type={note.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-tight break-words pr-4 ${
                          !note.isRead
                            ? "text-white font-bold"
                            : "text-neutral-300 font-medium"
                        }`}
                      >
                        {note.message}
                      </p>
                      <button
                        onClick={() => toggleExpand(note.id)}
                        className="text-neutral-500 hover:text-white shrink-0"
                      >
                        {expandedId === note.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="h-3 w-3 text-neutral-500" />
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {formatDistanceToNow(note.timestamp, {
                          addSuffix: true,
                        })}
                      </span>
                      {note.errorCode && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1 rounded uppercase tracking-tighter">
                          Error {note.errorCode}
                        </span>
                      )}
                    </div>

                    {expandedId === note.id && (
                      <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                        {note.details && (
                          <div className="p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800 text-[11px] font-mono text-neutral-400 break-words leading-relaxed">
                            {note.details}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {note.link && (
                            <a
                              href={note.link}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Target
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(note.id);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/30 hover:text-rose-400 text-neutral-400 text-[10px] font-bold uppercase tracking-wider transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!note.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between gap-2">
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-rose-400 transition-colors px-2"
          >
            Clear All
          </button>
          <button
            onClick={onNavigateToAll}
            className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold uppercase tracking-widest transition-all text-center"
          >
            View All History
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "error":
      return <CircleAlert className="h-5 w-5 text-rose-500 shrink-0" />;
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
  }
}
