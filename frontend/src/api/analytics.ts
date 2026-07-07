export const getProjectTokenAnalytics = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/projects/analytics/tokens");
  return res.json();
};

export const getCreatorAnalytics = async (fetchWithInterceptor: any) => {
  const fetcher =
    typeof fetchWithInterceptor === "function"
      ? fetchWithInterceptor
      : (fetch as any);

  const res = await fetcher("/api/auth/analytics");
  return res.json();
};

export const getAnalytics = getCreatorAnalytics;

