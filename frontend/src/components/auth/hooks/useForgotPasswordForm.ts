import React from "react";
import { THEMES, ThemeKey } from "../constants";

export interface ForgotPasswordFormProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function useForgotPasswordForm(props: ForgotPasswordFormProps) {
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resetMethod, setResetMethod] = React.useState<
    "email" | "phone" | "question"
  >("email");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isCodeSent, setIsCodeSent] = React.useState(false);
  const [securityAnswers, setSecurityAnswers] = React.useState({
    comicTitle: "",
    studioCity: "",
  });
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isResetReady, setIsResetReady] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [sliderVal, setSliderVal] = React.useState(0);
  const [isVerified, setIsVerified] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(60);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");

  React.useEffect(() => {
    if ((!isSent && !isCodeSent) || resendTimer <= 0) return;
    const timer = setTimeout(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isSent, isCodeSent, resendTimer]);

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isPhoneValid = React.useMemo(() => {
    return /^\d{7,15}$/.test(phoneNumber.replace(/[-()\s]/g, ""));
  }, [phoneNumber]);

  const isQuestionValid = React.useMemo(() => {
    return (
      securityAnswers.comicTitle.trim().length > 0 &&
      securityAnswers.studioCity.trim().length > 0
    );
  }, [securityAnswers]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 94) {
      setSliderVal(100);
      setIsVerified(true);
    } else if (!isVerified) {
      setSliderVal(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetMethod === "email") {
      if (!isEmailValid || !isVerified || isLoading) return;
      setIsLoading(true);
      setError(null);
      try {
        await props.onForgotPassword(email);
        setIsSent(true);
        setResendTimer(60);
      } catch (err: any) {
        setError(err.message || "Failed to send reset link. Please try again.");
        setSliderVal(0);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    } else if (resetMethod === "phone") {
      if (!isPhoneValid || !isVerified || isLoading) return;
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        setIsCodeSent(true);
        setResendTimer(60);
        setIsLoading(false);
      }, 1500);
    } else {
      if (!isQuestionValid || !isVerified || isLoading) return;
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        const cleanTitle = securityAnswers.comicTitle
          .toLowerCase()
          .replace(/\s/g, "");
        const cleanCity = securityAnswers.studioCity
          .toLowerCase()
          .replace(/\s/g, "");

        if (cleanTitle === "webtoon" && cleanCity === "newyork") {
          setIsResetReady(true);
          setError(null);
        } else {
          setError(
            "Incorrect answer combination. Try hints: 'webtoon' and 'newyork'."
          );
          setSliderVal(0);
          setIsVerified(false);
        }
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length < 6 || isLoading) return;
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      if (verificationCode === "123456") {
        setIsResetReady(true);
        setIsCodeSent(false);
        setError(null);
      } else {
        setError("Invalid security verification code. Please enter 123456.");
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6 || newPassword !== confirmPassword || isLoading)
      return;
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsCompleted(true);
      setIsResetReady(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    if (resetMethod === "email") {
      try {
        await props.onForgotPassword(email);
        setResendTimer(60);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to resend reset link.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setResendTimer(60);
        setError(null);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleCodeAutoFill = () => {
    setVerificationCode("123456");
  };

  const handleSimulateEmailArrival = () => {
    setIsSent(false);
    setIsResetReady(true);
  };

  return {
    email,
    setEmail,
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    isLoading,
    isSent,
    error,
    resetMethod,
    setResetMethod,
    verificationCode,
    setVerificationCode,
    isCodeSent,
    setIsCodeSent,
    securityAnswers,
    setSecurityAnswers,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isResetReady,
    isCompleted,
    showPassword,
    setShowPassword,
    sliderVal,
    isVerified,
    resendTimer,
    activeTheme,
    setActiveTheme,
    isEmailValid,
    isPhoneValid,
    isQuestionValid,
    handleSliderChange,
    handleSubmit,
    handleVerifyCodeSubmit,
    handleNewPasswordSubmit,
    handleResend,
    handleCodeAutoFill,
    handleSimulateEmailArrival,
    currentTheme: THEMES[activeTheme],
    onNavigateToLogin: props.onNavigateToLogin,
    onNavigateHome: props.onNavigateHome,
  };
}
