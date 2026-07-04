import { useMemo, useState } from "react";
import { Notification } from "../NotificationStack";

export const useNotificationFiltering = (notifications: Notification[]) => {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        const matchesSearch =
          n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (n.details?.toLowerCase().includes(searchQuery.toLowerCase()) ??
            false);
        const matchesFilter =
          filter === "all" ||
          n.type === filter ||
          (filter === "unread" && !n.isRead);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return b.timestamp - a.timestamp;
        } else {
          return a.timestamp - b.timestamp;
        }
      });
  }, [notifications, searchQuery, filter, sortOrder]);

  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    filteredNotifications.forEach((note) => {
      const noteDate = new Date(note.timestamp);
      noteDate.setHours(0, 0, 0, 0);

      if (noteDate.getTime() === today.getTime()) {
        groups.Today.push(note);
      } else if (noteDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(note);
      } else {
        groups.Older.push(note);
      }
    });

    return groups;
  }, [filteredNotifications]);

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    filteredNotifications,
    groupedNotifications,
  };
};
