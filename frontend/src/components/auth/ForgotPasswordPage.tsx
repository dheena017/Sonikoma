import React from "react";
import { 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  Send, 
  Loader2, 
  CheckCircle2,
  Lock,
  RefreshCw,
  HelpCircle,
  Phone,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import AuthShowcase, { THEMES, ThemeKey } from "./AuthShowcase.js";

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordPage({
  onForgotPassword,
  onNavigateToLogin,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("+1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Recovery configuration states
  const [resetMethod, setResetMethod] = React.useState<"email" | "phone" | "question">("email");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [isCodeSent, setIsCodeSent] = React.useState(false);

  // Security questions answers state
  const [securityAnswers, setSecurityAnswers] = React.useState({
    comicTitle: "",
    studioCity: ""
  });

  // Password reset fields
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isResetReady, setIsResetReady] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Premium interactive states
  const [sliderVal, setSliderVal] = React.useState(0);
  const [isVerified, setIsVerified] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(60);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");

  // Ticking resend countdown timer
  React.useEffect(() => {
    if ((!isSent && !isCodeSent) || resendTimer <= 0) return;
    const interval = setTimeout(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(interval);
  }, [isSent, isCodeSent, resendTimer]);

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isPhoneValid = React.useMemo(() => {
    return /^\d{7,15}$/.test(phoneNumber.replace(/[-()\s]/g, ""));
  }, [phoneNumber]);

  const isQuestionValid = React.useMemo(() => {
    return securityAnswers.comicTitle.trim().length > 0 && securityAnswers.studioCity.trim().length > 0;
  }, [securityAnswers]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
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
        await onForgotPassword(email);
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
      // Phone workflow
      if (!isPhoneValid || !isVerified || isLoading) return;
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        setIsCodeSent(true);
        setResendTimer(60);
        setIsLoading(false);
      }, 1500);
    } else {
      // Security Questions workflow
      if (!isQuestionValid || !isVerified || isLoading) return;
      setIsLoading(true);
      setError(null);
      setTimeout(() => {
        const cleanTitle = securityAnswers.comicTitle.toLowerCase().replace(/\s/g, "");
        const cleanCity = securityAnswers.studioCity.toLowerCase().replace(/\s/g, "");
        
        if (cleanTitle === "webtoon" && cleanCity === "newyork") {
          setIsResetReady(true);
          setError(null);
        } else {
          setError("Incorrect answer combination. Try hints: 'webtoon' and 'newyork'.");
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
    if (newPassword.length < 6 || newPassword !== confirmPassword || isLoading) return;
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
        await onForgotPassword(email);
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

  const currentTheme = THEMES[activeTheme];

  return (
    <div className="min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden">
      
      {/* LEFT PANEL: Auth Product Slideshow (extracted child component) */}
      <AuthShowcase activeTheme={activeTheme} iconType="forgot" />

      {/* RIGHT PANEL: Reset Form Interface */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 lg:p-16 bg-[#040406] relative overflow-y-auto text-left">
        
        {/* Soft background glow (Theme-driven) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full ${currentTheme.glowPrimary} blur-[120px] pointer-events-none transition-all duration-1000`} />

        {/* Top Controls Toolbar */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex lg:hidden items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${currentTheme.accentBg} border ${currentTheme.accentBorder}`}>
              <KeyRound className={`w-4 h-4 ${currentTheme.accentText}`} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Anivox</span>
          </div>

          <div className="hidden lg:block" /> {/* Spacer */}

          <div className="flex items-center gap-4">
            
            {/* Color Palette Theme Switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 p-1 rounded-full backdrop-blur-md">
              {(Object.keys(THEMES) as ThemeKey[]).map((theme) => {
                const colors = {
                  purple: "bg-purple-500",
                  blue: "bg-blue-500",
                  emerald: "bg-emerald-500",
                  amber: "bg-amber-500"
                };
                
                return (
                  <button
                    key={theme}
                    onClick={() => setActiveTheme(theme)}
                    className={`w-4 h-4 rounded-full transition-transform active:scale-90 cursor-pointer ${colors[theme]} ${
                      activeTheme === theme ? "scale-110 ring-2 ring-white/40" : "scale-90 opacity-60 hover:opacity-100"
                    }`}
                    title={`Switch to ${theme} theme`}
                  />
                );
              })}
            </div>

            <button 
              onClick={() => onNavigateToLogin()}
              className={`flex items-center gap-1 text-xs ${currentTheme.accentText} ${currentTheme.accentBg} border ${currentTheme.accentBorder} px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/5 transition-all`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Sign In
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-6">
          
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {isCompleted 
                ? "Reset Successful" 
                : isResetReady 
                ? "Create New Password" 
                : isSent 
                ? "Check Inbox" 
                : isCodeSent 
                ? "Enter Verification" 
                : "Reset Password"}
            </h2>
            <p className="text-neutral-400 text-sm font-medium leading-relaxed">
              {isCompleted
                ? "Your credentials have been successfully updated! You can now log into your Anivox account."
                : isResetReady
                ? "Input your new secure password profile below. Ensure matching values."
                : isSent
                ? `An email was dispatched containing details to restore your workspace access.`
                : isCodeSent
                ? `Enter the 6-digit confirmation code texted to ${countryCode} ${phoneNumber}.`
                : "Select recovery channel and provide necessary details to gain access."}
            </p>
          </div>

          {/* Recovery Method Tabs (Only visible when starting recovery) */}
          {!isSent && !isCodeSent && !isResetReady && !isCompleted && (
            <div className="grid grid-cols-3 gap-2 bg-neutral-900/60 p-1 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setResetMethod("email")}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                  resetMethod === "email"
                    ? `${currentTheme.dot} text-white shadow-md`
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-neutral-350" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setResetMethod("phone")}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                  resetMethod === "phone"
                    ? `${currentTheme.dot} text-white shadow-md`
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-neutral-350" />
                SMS OTP
              </button>
              <button
                type="button"
                onClick={() => setResetMethod("question")}
                className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                  resetMethod === "question"
                    ? `${currentTheme.dot} text-white shadow-md`
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-neutral-350" />
                Challenge
              </button>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            
            {isCompleted ? (
              // STEP 5: Success Flow Completed
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs leading-relaxed font-medium text-center flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                  <div>
                    <strong className="block text-sm text-white">Password Updated Successfully</strong>
                    Your credentials have been securely refreshed. Session caches are clear.
                  </div>
                </div>

                <button
                  onClick={onNavigateToLogin}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer duration-300 active:scale-[0.99]`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Sign In to Studio Dashboard
                </button>
              </div>
            ) : isResetReady ? (
              // STEP 3: Input New Password Form
              <form className="space-y-5" onSubmit={handleNewPasswordSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                    {error}
                  </div>
                )}

                {/* New password input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all ${currentTheme.focus}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all ${currentTheme.focus}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {newPassword && confirmPassword && (
                    <div className="text-[9px] font-bold ml-1">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-400">Passwords match perfectly</span>
                      ) : (
                        <span className="text-amber-500">Passwords do not match</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={newPassword.length < 6 || newPassword !== confirmPassword || isLoading}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer duration-300 active:scale-[0.99] disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Update Secure Password
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : isSent ? (
              // STEP 4: Check Email Inbox
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#0f0f13] border border-white/5 text-neutral-400 text-xs leading-relaxed font-semibold">
                  <div className="flex items-center gap-2 text-white font-bold mb-2">
                    <Mail className={`w-4 h-4 ${currentTheme.accentText}`} />
                    Reset Instructions Dispatched
                  </div>
                  Instructions to reset credentials have been sent to <strong>{email}</strong>. Check spam or filter folders if the message fails to load.
                </div>

                {/* Simulated direct link click to allow seamless sandbox testing */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center flex flex-col gap-2">
                  <div className="text-[10px] text-purple-400 font-bold flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Simulate Email Code Link
                  </div>
                  <button
                    onClick={handleSimulateEmailArrival}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-[10px] cursor-pointer"
                  >
                    Auto-simulate Click on Recovery Link
                  </button>
                </div>

                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className="w-full bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-white/10 cursor-pointer disabled:cursor-not-allowed duration-300"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Verification Email"}
                </button>

                <button
                  onClick={onNavigateToLogin}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer duration-300 active:scale-[0.99]`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            ) : isCodeSent ? (
              // STEP 2: Phone Verification Code Input Screen
              <form className="space-y-5" onSubmit={handleVerifyCodeSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-4 text-center tracking-[0.4em] text-lg font-mono font-bold text-white placeholder:text-neutral-800 focus:outline-none focus:ring-2 transition-all ${currentTheme.focus}`}
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verificationCode.length < 6 || isLoading}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer duration-300 active:scale-[0.99] disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Subtext tips */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Demo Code: 123456</span>
                  <button
                    type="button"
                    onClick={handleCodeAutoFill}
                    className={`font-bold hover:underline cursor-pointer ${currentTheme.accentText}`}
                  >
                    Quick Auto-fill Test Code
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCodeSent(false)}
                  className="w-full bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Phone Number
                </button>
              </form>
            ) : (
              // STEP 1: Input Account Recovery Details (Email, Phone, or Security Questions)
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                    {error}
                  </div>
                )}

                {resetMethod === "email" && (
                  /* EMAIL INPUT */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                        Email Address
                      </label>
                      {email && (
                        <span className={`text-[9px] font-bold ${isEmailValid ? "text-emerald-400" : "text-amber-500"}`}>
                          {isEmailValid ? "Valid Format" : "Invalid Email"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        isEmailValid ? "text-emerald-400" : "text-neutral-500"
                      }`} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                          isEmailValid ? "border-emerald-500/20 focus:ring-emerald-500/25 focus:border-emerald-500/40" : `border-white/5 ${currentTheme.focus}`
                        }`}
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                )}

                {resetMethod === "phone" && (
                  /* PHONE NUMBER INPUT */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                        Phone Number
                      </label>
                      {phoneNumber && (
                        <span className={`text-[9px] font-bold ${isPhoneValid ? "text-emerald-400" : "text-amber-500"}`}>
                          {isPhoneValid ? "Valid Format" : "Digits only (7-15)"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-[#0b0b0e] border border-white/5 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 font-medium"
                      >
                        <option value="+1">+1 (US)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+82">+82 (KR)</option>
                      </select>
                      <div className="relative flex-grow">
                        <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          isPhoneValid ? "text-emerald-400" : "text-neutral-500"
                        }`} />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\-()\s]/g, ""))}
                          className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                            isPhoneValid ? "border-emerald-500/20 focus:ring-emerald-500/25 focus:border-emerald-500/40" : `border-white/5 ${currentTheme.focus}`
                          }`}
                          placeholder="(555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {resetMethod === "question" && (
                  /* SECURITY QUESTIONS CHALLENGE */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                        Question 1: Title of your first Webtoon?
                      </label>
                      <input
                        type="text"
                        required
                        value={securityAnswers.comicTitle}
                        onChange={(e) => setSecurityAnswers(prev => ({ ...prev, comicTitle: e.target.value }))}
                        className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all ${currentTheme.focus}`}
                        placeholder="Try default answer: webtoon"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                        Question 2: City where you launched your studio?
                      </label>
                      <input
                        type="text"
                        required
                        value={securityAnswers.studioCity}
                        onChange={(e) => setSecurityAnswers(prev => ({ ...prev, studioCity: e.target.value }))}
                        className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all ${currentTheme.focus}`}
                        placeholder="Try default answer: newyork"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Slide-to-Verify Security Widget */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                    Security Verification
                  </label>
                  
                  <div className={`relative w-full h-12 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 border ${
                    isVerified 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-black/40 border-white/5 text-neutral-500"
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider select-none z-10 pointer-events-none">
                      {isVerified ? "Verification Passed!" : "Slide right to verify"}
                    </span>

                    {!isVerified && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-purple-500/10 transition-all pointer-events-none" 
                        style={{ width: `${sliderVal}%` }}
                      />
                    )}

                    <div 
                      className={`absolute left-1 top-1 bottom-1 w-10 rounded-lg flex items-center justify-center transition-all ${
                        isVerified 
                          ? "bg-emerald-500 text-white left-[calc(100%-44px)]" 
                          : "bg-purple-600 text-white"
                      }`}
                      style={!isVerified ? { left: `calc(${sliderVal}% * 0.88 + 4px)` } : undefined}
                    >
                      {isVerified ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    {!isVerified && (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderVal}
                        onChange={handleSliderChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                      />
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={
                    (resetMethod === "email" ? !isEmailValid : resetMethod === "phone" ? !isPhoneValid : !isQuestionValid) || 
                    !isVerified || 
                    isLoading
                  }
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer duration-300 active:scale-[0.99] mt-3 disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {resetMethod === "email" ? "Send Reset Link" : resetMethod === "phone" ? "Send Verification SMS" : "Verify Challenge Answers"}
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full bg-transparent hover:bg-white/5 text-neutral-500 hover:text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Sign In
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Security Warning banner */}
        <div className="relative z-10 w-full max-w-md mx-auto mt-4 p-4 bg-neutral-900/20 border border-white/5 rounded-2xl flex gap-3 text-[10px] text-neutral-500 leading-relaxed font-semibold">
          <ShieldAlert className="w-6 h-6 text-amber-500/60 shrink-0" />
          <span>
            <strong>Security Alert:</strong> Anivox will never request your dashboard password or credentials via email, SMS, or support chat channels. Keep your recovery methods private.
          </span>
        </div>

        {/* Footer for mobile only */}
        <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
          © {new Date().getFullYear()} Anivox AI Corp. All rights reserved.
        </div>
      </div>

    </div>
  );
}
