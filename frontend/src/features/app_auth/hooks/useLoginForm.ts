import React from "react";
import { THEMES, ThemeKey, TOUR_STEPS, TRANSLATIONS } from "@/features/app_auth/components/constants";

export type Language = "en" | "ko" | "ja";

export interface LoginFormProps {
  onLogin: (data: any) => Promise<void>;
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
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [passkeyStatus, setPasskeyStatus] = React.useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await props.onLogin({ email, password, rememberMe });
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



  const handlePasskeySignIn = () => {
    setIsPasskeyLoading(true);
    setPasskeyStatus("Contacting biometric key hardware...");
    setTimeout(() => {
      setPasskeyStatus("Scanning TouchID / FaceID sensors...");
      setTimeout(() => {
        setIsPasskeyLoading(false);
        setPasskeyStatus("Passkey authentication is not yet configured.");
      }, 1400);
    }, 1000);
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
    isShortcutsOpen,
    setIsShortcutsOpen,
    isPasskeyLoading,
    setIsPasskeyLoading,
    passkeyStatus,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    isEmailValid,
    isPasswordValid,
    handleSubmit,
    handleSocialLogin,
    handlePasskeySignIn,
    checkCapsLock,
    currentTheme: THEMES[activeTheme],
    t: TRANSLATIONS[language],
    tourSteps: TOUR_STEPS,
    onNavigateToRegister: props.onNavigateToRegister,
    onNavigateToForgotPassword: props.onNavigateToForgotPassword,
    onNavigateHome: props.onNavigateHome,
  };
}
