export const generateVideo = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const renderVideo = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/video/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const getVideoStatus = async (
  fetchWithInterceptor: any,
  jobId: string,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(`/api/video/status/${jobId}`, options);
  return res.json();
};

export const generateTts = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/audio/generate-tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};
