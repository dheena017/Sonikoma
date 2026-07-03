import React from "react";
import { THEMES, ThemeKey, TOUR_STEPS, TRANSLATIONS } from "../constants";

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
  const [isQrLogin, setIsQrLogin] = React.useState(false);
  const [qrTimer, setQrTimer] = React.useState(60);
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [passkeyStatus, setPasskeyStatus] = React.useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(0);

  React.useEffect(() => {
    if (!isQrLogin || qrTimer <= 0) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isQrLogin, qrTimer]);

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
      (window as any).navigateTo?.("/dashboard");
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

  const handleQuickFill = () => {
    setEmail("creator@sonikoma.com");
    setPassword("password123");
    setRememberMe(true);
    if (error) setError(null);
  };

  const handlePasskeySignIn = () => {
    setIsPasskeyLoading(true);
    setPasskeyStatus("Contacting biometric key hardware...");
    setTimeout(() => {
      setPasskeyStatus("Scanning TouchID / FaceID sensors...");
      setTimeout(() => {
        setIsPasskeyLoading(false);
        setPasskeyStatus(null);
        setEmail("passkey_creator@sonikoma.com");
        setPassword("passkey_secret_2026");
        setRememberMe(true);
        setError(null);
      }, 1400);
    }, 1000);
  };

  const handleQrSimulateSuccess = async () => {
    setIsLoading(true);
    setTimeout(async () => {
      setEmail("qr_direct_creator@sonikoma.com");
      setPassword("qr_token_verified_99");
      setRememberMe(true);
      setIsLoading(false);
      setIsQrLogin(false);
      await (window as any).alertAsync(
        "Mobile authenticator token successfully verified! Logging in..."
      );
    }, 1200);
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
    isQrLogin,
    setIsQrLogin,
    qrTimer,
    isShortcutsOpen,
    setIsShortcutsOpen,
    isPasskeyLoading,
    passkeyStatus,
    isTourOpen,
    setIsTourOpen,
    tourStep,
    setTourStep,
    isEmailValid,
    isPasswordValid,
    handleSubmit,
    handleSocialLogin,
    handleQuickFill,
    handlePasskeySignIn,
    handleQrSimulateSuccess,
    checkCapsLock,
    currentTheme: THEMES[activeTheme],
    t: TRANSLATIONS[language],
    tourSteps: TOUR_STEPS,
    onNavigateToRegister: props.onNavigateToRegister,
    onNavigateToForgotPassword: props.onNavigateToForgotPassword,
    onNavigateHome: props.onNavigateHome,
  };
}
