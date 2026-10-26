/**
 * Admin Formatters and Metric Normalizers
 */

/**
 * Format ISO or SQLite timestamps into a readable localized date and time string.
 */
export const formatDate = (raw: string | undefined | null): string => {
  if (!raw) return "—";
  try {
    const d = new Date(
      raw.includes("T") ? raw : raw.replace(" ", "T") + "Z"
    );
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
};

/**
 * Format average duration in seconds into 'Xm Ys' or 'Xs'.
 */
export const formatAvgDuration = (sec: number): string => {
  if (!sec || isNaN(sec)) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/**
 * Format elapsed duration into mm:ss or hh:mm:ss.
 */
export const formatElapsed = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Format a timestamp object or string into a standard HH:MM:SS format.
 */
export const formatTimestamp = (ts: any): string => {
  if (!ts) return new Date().toLocaleTimeString();
  try {
    const date = new Date(ts);
    return isNaN(date.getTime())
      ? String(ts)
      : date.toLocaleTimeString();
  } catch {
    return String(ts);
  }
};

/**
 * Format bytes into human-readable strings (KB, MB, GB, etc.).
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
