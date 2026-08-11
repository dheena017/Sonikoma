export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "Recently";
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 0) return "Recently";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
