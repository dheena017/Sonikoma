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

/**
 * Calls the /debug-yolo endpoint and returns a blob URL for the annotated PNG.
 * The caller is responsible for calling URL.revokeObjectURL() when done.
 */
export const debugYolo = async (
  fetchWithInterceptor: any,
  imageUrl: string,
  conf: number = 0.25
): Promise<string> => {
  const params = new URLSearchParams({ url: imageUrl, conf: String(conf) });
  const res = await fetchWithInterceptor(`/api/image/debug-yolo?${params}`, {
    method: "GET",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Debug YOLO request failed");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const startYoloTraining = async (
  fetchWithInterceptor: any,
  epochs: number = 20,
  batchSize: number = 4,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(`/api/image/start-training?epochs=${epochs}&batch_size=${batchSize}`, {
    method: "POST",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to start YOLO training");
  }
  return res.json();
};

export const getYoloTrainingStatus = async (
  fetchWithInterceptor: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/image/training-status", {
    method: "GET",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch training status");
  }
  return res.json();
};

export const getYoloTrainingDataList = async (
  fetchWithInterceptor: any,
  options?: RequestInit
): Promise<Array<{ pair_id: string; original_url: string; mask_url: string }>> => {
  const res = await fetchWithInterceptor("/api/image/training-data-list", {
    method: "GET",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch training data list");
  }
  return res.json();
};

export const deleteYoloTrainingDataPair = async (
  fetchWithInterceptor: any,
  pairId: string,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(`/api/image/training-data-pair/${pairId}`, {
    method: "DELETE",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to delete training pair");
  }
  return res.json();
};


