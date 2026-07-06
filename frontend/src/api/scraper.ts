export const scrapeImages = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/scrape-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanelsBatch = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/detect-panels-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanels = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/detect-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanelsB64 = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/py/panels/detect-b64", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const extractOcrB64 = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/py/ocr/extract-full-b64", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const generateStoryboard = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/generate-storyboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const scrapeEpisodes = async (
  fetchWithInterceptor: any,
  data: { url?: string; title_no?: string; max_episodes?: number },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/scrape-episodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const scrapeEpisodesAdvanced = async (
  fetchWithInterceptor: any,
  data: {
    url?: string;
    title_no?: string;
    max_episodes?: number;
    page?: number;
    include_ratings?: boolean;
    sort_by?: 'latest' | 'oldest' | 'rating' | 'likes';
  },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/scrape-episodes-advanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const scrapeEpisodesPaginated = async (
  fetchWithInterceptor: any,
  data: { title_no: string; max_episodes?: number },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/scrape-episodes-paginated", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const batchScrapeSeriesAPI = async (
  fetchWithInterceptor: any,
  data: {
    series: Array<{ url?: string; title_no?: string }>;
    max_episodes_per_series?: number;
  },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/batch-scrape-series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};
