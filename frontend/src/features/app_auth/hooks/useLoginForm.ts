import React from "react";
import {
  THEMES,
  ThemeKey,
  TOUR_STEPS,
  TRANSLATIONS,
} from "@/features/app_auth/components/constants";

export type Language = "en" | "ko" | "ja";

export type AuthErrorType =
  | "invalid_credentials"
  | "user_not_found"
  | "rate_limited"
  | "network"
  | "unverified"
  | "general"
  | null;

export interface LoginFormProps {
  onLogin: (data: any) => Promise<any>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export default function useLoginForm(props: LoginFormProps) {
  const [email, setEmailState] = React.useState("");
  const [password, setPasswordState] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorType, setErrorType] = React.useState<AuthErrorType>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [language, setLanguage] = React.useState<Language>("en");
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(0);
  const [socialProviderLoading, setSocialProviderLoading] = React.useState<string | null>(null);
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Online / Offline monitor
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (errorType === "network") {
        setError(null);
        setErrorType(null);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError("You appear to be offline. Please check your internet connection.");
      setErrorType("network");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [errorType]);

  const setEmail = (val: string) => {
    setEmailState(val);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (error) {
      setError(null);
      setErrorType(null);
    }
  };

  const setPassword = (val: string) => {
    setPasswordState(val);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (error) {
      setError(null);
      setErrorType(null);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error") || params.get("error_description");
    const urlMsg = params.get("msg") || params.get("message");
    const isRegistered = params.get("registered") === "true" || params.get("registered") === "1";
    const isReset = params.get("reset") === "true" || params.get("reset") === "1";
    const isVerified = params.get("verified") === "true" || params.get("verified") === "1";

    if (isRegistered) {
      setInfoMessage("Account created successfully! Please sign in with your credentials.");
    } else if (isReset) {
      setInfoMessage("Your password has been reset successfully. Please sign in with your new password.");
    } else if (isVerified) {
      setInfoMessage("Your email has been verified! You can now access your studio account.");
    } else if (urlMsg) {
      setInfoMessage(decodeURIComponent(urlMsg));
    }

    if (urlError) {
      if (urlError === "session_expired") {
        setError("Your session has expired. Please sign in again to continue.");
        setErrorType("general");
      } else if (urlError === "oauth_cancelled" || urlError === "access_denied") {
        setError("Social login was cancelled or permission was denied. Please try again.");
        setErrorType("general");
      } else {
        setError(decodeURIComponent(urlError));
        setErrorType("general");
      }
    }
  }, []);

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isPasswordValid = React.useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const [showWelcomeBack, setShowWelcomeBack] = React.useState(false);

  const confirmWelcomeBack = () => {
    setShowWelcomeBack(false);
    const target = "/dashboard";
    if (typeof (window as any).navigateTo === "function") {
      (window as any).navigateTo(target);
    } else {
      window.history.replaceState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const fillDemoCredentials = () => {
    setEmailState("creator@sonikoma.ai");
    setPasswordState("StudioPass123!");
    setError(null);
    setErrorType(null);
    setFieldErrors({});
    setInfoMessage("Demo creator account credentials filled. Click 'Sign In' to enter.");
  };

  const parseErrorMessage = (rawError: any): { message: string; type: AuthErrorType } => {
    let rawMsg = "";
    if (typeof rawError === "string") {
      rawMsg = rawError;
    } else if (rawError?.detail) {
      rawMsg = Array.isArray(rawError.detail)
        ? rawError.detail.map((d: any) => d.msg || d.message).join(", ")
        : String(rawError.detail);
    } else if (rawError?.message) {
      rawMsg = String(rawError.message);
    } else if (rawError?.error) {
      rawMsg = String(rawError.error);
    } else {
      rawMsg = String(rawError || "");
    }
    const lower = rawMsg.toLowerCase();

    if (!navigator.onLine || lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
      return {
        message: "Unable to connect to the authentication server. Please check your internet connection or verify the backend is running.",
        type: "network",
      };
    }
    if (lower.includes("rate") || lower.includes("too many") || lower.includes("429")) {
      return {
        message: "Too many login attempts. Please wait 60 seconds before trying again.",
        type: "rate_limited",
      };
    }
    if (lower.includes("not found") || lower.includes("no user") || lower.includes("user does not exist") || lower.includes("account not found")) {
      return {
        message: "No account found with this email. Would you like to create a free account?",
        type: "user_not_found",
      };
    }
    if (lower.includes("unverified") || lower.includes("verify email") || lower.includes("not confirmed")) {
      return {
        message: "Your email address is not verified yet. Please check your inbox for the confirmation link.",
        type: "unverified",
      };
    }
    if (lower.includes("invalid") || lower.includes("password") || lower.includes("credentials") || lower.includes("401") || lower.includes("unauthorized") || lower.includes("incorrect")) {
      return {
        message: "Incorrect email or password. Please verify your credentials or reset your password.",
        type: "invalid_credentials",
      };
    }

    return {
      message: rawMsg.trim() || "Sign in failed. Please check your credentials and try again.",
      type: "general",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!isEmailValid) {
      errors.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!isPasswordValid) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields before continuing.");
      setErrorType("general");
      setInfoMessage(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setFieldErrors({});
    setInfoMessage(null);

    try {
      const res = await props.onLogin({ email, password, rememberMe });
      if (res === false) {
        throw new Error("Invalid email or password.");
      }
      sessionStorage.setItem("sonikoma_show_welcome_back", "true");
      sessionStorage.removeItem("sonikoma_show_welcome_user");
      const target = "/dashboard";
      if (typeof (window as any).navigateTo === "function") {
        (window as any).navigateTo(target);
      } else {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new Event("popstate"));
      }
    } catch (err: any) {
      const parsed = parseErrorMessage(err);
      setError(parsed.message);
      setErrorType(parsed.type);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (!navigator.onLine) {
      setError("You appear to be offline. Cannot connect to social authentication.");
      setErrorType("network");
      return;
    }

    setSocialProviderLoading(provider);
    setError(null);
    setErrorType(null);
    setInfoMessage(null);

    if (provider === "Google") {
      window.location.href = "/api/v1/auth/google/login";
    } else if (provider === "GitHub") {
      window.location.href = "/api/v1/auth/github/login";
    } else if (provider === "Discord") {
      window.location.href = "/api/v1/auth/discord/login";
    } else {
      setSocialProviderLoading(null);
      setError(`OAuth sign in with ${provider} is currently unavailable.`);
      setErrorType("general");
    }
  };

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState("CapsLock"));
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    isSocialLoading: Boolean(socialProviderLoading),
    socialProviderLoading,
    error,
    setError,
    errorType,
    fieldErrors,
    isOnline,
    infoMessage,
    setInfoMessage,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    activeTheme,
    setActiveTheme,
    language,
    setLanguage,
    isCapsLockOn,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    isEmailValid,
    isPasswordValid,
    fillDemoCredentials,
    handleSubmit,
    handleSocialLogin,
    checkCapsLock,
    currentTheme: THEMES[activeTheme],
    t: TRANSLATIONS[language],
    showWelcomeBack,
    setShowWelcomeBack,
    confirmWelcomeBack,
    onNavigateToRegister: props.onNavigateToRegister,
    onNavigateToForgotPassword: props.onNavigateToForgotPassword,
    onNavigateHome: props.onNavigateHome,
  };
}

