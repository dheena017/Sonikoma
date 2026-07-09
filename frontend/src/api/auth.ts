export const login = async (fetchWithInterceptor: any, credentials: any) => {
  const res = await fetchWithInterceptor("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
};

export const register = async (fetchWithInterceptor: any, userData: any) => {
  const res = await fetchWithInterceptor("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const getCurrentUser = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/me");
  return res.json();
};

export const forgotPassword = async (
  fetchWithInterceptor: any,
  email: string
) => {
  const res = await fetchWithInterceptor("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

export const googleLogin = async (fetchWithInterceptor: any, token: string) => {
  const res = await fetchWithInterceptor("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.json();
};

export const updateProfile = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const updatePassword = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/password", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getSessions = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/sessions");
  return res.json();
};

export const terminateSession = async (
  fetchWithInterceptor: any,
  sessionId: string
) => {
  const res = await fetchWithInterceptor(`/api/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });

  return res.json();
};

export const claimCredits = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/claim-credits", {
    method: "POST",
  });

  return res.json();
};

export const upgradePlan = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/upgrade-plan", {
    method: "POST",
  });

  return res.json();
};

export const saveCard = async (fetchWithInterceptor: any, card: any) => {
  const res = await fetchWithInterceptor("/api/auth/save-card", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });

  return res.json();
};

export const purchaseCredits = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/purchase-credits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getApiKeys = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/api-keys");
  return res.json();
};

export const createApiKey = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const deleteApiKey = async (
  fetchWithInterceptor: any,
  keyId: string
) => {
  const res = await fetchWithInterceptor(`/api/auth/api-keys/${keyId}`, {
    method: "DELETE",
  });

  return res.json();
};

export const getInvoices = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/invoices");
  return res.json();
};

export const updateMfa = async (
  fetchWithInterceptor: any,
  enabled: boolean
) => {
  const res = await fetchWithInterceptor("/api/auth/mfa", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mfa_enabled: enabled }),
  });

  return res.json();
};

export const redeemReward = async (fetchWithInterceptor: any, data: any) => {
  const res = await fetchWithInterceptor("/api/auth/redeem-points", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getAuditLogs = async (
  fetchWithInterceptor: any,
  query: string,
  page: number,
  limit: number
) => {
  const res = await fetchWithInterceptor(
    `/api/auth/audit-logs?query=${encodeURIComponent(
      query
    )}&page=${page}&limit=${limit}`
  );

  return res.json();
};

export const deleteAccount = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/auth/me", {
    method: "DELETE",
  });

  return res.json();
};

export const getUserCredits = async (fetchWithInterceptor: any): Promise<number | null> => {
  try {
    const res = await fetchWithInterceptor("/api/auth/credits");
    const data = await res.json();
    if (data.success && typeof data.credits === "number") {
      return data.credits;
    }
    return null;
  } catch {
    return null;
  }
};

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  feature_name: string;
  created_at: string;
  /** Running balance immediately after this transaction was applied (server-computed) */
  balance_after?: number;
}

export const getTransactions = async (
  fetchWithInterceptor: any,
  limit = 100
): Promise<CreditTransaction[]> => {
  try {
    const res = await fetchWithInterceptor(`/api/auth/transactions?limit=${limit}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  } catch {
    return [];
  }
};
