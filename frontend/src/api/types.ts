export type FetchClient = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type ApiResponse<T> = T & {
  success?: boolean;
  message?: string;
  error?: string;
  detail?: string;
};

export interface CreditsPayload {
  credits: number;
  low_balance: boolean;
  threshold: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  feature_name: string;
  created_at: string;
  /** Running balance immediately after this transaction was applied (server-computed) */
  balance_after?: number;
}

// Auth Related Payload Types
export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface RegisterUserData {
  email?: string;
  password?: string;
  username?: string;
  [key: string]: any;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface UpdatePasswordPayload {
  old_password?: string;
  new_password?: string;
  [key: string]: any;
}

export interface CardData {
  number?: string;
  exp_month?: number;
  exp_year?: number;
  cvc?: string;
  [key: string]: any;
}

export interface PurchaseCreditsPayload {
  amount?: number;
  token?: string;
  [key: string]: any;
}

export interface CreateApiKeyPayload {
  name?: string;
  [key: string]: any;
}

export interface RedeemRewardPayload {
  reward_id?: string;
  points?: number;
  [key: string]: any;
}

// Projects Related Payload Types
export interface CreateProjectPayload {
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface SaveScrapedImagesPayload {
  project_id?: string;
  scraped_images?: string[];
  [key: string]: any;
}
