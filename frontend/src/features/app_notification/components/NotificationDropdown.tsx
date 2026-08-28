import React, { useState } from "react";
import {
  Bell,
  BellOff,
  X,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Notification } from "@/features/app_notification/components/types";
import { formatDistanceToNow } from "date-fns";
import { useNotificationExpand } from "@/features/app_notification/hooks";
import { getNotificationIcon } from "@/features/app_notification/utils";

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
  const { expandedId, toggleExpand } = useNotificationExpand();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-[400px] bg-[#181818] border border-[#2F2F2F] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top sm:origin-top-right">
      <div className="px-4 py-3 border-b border-[#2F2F2F] flex items-center justify-between bg-[#141414]">
        <div className="flex items-center gap-2">
          {notificationsMuted ? (
            <BellOff className="h-4 w-4 text-[#EF4444]" />
          ) : (
            <Bell className="h-4 w-4 text-[#3B82F6]" />
          )}
          <h3 className="font-bold text-sm text-[#E5E5E5]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-[#3B82F6] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              notificationsMuted
                ? "text-[#EF4444] hover:bg-[#262626]"
                : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#262626]"
            }`}
            title={
              notificationsMuted
                ? "Unmute notification sounds"
                : "Mute notification sounds"
            }
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </button>
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="p-1.5 text-[#9CA3AF] hover:text-[#10B981] hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell className="h-10 w-10 text-[#6B7280] mx-auto mb-3 opacity-30" />
            <p className="text-[#9CA3AF] text-xs font-mono">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2F2F2F]">
            {notifications.slice(0, 10).map((note) => (
              <div
                key={note.id}
                className={`p-4 transition-colors relative group ${
                  !note.isRead ? "bg-[#3B82F6]/5" : "hover:bg-[#262626]"
                }`}
              >
                <div className="flex gap-3">
                  {getNotificationIcon(note.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-tight break-words pr-4 ${
                          !note.isRead
                            ? "text-[#E5E5E5] font-bold"
                            : "text-[#9CA3AF] font-medium"
                        }`}
                      >
                        {note.message}
                      </p>
                      <button
                        onClick={() =>
                          toggleExpand(note.id, () => onMarkAsRead(note.id))
                        }
                        className="text-[#9CA3AF] hover:text-white shrink-0 cursor-pointer"
                      >
                        {expandedId === note.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="h-3 w-3 text-[#6B7280]" />
                      <span className="text-[10px] text-[#9CA3AF] font-mono">
                        {formatDistanceToNow(note.timestamp, {
                          addSuffix: true,
                        })}
                      </span>
                      {note.errorCode && (
                        <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-1 rounded uppercase tracking-tighter">
                          Error {note.errorCode}
                        </span>
                      )}
                    </div>

                    {expandedId === note.id && (
                      <div className="mt-3 space-y-2 animate-fade-in">
                        {note.details && (
                          <div className="p-2.5 rounded-lg bg-[#121212] border border-[#2F2F2F] text-[11px] font-mono text-[#9CA3AF] break-words leading-relaxed">
                            {note.details}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {note.link && (
                            <a
                              href={note.link}
                              className="btn-primary flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
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
                            className="btn-secondary flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:text-[#EF4444]"
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
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3B82F6]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-[#2F2F2F] bg-[#141414] flex items-center justify-between gap-2">
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] hover:text-[#EF4444] transition-colors px-2 cursor-pointer"
          >
            Clear All
          </button>
          <button
            onClick={onNavigateToAll}
            className="btn-secondary flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest text-center"
          >
            View All History
          </button>
        </div>
      )}
    </div>
  );
}

// Remove old NotificationIcon function - now using imported helper
