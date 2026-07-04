import React from "react";
import { THEMES, ThemeKey } from "../constants";

export interface RegisterFormProps {
  onRegister: (data: any) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function useRegisterForm(props: RegisterFormProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = React.useState(true);
  const [creatorRole, setCreatorRole] = React.useState("creator");
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [passwordNotification, setPasswordNotification] = React.useState<
    string | null
  >(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (password.length > 0) score += 1;
    if (hasMinLength) score += 1;
    if (hasUppercase && hasNumber) score += 1;
    return score;
  }, [password, hasMinLength, hasUppercase, hasNumber]);

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isFormValid = React.useMemo(() => {
    return (
      fullName.trim().length > 0 && isEmailValid && hasMinLength && acceptTerms
    );
  }, [fullName, isEmailValid, hasMinLength, acceptTerms]);

  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=";

    let generated = "";
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 9; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    generated = generated
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setPassword(generated);
    setShowPassword(true);
    setPasswordNotification("Secure password auto-filled & shown below!");
    setTimeout(() => setPasswordNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await props.onRegister({
        email,
        password,
        full_name: fullName,
        creator_role: creatorRole,
        subscribe_newsletter: subscribeNewsletter,
      });
      (window as any).navigateTo?.("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    console.log(`[OAuth] Register with ${provider}`);
    setError(
      `OAuth register via ${provider} is not configured for this environment.`
    );
  };

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    acceptTerms,
    setAcceptTerms,
    subscribeNewsletter,
    setSubscribeNewsletter,
    creatorRole,
    setCreatorRole,
    activeTheme,
    setActiveTheme,
    passwordNotification,
    hasMinLength,
    hasUppercase,
    hasNumber,
    passwordStrength,
    strengthColor: () => {
      if (passwordStrength === 1) return "bg-rose-500";
      if (passwordStrength === 2) return "bg-amber-500";
      if (passwordStrength === 3) return "bg-emerald-500";
      return "bg-white/10";
    },
    strengthText: () => {
      if (passwordStrength === 1) return "Weak";
      if (passwordStrength === 2) return "Medium";
      if (passwordStrength === 3) return "Strong";
      return "None";
    },
    isEmailValid,
    isFormValid,
    handleGeneratePassword,
    handleSubmit,
    handleSocialRegister,
    currentTheme: THEMES[activeTheme],
    onNavigateToLogin: props.onNavigateToLogin,
    onNavigateHome: props.onNavigateHome,
  };
}
