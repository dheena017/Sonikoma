import { GeneratedPanel } from "../types";

interface PublishJsonParams {
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  privacy: string;
  category: string;
  isShort: boolean;
  isScheduled: boolean;
  scheduleDate: string;
  scheduleTime: string;
  playlist?: string;
  authorName?: string;
  artistName?: string;
  webtoonPlatform?: string;
  customPlatform?: string;
  chapterStart?: string;
  chapterEnd?: string;
  subtitlesType?: string;
  subtitlesLanguage?: string;
}

interface PublishMultipartParams {
  videoFile: File;
  thumbnailFile: File | null;
  title: string;
  description: string;
  tags: string[];
  privacy: string;
  category: string;
  isShort: boolean;
  isScheduled: boolean;
  scheduleDate: string;
  scheduleTime: string;
  playlist?: string;
  authorName?: string;
  artistName?: string;
  webtoonPlatform?: string;
  customPlatform?: string;
  chapterStart?: string;
  chapterEnd?: string;
  subtitlesType?: string;
  subtitlesLanguage?: string;
}

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("sonikoma_token") ||
    sessionStorage.getItem("sonikoma_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function publishVideoJson({
  videoUrl,
  title,
  description,
  tags,
  privacy,
  category,
  isShort,
  isScheduled,
  scheduleDate,
  scheduleTime,
  playlist,
  authorName,
  artistName,
  webtoonPlatform,
  customPlatform,
  chapterStart,
  chapterEnd,
  subtitlesType,
  subtitlesLanguage,
}: PublishJsonParams) {
  let finalDescription = description;
  if (isScheduled && scheduleDate) {
    finalDescription += `\n\n📅 Scheduled Publish: ${scheduleDate} at ${scheduleTime} (GMT/Local)`;
  }

  const res = await fetch("/api/export/youtube", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      video_url: videoUrl,
      title,
      synopsis: finalDescription,
      tags: tags,
      privacy_status: privacy,
      category_id: category,
      is_short: isShort,
      playlist,
      author_name: authorName,
      artist_name: artistName,
      webtoon_platform: webtoonPlatform,
      custom_platform: customPlatform,
      chapter_start: chapterStart,
      chapter_end: chapterEnd,
      subtitles_type: subtitlesType,
      subtitles_language: subtitlesLanguage,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Authentication flow failed or rejected.");
  }
  return data;
}

export async function publishVideoMultipart({
  videoFile,
  thumbnailFile,
  title,
  description,
  tags,
  privacy,
  category,
  isShort,
  isScheduled,
  scheduleDate,
  scheduleTime,
  playlist,
  authorName,
  artistName,
  webtoonPlatform,
  customPlatform,
  chapterStart,
  chapterEnd,
  subtitlesType,
  subtitlesLanguage,
}: PublishMultipartParams) {
  const formData = new FormData();
  formData.append("file", videoFile);
  formData.append("title", title);

  let finalDescription = description;
  if (isScheduled && scheduleDate) {
    finalDescription += `\n\n📅 Scheduled Publish: ${scheduleDate} at ${scheduleTime} (GMT/Local)`;
  }
  formData.append("synopsis", finalDescription);

  formData.append("tags", tags.join(", "));
  formData.append("privacy_status", privacy);
  formData.append("category_id", category);
  formData.append("is_short", isShort ? "true" : "false");

  if (playlist) formData.append("playlist", playlist);
  if (authorName) formData.append("author_name", authorName);
  if (artistName) formData.append("artist_name", artistName);
  if (webtoonPlatform) formData.append("webtoon_platform", webtoonPlatform);
  if (customPlatform) formData.append("custom_platform", customPlatform);
  if (chapterStart) formData.append("chapter_start", chapterStart);
  if (chapterEnd) formData.append("chapter_end", chapterEnd);
  if (subtitlesType) formData.append("subtitles_type", subtitlesType);
  if (subtitlesLanguage)
    formData.append("subtitles_language", subtitlesLanguage);

  if (thumbnailFile) {
    formData.append("thumbnail", thumbnailFile);
  }

  const res = await fetch("/api/export/youtube/upload", {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Authentication flow failed or rejected.");
  }
  return data;
}

export async function generateSeoMetadata(
  title: string,
  genre: string,
  panels: GeneratedPanel[]
) {
  const summaryText =
    panels && panels.length > 0
      ? panels
          .map(
            (p, idx) =>
              `Panel ${idx + 1}: ${p.speech_text || "(Visual Action)"}`
          )
          .join("\n")
          .slice(0, 1000)
      : "A customized webtoon compilation video review.";

  const res = await fetch("/api/skills/seo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      title: title || "My Webtoon Recap",
      genre: genre || "Action/Fantasy",
      storyboard_summary: summaryText,
      model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.detail || "Failed to generate metadata");
  }
  return data.result;
}

export async function fetchDbProfiles() {
  const res = await fetch("/api/export/youtube/profiles", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch database profiles.");
  }
  return data.profiles;
}

export async function saveDbProfile(profile: any) {
  const res = await fetch("/api/export/youtube/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      name: profile.name,
      title_template: profile.title,
      description_template: profile.description,
      tags: profile.tags,
      category_id: profile.category,
      privacy_status: profile.privacy,
      is_short: profile.isShort,
      made_for_kids: profile.madeForKids || "no",
      paid_promotion: profile.paidPromotion || false,
      license: profile.license || "youtube",
      video_language: profile.videoLanguage || "en",
      channel_link: profile.channelLink || "",
      discord_link: profile.discordLink || "",
      patreon_link: profile.patreonLink || "",
      playlist: profile.playlist || "",
      author_name: profile.authorName || "",
      artist_name: profile.artistName || "",
      webtoon_platform: profile.webtoonPlatform || "",
      custom_platform: profile.customPlatform || "",
      chapter_start: profile.chapterStart || "",
      chapter_end: profile.chapterEnd || "",
      subtitles_type: profile.subtitlesType || "",
      subtitles_language: profile.subtitlesLanguage || "",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to save profile to database.");
  }
  return data.profile;
}

export async function deleteDbProfile(profileName: string) {
  const res = await fetch(
    `/api/export/youtube/profiles/${encodeURIComponent(profileName)}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to delete profile from database.");
  }
  return data;
}

export async function fetchDbUploadHistory() {
  const res = await fetch("/api/export/youtube/history", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch database upload history.");
  }
  return data.history;
}

export async function fetchDbCredentials() {
  const res = await fetch("/api/export/youtube/credentials", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch user credentials status.");
  }
  return data;
}

export async function saveDbCredentials(
  clientId: string,
  clientSecret: string,
  projectId: string
) {
  const res = await fetch("/api/export/youtube/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to save user credentials.");
  }
  return data;
}

export async function deleteDbCredentials() {
  const res = await fetch("/api/export/youtube/credentials", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to delete credentials.");
  }
  return data;
}
