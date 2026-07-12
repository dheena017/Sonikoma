export const submitImageEdits = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const editImage = submitImageEdits;

export const removeSpeechBubblesBatch = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(
    "/api/image/remove-speech-bubbles-batch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    }
  );
  return res.json();
};

export const mergeImages = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const removeSpeechBubbles = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/remove-speech-bubbles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const splitImage = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/split", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const transformImage = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const processLayers = async (
  fetchWithInterceptor: any,
  panelId: string | number,
  data: { url: string },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(
    `/api/image/process-layers/${panelId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    }
  );
  return res.json();
};

export const downloadZip = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/download-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const undoImageEdit = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/undo-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const undoCrop = undoImageEdit;

export const getProxyImageUrl = (url: string) => {
  if (isProxyUrl(url)) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

export const isProxyUrl = (url: string) => {
  return url && typeof url === "string" && url.includes("/api/proxy-image");
};

export const isApiUrl = (url: string) => {
  return url && typeof url === "string" && url.includes("/api/");
};

export const saveTrainingData = async (
  fetchWithInterceptor: any,
  originalPanel: Blob,
  correctedTextMask: Blob,
  options?: RequestInit
) => {
  const formData = new FormData();
  formData.append("original_panel", originalPanel, "original_panel.png");
  formData.append("corrected_text_mask", correctedTextMask, "corrected_text_mask.png");

  const res = await fetchWithInterceptor("/api/image/save-training-data", {
    method: "POST",
    body: formData,
    ...options,
  });
  return res.json();
};

export const getTrainingDataCount = async (
  fetchWithInterceptor: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/training-data-count", {
    method: "GET",
    ...options,
  });
  return res.json();
};
