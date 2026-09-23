import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export const analyzeImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-image url=${data?.url?.slice(0, 60)}... model=${data?.model || "default"} has_memory=${Boolean(data?.story_memory)}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-image success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-image failed:`, err);
    throw err;
  }
};

export const analyzeSingleImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-single-image url=${data?.url?.slice(0, 60)}...`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-single-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-single-image success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-single-image failed:`, err);
    throw err;
  }
};

export const analyzeSequence = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-sequence total_urls=${data?.urls?.length || 0}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-sequence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-sequence success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-sequence failed:`, err);
    throw err;
  }
};

export const analyzePanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-panels total_panels=${data?.panels?.length || 0} model=${data?.model || "default"} has_memory=${Boolean(data?.story_memory)}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-panels success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-panels failed:`, err);
    throw err;
  }
};

export const analyzeSelectedPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-selected-panels panels=${data?.panels?.length || 0} model=${data?.model || "default"} has_memory=${Boolean(data?.story_memory)}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-selected-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-selected-panels success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-selected-panels failed:`, err);
    throw err;
  }
};

export const analyzeAllPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/analyze-all-panels panels=${data?.panels?.length || 0}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/analyze-all-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/analyze-all-panels success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/analyze-all-panels failed:`, err);
    throw err;
  }
};

export const generateSpeechText = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/generate-speech-text:`, data);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/generate-speech-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/generate-speech-text success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/generate-speech-text failed:`, err);
    throw err;
  }
};

export const aiDetectPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/ai-detect-panels url=${data?.url?.slice(0, 60)}...`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/ai-detect-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/ai-detect-panels success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/ai-detect-panels failed:`, err);
    throw err;
  }
};

export const aiSmartCrop = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/ai-smart-crop url=${data?.url?.slice(0, 60)}...`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/ai-smart-crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/ai-smart-crop success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/ai-smart-crop failed:`, err);
    throw err;
  }
};

export const listModels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/list-models provider=${data?.provider || "default"}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/list-models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/list-models success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/list-models failed:`, err);
    throw err;
  }
};

export const executeSkill = async (
  fetchWithInterceptor: FetchClient,
  endpoint: string,
  payload: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Skill Request] POST ${endpoint}:`, payload);
  try {
    const res = await apiRequest(fetchWithInterceptor, endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Skill Response] ${endpoint} (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Skill Error] ${endpoint}:`, err);
    throw err;
  }
};
