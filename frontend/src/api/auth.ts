import { apiRequest } from "./request";
import {
  FetchClient,
  ApiResponse,
  LoginCredentials,
  RegisterUserData,
  UpdateProfilePayload,
  UpdatePasswordPayload,
  CardData,
  PurchaseCreditsPayload,
  CreateApiKeyPayload,
  RedeemRewardPayload,
  CreditsPayload,
  CreditTransaction,
} from "./types";

export type { CreditsPayload, CreditTransaction };

export const login = async (
  fetchWithInterceptor: FetchClient,
  credentials: LoginCredentials
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
};

export const register = async (
  fetchWithInterceptor: FetchClient,
  userData: RegisterUserData
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
};

export const getCurrentUser = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/me");
};

export const forgotPassword = async (
  fetchWithInterceptor: FetchClient,
  email: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const googleLogin = async (
  fetchWithInterceptor: FetchClient,
  token: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
};

export const updateProfile = async (
  fetchWithInterceptor: FetchClient,
  data: UpdateProfilePayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const updatePassword = async (
  fetchWithInterceptor: FetchClient,
  data: UpdatePasswordPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getSessions = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/sessions");
};

export const terminateSession = async (
  fetchWithInterceptor: FetchClient,
  sessionId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/sessions/${sessionId}`,
    {
      method: "DELETE",
    }
  );
};

export const claimCredits = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/claim-credits", {
    method: "POST",
  });
};

export const upgradePlan = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/upgrade-plan", {
    method: "POST",
  });
};

export const saveCard = async (
  fetchWithInterceptor: FetchClient,
  card: CardData
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/save-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });
};

export const purchaseCredits = async (
  fetchWithInterceptor: FetchClient,
  data: PurchaseCreditsPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/purchase-credits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getApiKeys = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/api-keys");
};

export const createApiKey = async (
  fetchWithInterceptor: FetchClient,
  data: CreateApiKeyPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const deleteApiKey = async (
  fetchWithInterceptor: FetchClient,
  keyId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/auth/api-keys/${keyId}`, {
    method: "DELETE",
  });
};

export const getInvoices = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/invoices");
};

export const updateMfa = async (
  fetchWithInterceptor: FetchClient,
  enabled: boolean
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/mfa", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mfa_enabled: enabled }),
  });
};

export const redeemReward = async (
  fetchWithInterceptor: FetchClient,
  data: RedeemRewardPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/redeem-points", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const getAuditLogs = async (
  fetchWithInterceptor: any,
  query: string,
  page: number,
  limit: number
): Promise<ApiResponse<any>> => {
  return apiRequest(
    fetchWithInterceptor,
    `/api/auth/audit-logs?query=${encodeURIComponent(
      query
    )}&page=${page}&limit=${limit}`
  );
};

export const deleteAccount = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/auth/me", {
    method: "DELETE",
  });
};

export const getUserCredits = async (
  fetchWithInterceptor: FetchClient
): Promise<number | null> => {
  try {
    const data = await apiRequest<any>(fetchWithInterceptor, "/api/auth/credits");
    if (data.success && typeof data.credits === "number") {
      return data.credits;
    }
    return null;
  } catch {
    return null;
  }
};

/** Full credits payload including low_balance flag. */
export const getUserCreditsPayload = async (
  fetchWithInterceptor: FetchClient
): Promise<CreditsPayload | null> => {
  try {
    const data = await apiRequest<any>(fetchWithInterceptor, "/api/auth/credits");
    if (data.success && typeof data.credits === "number") {
      return {
        credits: data.credits,
        low_balance: data.low_balance ?? data.credits < 20,
        threshold: data.threshold ?? 20,
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const getTransactions = async (
  fetchWithInterceptor: FetchClient,
  limit = 100
): Promise<CreditTransaction[]> => {
  try {
    const data = await apiRequest<any>(
      fetchWithInterceptor,
      `/api/auth/transactions?limit=${limit}`
    );
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  } catch {
    return [];
  }
};
