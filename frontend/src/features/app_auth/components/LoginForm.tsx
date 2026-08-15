import React from "react";
import {
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Chrome,
  Github,
  Languages,
  HelpCircle,
  X,
  Film,
  Info,
  Sparkles,
  Volume2,

} from "lucide-react";
import AuthShowcase from "@/features/app_auth/components/AuthShowcase";
import { LandingAnimeScene } from "@/features/app_landing/components/LandingAnimeScene";
import {
  THEMES,
  ThemeKey,
  TOUR_STEPS,
  TRANSLATIONS,
  Language,
} from "@/features/app_auth/components/constants";
import { useLoginForm } from "@/features/app_auth/hooks";

interface LoginPageProps {
  onLogin: (data: any) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export default function LoginPage({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateHome,
}: LoginPageProps) {
  const {
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
    currentTheme,
    t,
    onNavigateToRegister: navigateToRegister,
    onNavigateToForgotPassword: navigateToForgotPassword,
    onNavigateHome: navigateHome,
  } = useLoginForm({
    onLogin,
    onNavigateToRegister,
    onNavigateToForgotPassword,
    onNavigateHome,
  });

  // Helper references for icons dynamically instantiated in Tour
  const getTourIconComponent = (idx: number) => {
    switch (idx) {
      case 0:
        return Film;
      case 1:
        return Sparkles;
      case 2:
        return Languages;
      default:
        return Volume2;
    }
  };

  return (
    <div className="auth-anime-shell min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden relative">
      <LandingAnimeScene variant="app" />

      {/* LEFT PANEL: Auth Product Slideshow (extracted child component) */}
      <AuthShowcase activeTheme={activeTheme} iconType="login" />

      {/* RIGHT PANEL: Login Form Interface */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col bg-[#040406] relative">
        {/* Soft background anime aura glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full ${currentTheme.glowPrimary} anime-aura-bg pointer-events-none transition-all duration-1000`}
        />

        {/* Top Controls Toolbar — pinned, never scrolls */}
        <div className="relative z-10 flex items-center justify-between px-8 lg:px-16 py-5 flex-shrink-0">
          {/* Header branding & Back Button */}
          <div className="flex items-center gap-2 lg:gap-3">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-white/10 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>
            )}

            <div className="flex lg:hidden items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-lg ${currentTheme.accentBg} border ${currentTheme.accentBorder} overflow-hidden`}
              >
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                  }}
                  alt="Sonikoma Logo"
                  className="w-6 h-6 object-contain drop-shadow-md"
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight mr-0.5">
                Sonikoma
              </span>
            </div>
          </div>
          {/* Theme Selector & Tour Button */}
          <div className="flex items-center gap-2 lg:gap-4">
          </div>
        </div>

        {/* Scrollable form body — starts below toolbar */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-8 lg:px-16 pb-8 lg:pb-16">

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-6 text-left">
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {t.welcome}
            </h2>
            <p className="text-neutral-400 text-sm">{t.subtitle}</p>
          </div>

          {/* Primary Google Sign-In Button */}
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] border border-purple-400/30 group anime-button-sheen"
            >
              <Chrome className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              <span>Continue with Google Account</span>
              <ArrowRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <p className="text-[11px] text-center text-neutral-400 font-sans">
              🔒 Standard Sonikoma authentication requires your Google Account
            </p>
          </div>

          {/* Separator Line */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink mx-4 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
              {t.or}
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          {/* Login Card */}
          <div className="bg-neutral-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500 anime-card-glow">
            <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${currentTheme.cardBorder}`} />

            {
              // DEFAULT EMAIL/PASSWORD INPUT FORM
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                    {error}
                  </div>
                )}

                {/* Email address input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                      {t.email}
                    </label>
                    {email && (
                      <span
                        className={`text-[9px] font-bold ${
                          isEmailValid ? "text-emerald-400" : "text-amber-500"
                        }`}
                      >
                        {isEmailValid ? "Valid Format" : "Invalid Email"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        isEmailValid ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                        isEmailValid
                          ? "border-emerald-500/20 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                          : `border-white/5 ${currentTheme.focus}`
                      }`}
                      placeholder={t.emailPlaceholder}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className={`text-[10px] ${currentTheme.accentText} hover:opacity-85 transition-opacity font-bold tracking-tight`}
                    >
                      {t.forgot}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4">
                      <Lock
                        className={`w-4 h-4 transition-colors ${
                          isPasswordValid
                            ? "text-emerald-400"
                            : "text-neutral-500"
                        }`}
                      />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={checkCapsLock}
                      onKeyUp={checkCapsLock}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                        isPasswordValid
                          ? "border-emerald-500/20 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                          : `border-white/5 ${currentTheme.focus}`
                      }`}
                      placeholder={t.passwordPlaceholder}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Caps Lock warning indicator */}
                  {isCapsLockOn && (
                    <div className="text-[9px] font-bold text-amber-500 ml-1 mt-1 flex items-center gap-1.5 animate-pulse">
                      <Info className="w-3.5 h-3.5" />
                      <span>{t.capsLock}</span>
                    </div>
                  )}
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center ml-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center ${
                          rememberMe
                            ? `${currentTheme.dot.replace(
                                "bg-",
                                "bg-"
                              )} border-transparent shadow-md`
                            : "bg-black/40 border-white/10 group-hover:border-white/20"
                        }`}
                      >
                        {rememberMe && (
                          <Check className="w-3 h-3 text-white stroke-[4px]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors font-medium">
                      {t.remember}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer duration-300 active:scale-[0.99] mt-2 anime-button-sheen`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t.signIn}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            }
          </div>

          {/* Create Account Link */}
          <p className="text-center text-sm text-neutral-500 font-medium">
            {t.createAcc}{" "}
            <button
              onClick={onNavigateToRegister}
              className={`hover:opacity-85 font-extrabold transition-colors cursor-pointer ${currentTheme.accentText}`}
            >
              {t.createBtn}
            </button>
          </p>
        </div>

        {/* Footer for mobile only */}
        <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
          © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
        </div>
      </div>

      {/* PORTAL OVERLAY: Step-by-Step Interactive Features Tour Modal */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#101018] to-[#070709] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 animate-in zoom-in-95 duration-300 text-left">
            {/* Corner Close Button */}
            <button
              onClick={() => setIsTourOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Visual Representation of Step */}
            <div className="w-full md:w-2/5 flex flex-col items-center justify-center p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/10 mb-6 animate-pulse">
                {React.createElement(getTourIconComponent(tourStep), {
                  className: "w-8 h-8 text-white",
                })}
              </div>
              <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                Pipeline Step {tourStep + 1}
              </span>
            </div>

            {/* Right Column: Step Description and Navigation */}
            <div className="w-full md:w-3/5 flex flex-col justify-between py-2 text-left">
              <div className="space-y-4">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Sonikoma Studio Tour
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                  {TOUR_STEPS[tourStep].title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {TOUR_STEPS[tourStep].description}
                </p>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTourStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === tourStep
                          ? "w-6 bg-purple-500"
                          : "w-1.5 bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <button
                      onClick={() => setTourStep((prev) => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button
                      onClick={() => setTourStep((prev) => prev + 1)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer transition-colors active:scale-95"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTourOpen(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold cursor-pointer transition-colors active:scale-95"
                    >
                      Finish Tour
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>{/* end scrollable body */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan-beam {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-beam {
          animation: scan-beam 2.8s infinite linear;
        }
      `,
        }}
      />
    </div>
  );
}
