/**
 * Shared utility for resolving user avatar URLs.
 * Returns the user's custom avatar_url / Google picture if present,
 * or falls back to a sleek purple user silhouette avatar.
 */
export const DEFAULT_USER_AVATAR_DATA_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='11' fill='%231e1b4b' stroke='%237e22ce' stroke-width='1.5'/><path fill='%23c084fc' d='M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z'/></svg>";

export function getUserAvatarUrl(user: any): string {
  const raw = user?.avatar_url || user?.picture || user?.photo_url;

  if (
    raw &&
    typeof raw === "string" &&
    raw.trim() !== "" &&
    !raw.includes("default-user") &&
    (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:"))
  ) {
    return raw;
  }

  return DEFAULT_USER_AVATAR_DATA_URI;
}
