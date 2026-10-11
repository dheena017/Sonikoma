import {
  AgentRunRequest,
  AgentRunResponse,
  AgentApproveRequest,
  AgentReuploadRequest,
} from "../types";

const BASE_URL = "/api/v1/creative/agent";

export async function launchAgent(
  fetchWithInterceptor: any,
  request: AgentRunRequest
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to launch autonomous agent.");
  }
  return response.json();
}

export async function getAgentStatus(
  fetchWithInterceptor: any,
  runId: string
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/status/${encodeURIComponent(runId)}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch agent status.");
  }
  return response.json();
}

export async function approveAgent(
  fetchWithInterceptor: any,
  runId: string,
  data?: AgentApproveRequest
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const cleanData: Record<string, any> = {};
  if (data) {
    if (typeof data.title_override === "string") {
      cleanData.title_override = data.title_override;
    }
    if (typeof data.privacy_status === "string") {
      cleanData.privacy_status = data.privacy_status;
    }
  }
  const response = await fetcher(`${BASE_URL}/approve/${encodeURIComponent(runId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to approve agent checkpoint.");
  }
  return response.json();
}

export async function getAgentHistory(
  fetchWithInterceptor: any
): Promise<AgentRunResponse[]> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/history`, {
    method: "GET",
  });

  if (!response.ok) {
    return [];
  }
  const data = await response.json().catch(() => ({ runs: [] }));
  return data.runs || [];
}

export async function deleteAgentRun(
  fetchWithInterceptor: any,
  runId: string
): Promise<boolean> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/run/${encodeURIComponent(runId)}`, {
    method: "DELETE",
  });
  return response.ok;
}

export async function stopAgent(
  fetchWithInterceptor: any,
  runId: string
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/stop/${encodeURIComponent(runId)}`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to stop agent execution.");
  }
  return response.json();
}

export async function restartAgent(
  fetchWithInterceptor: any,
  runId: string
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/restart/${encodeURIComponent(runId)}`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to restart agent.");
  }
  return response.json();
}

export async function reuploadAgentVideo(
  fetchWithInterceptor: any,
  runId: string,
  data?: AgentReuploadRequest
): Promise<AgentRunResponse> {
  const fetcher = fetchWithInterceptor || window.fetch.bind(window);
  const response = await fetcher(`${BASE_URL}/reupload/${encodeURIComponent(runId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload video to YouTube.");
  }
  return response.json();
}


