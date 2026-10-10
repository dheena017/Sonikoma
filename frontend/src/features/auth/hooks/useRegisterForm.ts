import React from "react";
import { THEMES, ThemeKey } from "@/features/auth/components/constants";

export interface RegisterFormProps {
  onRegister: (data: any) => Promise<any>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export interface RegisterFieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export default function useRegisterForm(props: RegisterFormProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSocialLoading, setIsSocialLoading] = React.useState(false);
  const [socialProviderLoading, setSocialProviderLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<RegisterFieldErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = React.useState(true);
  const [creatorRole, setCreatorRole] = React.useState("manga_artist");
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [passwordNotification, setPasswordNotification] = React.useState<string | null>(null);

  // Password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const passwordsMatch = Boolean(
    password && confirmPassword && password === confirmPassword
  );

  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUppercase && hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    return score;
  }, [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial]);

  const strengthPercent = React.useMemo(() => {
    if (!password) return "0%";
    if (passwordStrength === 1) return "25%";
    if (passwordStrength === 2) return "50%";
    if (passwordStrength === 3) return "75%";
    if (passwordStrength >= 4) return "100%";
    return "15%";
  }, [password, passwordStrength]);

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isFormValid = React.useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      isEmailValid &&
      hasMinLength &&
      password === confirmPassword &&
      acceptTerms
    );
  }, [fullName, isEmailValid, hasMinLength, password, confirmPassword, acceptTerms]);

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused chars
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const special = "!@#$%^&*_-";

    let generated = "";
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 10; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    generated = generated
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setFieldErrors((prev) => ({
      ...prev,
      password: undefined,
      confirmPassword: undefined,
    }));
    setPasswordNotification("High-security password auto-filled & confirmed!");
    setTimeout(() => setPasswordNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const newErrors: RegisterFieldErrors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name (at least 2 characters).";
    }
    if (!email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!isEmailValid) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Please enter a password.";
    } else if (!hasMinLength) {
      newErrors.password = "Password must be at least 8 characters long.";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!acceptTerms) {
      newErrors.acceptTerms = "You must agree to the Terms of Service to continue.";
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError("Please resolve the highlighted fields below.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await props.onRegister({
        email,
        password,
        full_name: fullName.trim(),
        creator_role: creatorRole,
        subscribe_newsletter: subscribeNewsletter,
      });
      if (res === false) {
        throw new Error("Failed to create account. Please check your credentials.");
      }
      sessionStorage.setItem("sonikoma_show_welcome_user", "true");
      sessionStorage.removeItem("sonikoma_show_welcome_back");
      const target = "/dashboard";
      if (typeof (window as any).navigateTo === "function") {
        (window as any).navigateTo(target);
      } else {
        window.history.replaceState({}, "", target);
        window.dispatchEvent(new Event("popstate"));
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const [showWelcomeUser, setShowWelcomeUser] = React.useState(false);

  const confirmWelcomeUser = () => {
    setShowWelcomeUser(false);
    const target = "/dashboard";
    if (typeof (window as any).navigateTo === "function") {
      (window as any).navigateTo(target);
    } else {
      window.history.replaceState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handleSocialRegister = (provider: string) => {
    setIsSocialLoading(true);
    setSocialProviderLoading(provider);
    if (provider === "Google") {
      window.location.href = "/api/v1/auth/google/login";
    } else if (provider === "GitHub") {
      window.location.href = "/api/v1/auth/github/login";
    } else {
      setError(`OAuth register via ${provider} is not configured yet.`);
      setIsSocialLoading(false);
      setSocialProviderLoading(null);
    }
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isSocialLoading,
    socialProviderLoading,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isCapsLockOn,
    checkCapsLock,
    acceptTerms,
    setAcceptTerms,
    subscribeNewsletter,
    setSubscribeNewsletter,
    creatorRole,
    setCreatorRole,
    activeTheme,
    setActiveTheme,
    passwordNotification,
    setPasswordNotification,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    passwordsMatch,
    passwordStrength,
    strengthPercent,
    strengthColor: () => {
      if (!password) return "bg-neutral-700";
      if (passwordStrength === 1) return "bg-rose-500";
      if (passwordStrength === 2) return "bg-amber-500";
      if (passwordStrength === 3) return "bg-blue-500";
      if (passwordStrength >= 4) return "bg-emerald-500";
      return "bg-neutral-700";
    },
    strengthText: () => {
      if (!password) return "None";
      if (passwordStrength === 1) return "Weak";
      if (passwordStrength === 2) return "Fair";
      if (passwordStrength === 3) return "Good";
      if (passwordStrength >= 4) return "Strong";
      return "None";
    },
    isEmailValid,
    isFormValid,
    handleGeneratePassword,
    handleSubmit,
    handleSocialRegister,
    currentTheme: THEMES[activeTheme],
    showWelcomeUser,
    setShowWelcomeUser,
    confirmWelcomeUser,
    onNavigateToLogin: props.onNavigateToLogin,
    onNavigateHome: props.onNavigateHome,
  };
}
