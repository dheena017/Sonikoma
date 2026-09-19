import { apiRequest } from "../client/request";
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
} from "../types";

export type { CreditsPayload, CreditTransaction };

export const login = async (
  fetchWithInterceptor: FetchClient,
  credentials: LoginCredentials
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
};

export const register = async (
  fetchWithInterceptor: FetchClient,
  userData: RegisterUserData
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
};

let inFlightCurrentUserPromise: Promise<ApiResponse<any>> | null = null;
let lastCurrentUserCache: { data: ApiResponse<any>; timestamp: number } | null = null;

export const getCurrentUser = async (
  fetchWithInterceptor: FetchClient,
  force = false
): Promise<ApiResponse<any>> => {
  const now = Date.now();
  if (!force && lastCurrentUserCache && now - lastCurrentUserCache.timestamp < 3000) {
    return lastCurrentUserCache.data;
  }
  if (!force && inFlightCurrentUserPromise) {
    return inFlightCurrentUserPromise;
  }

  inFlightCurrentUserPromise = apiRequest(fetchWithInterceptor, "/api/v1/auth/me")
    .then((res) => {
      lastCurrentUserCache = { data: res, timestamp: Date.now() };
      return res;
    })
    .finally(() => {
      inFlightCurrentUserPromise = null;
    });

  return inFlightCurrentUserPromise;
};

export const forgotPassword = async (
  fetchWithInterceptor: FetchClient,
  email: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const googleLogin = async (
  fetchWithInterceptor: FetchClient,
  token: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
};

export const updateProfile = async (
  fetchWithInterceptor: FetchClient,
  data: UpdateProfilePayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/profile", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/password", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/sessions");
};

export const terminateSession = async (
  fetchWithInterceptor: FetchClient,
  sessionId: string
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, `/api/v1/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });
};

export const claimCredits = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/claim-daily-credits", {
    method: "POST",
  });
};

export const upgradePlan = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/upgrade-plan", {
    method: "POST",
  });
};

export const saveCard = async (
  fetchWithInterceptor: FetchClient,
  card: CardData
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/save-card", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/purchase-credits", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/api-keys");
};

export const createApiKey = async (
  fetchWithInterceptor: FetchClient,
  data: CreateApiKeyPayload
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/api-keys", {
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
  return apiRequest(fetchWithInterceptor, `/api/v1/auth/api-keys/${keyId}`, {
    method: "DELETE",
  });
};

export const getInvoices = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/invoices");
};

export const updateMfa = async (
  fetchWithInterceptor: FetchClient,
  enabled: boolean
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/mfa", {
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
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/redeem-points", {
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
    `/api/v1/auth/audit-logs?query=${encodeURIComponent(
      query
    )}&page=${page}&limit=${limit}`
  );
};

export const deleteAccount = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/me", {
    method: "DELETE",
  });
};

let inFlightCreditsPromise: Promise<CreditsPayload | null> | null = null;
let lastCreditsCache: { data: CreditsPayload; timestamp: number } | null = null;

export const getUserCredits = async (
  fetchWithInterceptor: FetchClient
): Promise<number | null> => {
  const payload = await getUserCreditsPayload(fetchWithInterceptor);
  return payload ? payload.credits : null;
};

/** Full credits payload including low_balance flag with in-flight deduplication & micro-caching. */
export const getUserCreditsPayload = async (
  fetchWithInterceptor: FetchClient,
  force = false
): Promise<CreditsPayload | null> => {
  const now = Date.now();
  if (!force && lastCreditsCache && now - lastCreditsCache.timestamp < 3000) {
    return lastCreditsCache.data;
  }
  if (!force && inFlightCreditsPromise) {
    return inFlightCreditsPromise;
  }

  inFlightCreditsPromise = (async () => {
    try {
      const data = await apiRequest<any>(
        fetchWithInterceptor,
        "/api/v1/auth/credits"
      );
      if (data.success && typeof data.credits === "number") {
        const payload: CreditsPayload = {
          credits: data.credits,
          low_balance: data.low_balance ?? data.credits < 20,
          threshold: data.threshold ?? 20,
        };
        lastCreditsCache = { data: payload, timestamp: Date.now() };
        return payload;
      }
      return null;
    } catch {
      return null;
    } finally {
      inFlightCreditsPromise = null;
    }
  })();

  return inFlightCreditsPromise;
};

export const getTransactions = async (
  fetchWithInterceptor: FetchClient,
  limit = 100
): Promise<CreditTransaction[]> => {
  try {
    const data = await apiRequest<any>(
      fetchWithInterceptor,
      `/api/v1/auth/transactions?limit=${limit}`
    );
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  } catch {
    return [];
  }
};

export const claimDailyCredits = async (
  fetchWithInterceptor: FetchClient
): Promise<ApiResponse<any>> => {
  return apiRequest(fetchWithInterceptor, "/api/v1/auth/claim-daily-credits", {
    method: "POST",
  });
};
