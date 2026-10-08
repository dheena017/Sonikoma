import {
  AgentRunRequest,
  AgentRunResponse,
  AgentApproveRequest,
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
  const response = await fetcher(`${BASE_URL}/approve/${encodeURIComponent(runId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
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
