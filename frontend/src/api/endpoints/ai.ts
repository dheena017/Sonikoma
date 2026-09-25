import { apiRequest } from "../client/request";
import { FetchClient, ApiResponse } from "../types";

export const analyzeImage = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/analyze-single-image url=${data?.url?.slice(0, 60)}... model=${data?.model || "default"} has_memory=${Boolean(data?.story_memory)}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/analyze-single-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/analyze-single-image success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/analyze-single-image failed:`, err);
    throw err;
  }
};

// analyzeSingleImage is the canonical name — analyzeImage is kept as an alias for backward compat
export const analyzeSingleImage = analyzeImage;

export const analyzeAllPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/analyze-all-panels urls=${data?.urls?.length || 0} model=${data?.model || "default"} has_memory=${Boolean(data?.story_memory)}`);
  console.log("[AI Endpoint] /api/v1/ai/analyze-all-panels input:", data);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/analyze-all-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/analyze-all-panels output (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/analyze-all-panels failed:`, err);
    throw err;
  }
};

export const analyzeSelectedPanels = analyzeAllPanels;
export const analyzePanels = analyzeAllPanels;

export const generateSpeechText = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/generate-speech-text:`, data);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/generate-speech-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/generate-speech-text success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/generate-speech-text failed:`, err);
    throw err;
  }
};

export const aiDetectPanels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/ai-detect-panels url=${data?.url?.slice(0, 60)}...`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/ai-detect-panels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/ai-detect-panels success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/ai-detect-panels failed:`, err);
    throw err;
  }
};

export const aiSmartCrop = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/ai-smart-crop url=${data?.url?.slice(0, 60)}...`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/ai-smart-crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/ai-smart-crop success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/ai-smart-crop failed:`, err);
    throw err;
  }
};

export const listModels = async (
  fetchWithInterceptor: FetchClient,
  data: any,
  options?: RequestInit
): Promise<ApiResponse<any>> => {
  const start = performance.now();
  console.log(`[AI Endpoint] POST /api/v1/ai/list-models provider=${data?.provider || "default"}`);
  try {
    const res = await apiRequest(fetchWithInterceptor, "/api/v1/ai/list-models", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      ...options,
    });
    const elapsed = Math.round(performance.now() - start);
    console.log(`[AI Endpoint] /api/v1/ai/list-models success (${elapsed}ms):`, res);
    return res;
  } catch (err) {
    console.error(`[AI Endpoint] /api/v1/ai/list-models failed:`, err);
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
