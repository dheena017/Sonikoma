import React, { useEffect, useState, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Play,
  CircleAlert,
} from "lucide-react";

export type NotificationType = "error" | "success" | "info" | "warning";

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  errorCode?: number;
  retryDelay?: number;
  onRetry?: () => void;
  timestamp: number;
  details?: string;
  link?: string;
  isRead: boolean;
  toastDismissed?: boolean;
}

interface NotificationStackProps {
  notifications: Notification[];
  removeNotification: (id: number) => void;
  notificationsMuted?: boolean;
}

export default function NotificationStack({
  notifications,
  removeNotification,
  notificationsMuted = false,
}: NotificationStackProps) {
  // Only show notifications if not muted
  if (notificationsMuted) return null;

  // Only show notifications that haven't been dismissed from toast stack
  // and were created recently (within last 10 seconds) OR are errors/warnings that haven't been dismissed
  const activeToasts = notifications.filter((n) => !n.toastDismissed);
  const MAX_TOASTS = 5;
  // If notifications are added to the end, we want the last MAX_TOASTS
  // Wait, let's just slice the first MAX_TOASTS if they are newest-first, or last if oldest-first.
  // We'll take the first MAX_TOASTS from the reversed array or just slice from end.
  // Assuming the newest are at the end:
  const visibleToasts = activeToasts.slice(-MAX_TOASTS);
  const hiddenCount = Math.max(0, activeToasts.length - MAX_TOASTS);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse justify-end gap-2 pointer-events-none w-full max-w-sm sm:max-w-md">
      {visibleToasts.map((note) => (
        <IndividualNotification
          key={note.id}
          note={note}
          onRemove={removeNotification}
        />
      ))}
      {hiddenCount > 0 && (
        <div className="bg-neutral-900/90 border border-neutral-800 text-neutral-400 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl text-center shadow-lg backdrop-blur-sm animate-in fade-in">
          + {hiddenCount} more hidden (Check Hub)
        </div>
      )}
    </div>
  );
}

function IndividualNotification({
  note,
  onRemove,
}: {
  note: Notification;
  onRemove: (id: number) => void;
  key?: React.Key;
}) {
  const [countdown, setCountdown] = useState<number | null>(() => {
    if (note.errorCode === 429 && note.onRetry) {
      return note.retryDelay || 10;
    }
    if (note.type === "success" || note.type === "info") {
      return 5;
    }
    return null;
  });

  const [isHovered, setIsHovered] = useState(false);
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

  // Decide colors and headings based on errorCode or type
  let title = "Notification";
  let classes = "bg-blue-950/90 border-blue-800 text-blue-100";
  let icon = <Info className="h-5 w-5 text-blue-400 shrink-0" />;

  if (note.errorCode === 429) {
    title = "Quota Exhausted (429)";
    classes =
      "bg-amber-950/95 border-amber-500/85 text-amber-100 shadow-amber-950/40 shadow-xl border-2";
    icon = (
      <RefreshCw
        className="h-5 w-5 text-amber-400 shrink-0 animate-spin"
        style={{ animationDuration: "3s" }}
      />
    );
  } else if (note.errorCode === 500) {
    title = "Pipeline Failure (500)";
    classes =
      "bg-red-950/95 border-red-500 text-red-100 shadow-red-950/50 shadow-xl border-2";
    icon = <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />;
  } else if (note.type === "error") {
    title = "Operation Error";
    classes = "bg-rose-950/90 border-rose-800 text-rose-100";
    icon = <CircleAlert className="h-5 w-5 text-rose-400 shrink-0" />;
  } else if (note.type === "warning") {
    title = "Warning";
    classes = "bg-amber-950/90 border-amber-800 text-amber-100";
    icon = <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />;
  } else if (note.type === "success") {
    title = "Success";
    classes = "bg-emerald-950/90 border-emerald-800 text-emerald-100";
    icon = <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />;
  } else {
    title = "Information";
    classes = "bg-blue-950/90 border-blue-800 text-blue-100";
    icon = <Info className="h-5 w-5 text-blue-400 shrink-0" />;
  }

  return (
    <div
      className={`pointer-events-auto flex flex-col p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4 transition-all duration-300 w-full relative overflow-hidden ${classes}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3 relative z-10">
        {icon}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200/90 leading-tight">
            {title}
          </h3>
          <p className="text-sm font-medium mt-1 leading-normal break-words pr-1 text-white opacity-95">
            {note.message}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="hover:bg-black/20 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4 text-neutral-400 hover:text-white" />
        </button>
      </div>

      {countdown !== null && note.errorCode === 429 && (
        <div className="mt-3 pt-3 border-t border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-955/40 p-2.5 rounded-lg relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-amber-200 text-[11px]">
              Auto-retry in{" "}
              <span className="font-bold text-sm bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-700/50 text-amber-100">
                {countdown}s
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-amber-300/80 hover:text-amber-100 font-mono transition-colors border border-amber-800/40 hover:border-amber-700/60 rounded cursor-pointer hover:bg-amber-900/10"
            >
              Cancel
            </button>
            <button
              onClick={handleRetryNow}
              className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono transition-all rounded shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-amber-950 stroke-none" />
              <span>Retry Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress bar for auto-dismissible toasts */}
      {countdown !== null &&
        note.errorCode !== 429 &&
        initialCountdownRef.current && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 overflow-hidden">
            <div
              className={`h-full bg-white/40 transition-all duration-1000 ease-linear`}
              style={{
                width: `${(countdown / initialCountdownRef.current) * 100}%`,
              }}
            />
          </div>
        )}
    </div>
  );
}
