/**
 * Robustly parses a database datetime string (SQLite UTC or ISO-8601) as UTC.
 * Without UTC normalization, browsers interpret SQLite strings like "2026-08-28 07:45:00"
 * as local system time, causing severe multi-hour or multi-day time calculation discrepancies.
 */
export function parseUtcDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // If already an ISO string with timezone or Z
  if (str.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // SQLite UTC format: '2026-08-28 07:45:00' or '2026-08-28 07:45:00.123456'
  // Normalize to ISO-8601 with Z suffix to ensure UTC interpretation
  const isoUtcStr = str.replace(" ", "T") + "Z";
  const d = new Date(isoUtcStr);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Fallback to standard parser
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Compact relative time (e.g. "Just now", "5m ago", "2h ago", "1d ago")
 */
export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const d = parseUtcDate(dateStr);
  if (!d) return "Recently";

  const then = d.getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 0) return "Just now";
  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins}m ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}h ago`;
  }
  if (diff < 172800) return "1d ago";
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Detailed relative time (e.g. "Just now", "5 minutes ago", "2 hours ago", "1 day ago")
 */
export function formatDetailedTime(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
  
  // If already relative formatted by backend, check if it's already clean
  if (typeof dateStr === "string" && (dateStr.includes("ago") || dateStr === "Just now" || dateStr === "Yesterday")) {
    return dateStr;
  }

  const d = parseUtcDate(dateStr);
  if (!d) return dateStr || "Just now";

  const then = d.getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 0) return "Just now";
  if (diff < 60) return "Just now";
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  if (diff < 172800) return "1 day ago";
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} days ago`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

