import React from "react";
import {
  THEMES,
  ThemeKey,
  TOUR_STEPS,
  TRANSLATIONS,
} from "@/features/app_auth/components/constants";

export type Language = "en" | "ko" | "ja";

export interface LoginFormProps {
  onLogin: (data: any) => Promise<any>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export default function useLoginForm(props: LoginFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [language, setLanguage] = React.useState<Language>("en");
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(0);
  const [socialProviderLoading, setSocialProviderLoading] = React.useState<string | null>(null);

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
      } else if (urlError === "oauth_cancelled" || urlError === "access_denied") {
        setError("Social login was cancelled or permission was denied. Please try again.");
      } else {
        setError(decodeURIComponent(urlError));
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
    setEmail("creator@sonikoma.ai");
    setPassword("StudioPass123!");
    setError(null);
    setInfoMessage("Demo creator account credentials filled. Click 'Sign In' to enter.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim()) {
      setError("Please enter your email address.");
      setInfoMessage(null);
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      setInfoMessage(null);
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      setInfoMessage(null);
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 6 characters long.");
      setInfoMessage(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await props.onLogin({ email, password, rememberMe });
      if (res === false) {
        throw new Error("Invalid email or password. Please verify your credentials.");
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
      setError(err.message || "Sign in failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setSocialProviderLoading(provider);
    setError(null);
    setInfoMessage(null);

    if (provider === "Google") {
      window.location.href = "/api/auth/google/login";
    } else if (provider === "GitHub") {
      window.location.href = "/api/auth/github/login";
    } else if (provider === "Discord") {
      window.location.href = "/api/auth/discord/login";
    } else {
      setSocialProviderLoading(null);
      setError(`OAuth sign in with ${provider} is currently unavailable.`);
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

