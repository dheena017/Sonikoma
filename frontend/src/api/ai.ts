export const analyzeImage = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const analyzeNarrativeSequence = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/narratives/analyze-sequence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const analyzeSequence = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/analyze-sequence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const generateSpeechText = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/generate-speech-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const aiDetectPanels = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/ai-detect-panels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const aiSmartCrop = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/ai-smart-crop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const listModels = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/list-models", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });

  return res.json();
};

export const executeSkill = async (
  fetchWithInterceptor: any,
  endpoint: string,
  payload: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    ...options,
  });

  return res.json();
};

export const generateSequenceNarrative = async (
  fetchWithInterceptor: any,
  data: {
    panels: { id: number; visual_description: string }[];
    model?: string;
    voice?: string;
  },
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/generate-sequence-narrative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    // FastAPI error responses use `detail`, surface it as a proper Error
    throw new Error(json?.detail || `Request failed with status ${res.status}`);
  }
  return json;
};
