import { useEffect, useState, useRef } from "react";
import { Notification } from "../NotificationStack";

export const useNotificationCountdown = (
  note: Notification,
  onRemove: (id: number) => void,
  isHovered: boolean
) => {
  const [countdown, setCountdown] = useState<number | null>(() => {
    if (note.errorCode === 429 && note.onRetry) {
      return note.retryDelay || 10;
    }
    if (note.type === "success" || note.type === "info") {
      return 5;
    }
    return null;
  });

  const initialCountdownRef = useRef<number | null>(countdown);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown === null || isHovered) return;

    if (countdown <= 0) {
      if (note.errorCode === 429 && note.onRetry) {
        note.onRetry();
      }
      onRemove(note.id);
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown, note, onRemove, isHovered]);

  const handleCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onRemove(note.id);
  };

  const handleRetryNow = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (note.onRetry) {
      note.onRetry();
    }
    onRemove(note.id);
  };

  return {
    countdown,
    initialCountdown: initialCountdownRef.current,
    handleCancel,
    handleRetryNow,
  };
};
