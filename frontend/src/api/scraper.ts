export const scrapeImages = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/scrape-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanelsBatch = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/detect-panels-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanels = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/detect-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const detectPanelsB64 = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/py/panels/detect-b64", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const extractOcrB64 = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/py/ocr/extract-full-b64", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const generateStoryboard = async (fetchWithInterceptor: any, data: any, options?: RequestInit) => {
  const res = await fetchWithInterceptor("/api/generate-storyboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};
