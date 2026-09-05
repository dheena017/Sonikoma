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
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [language, setLanguage] = React.useState<Language>("en");
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(0);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(urlError);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await props.onLogin({ email, password, rememberMe });
      if (res === false) {
        throw new Error("Invalid email or password. Please try again.");
      }
      sessionStorage.setItem("sonikoma_show_welcome_back", "true");
      const target = "/dashboard";
      if (typeof (window as any).navigateTo === "function") {
        (window as any).navigateTo(target);
      } else {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new Event("popstate"));
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "Google") {
      window.location.href = "/api/auth/google/login";
    } else {
      setError(`OAuth sign in with ${provider} is not configured yet.`);
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
    error,
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
