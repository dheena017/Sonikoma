import { LucideIcon } from "lucide-react";

export type ThemeKey = "blue" | "purple" | "emerald" | "amber";
export type Language = "en" | "ko" | "ja";

export type AuthErrorType =
  | "invalid_credentials"
  | "user_not_found"
  | "rate_limited"
  | "network"
  | "unverified"
  | "general"
  | null;

export interface RegisterFieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export interface ThemeConfig {
  glowPrimary: string;
  glowSecondary: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  button: string;
  focus: string;
  dot: string;
  cardBorder: string;
  badgeBg: string;
}

export interface AuthUser {
  id?: string | number;
  email?: string;
  name?: string;
  full_name?: string;
  username?: string;
  role?: string;
  creator_role?: string;
  avatar_url?: string;
  credits?: number;
  streak_days?: number;
  has_claimed_today?: boolean;
  is_locked?: boolean;
  [key: string]: any;
}

export interface CreatorRoleOption {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export interface LoginPageProps {
  onLogin: (data: any) => Promise<any>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export interface RegisterPageProps {
  onRegister: (data: any) => Promise<any>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export interface AuthSuccessPageProps {
  navigateTo: (path: string) => void;
  checkAuth?: () => Promise<any>;
}

export type LoginFormProps = LoginPageProps;
export type RegisterFormProps = RegisterPageProps;
export type ForgotPasswordFormProps = ForgotPasswordPageProps;
