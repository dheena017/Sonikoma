import React from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Palette,
  Video,
  Mic,
  Flame,
  KeyRound,
  Gift,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { useRegisterForm } from "@/features/auth/hooks";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { SonikomaLogo } from "@/shared/ui/branding";
import { WelcomeUserModal } from "@/shared/ui/modal";

interface RegisterFormProps {
  onRegister: (data: any) => Promise<any>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

const CREATOR_ROLES = [
  {
    id: "manga_artist",
    label: "Manga & Webtoon",
    subtitle: "AI panel slicing & art",
    icon: Palette,
  },
  {
    id: "animator",
    label: "Motion Animator",
    subtitle: "Camera pan & keyframes",
    icon: Video,
  },
  {
    id: "voice_actor",
    label: "Voice & Audio",
    subtitle: "Neural anime dubbing",
    icon: Mic,
  },
  {
    id: "content_creator",
    label: "Video Studio",
    subtitle: "TikTok, Shorts & Reels",
    icon: Flame,
  },
];

const PERKS = [
  { icon: Gift, label: "3 Free Exports / mo" },
  { icon: Sparkles, label: "Smart Panel Slicer" },
  { icon: ShieldCheck, label: "No Credit Card Needed" },
];

export default function RegisterForm({
  onRegister,
  onNavigateToLogin,
  onNavigateHome,
}: RegisterFormProps) {
  const {
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
    passwordNotification,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    passwordsMatch,
    passwordStrength,
    strengthPercent,
    strengthColor,
    strengthText,
    isEmailValid,
    isFormValid,
    handleGeneratePassword,
    handleSubmit,
    handleSocialRegister,
    showWelcomeUser,
    setShowWelcomeUser,
    confirmWelcomeUser,
  } = useRegisterForm({
    onRegister,
    onNavigateToLogin,
    onNavigateHome,
  });

  return (
    <AuthPageShell
      activeTheme={activeTheme}
      iconType="register"
      rightHeader={
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2 lg:gap-3">
            {onNavigateHome && (
              <Tooltip text="Return to Landing Page" placement="bottom">
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Home</span>
                </button>
              </Tooltip>
            )}

            <div className="flex lg:hidden items-center">
              <SonikomaLogo size="sm" />
            </div>
          </div>

          <Tooltip text="Already have an account?" placement="bottom">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs text-neutral-400 hover:text-white font-medium transition-colors cursor-pointer"
            >
              Sign In <span className="text-blue-400 font-bold ml-0.5">→</span>
            </button>
          </Tooltip>
        </div>
      }
      rightBody={
        <>
          {/* Header Title & Intro */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Get Started Free</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium leading-relaxed">
              Start transforming manga & comic panels into voiced anime videos.
            </p>
          </div>

          {/* Value Perks Highlight Row */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#14151a] border border-[#262830]">
            {PERKS.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1 px-2 rounded-xl text-center sm:text-left bg-black/20"
                >
                  <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-neutral-300 whitespace-nowrap">
                    {perk.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Social One-Click Sign Up Buttons */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Google */}
              <Tooltip text="Fast 1-click registration with Google OAuth" placement="top">
                <button
                  type="button"
                  disabled={isSocialLoading || isLoading}
                  onClick={() => handleSocialRegister("Google")}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#1A1D24] hover:bg-[#232730] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  {socialProviderLoading === "Google" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>Google</span>
                    </>
                  )}
                </button>
              </Tooltip>

              {/* GitHub */}
              <Tooltip text="Fast 1-click registration with GitHub OAuth" placement="top">
                <button
                  type="button"
                  disabled={isSocialLoading || isLoading}
                  onClick={() => handleSocialRegister("GitHub")}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-[#1A1D24] hover:bg-[#232730] border border-[#2F2F2F] hover:border-neutral-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  {socialProviderLoading === "GitHub" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </>
                  )}
                </button>
              </Tooltip>
            </div>

            {/* Separator */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#2F2F2F]" />
              <span className="flex-shrink mx-4 text-neutral-400 text-xs font-semibold uppercase tracking-wider bg-[#141414] px-3 py-0.5 rounded-full border border-[#2F2F2F]">
                Or register with email
              </span>
              <div className="flex-grow border-t border-[#2F2F2F]" />
            </div>
          </div>

          {/* Main Card Container */}
          <div className="rounded-[30px] border border-[#2F2F2F]/90 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,#1a1a1d_0%,#141517_48%,#0d0e11_100%)] p-4 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/5 space-y-4">
            <form noValidate className="space-y-4" onSubmit={handleSubmit}>
              {/* Dismissible Error Alert */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-start justify-between gap-2.5 shadow-lg shadow-rose-950/20 animate-in fade-in">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Password Generated Notification */}
              {passwordNotification && (
                <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{passwordNotification}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 ml-0.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full bg-[#121417] border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
                      fieldErrors.fullName
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    }`}
                    placeholder="Enter your creator name or studio"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 ml-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Email Address
                  </label>
                  {email && !fieldErrors.email && (
                    <span
                      className={`text-[10px] font-bold ${
                        isEmailValid ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isEmailValid ? "Valid format" : "Check email format"}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-[#121417] border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
                      fieldErrors.email
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 ml-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Creator Focus / Role Selection */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    What is your creative focus?
                  </label>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Personalizes your studio
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CREATOR_ROLES.map((role) => {
                    const RoleIcon = role.icon;
                    const isSelected = creatorRole === role.id;
                    return (
                      <button
                        type="button"
                        key={role.id}
                        onClick={() => setCreatorRole(role.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/30 text-white shadow-sm"
                            : "bg-[#121417] border-[#2A2D35] hover:border-neutral-500 text-neutral-300 hover:text-white"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight flex items-center gap-1">
                            <span>{role.label}</span>
                            {isSelected && (
                              <Check className="w-3 h-3 text-blue-400 shrink-0 stroke-[3px]" />
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-normal truncate mt-0.5">
                            {role.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Password
                  </label>
                  <Tooltip text="Auto-fill high-security random password" placement="top">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Generate Strong</span>
                    </button>
                  </Tooltip>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    className={`w-full bg-[#121417] border rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
                      fieldErrors.password
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    }`}
                    placeholder="Create a strong password"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
                    <Tooltip
                      text={showPassword ? "Hide password" : "Show password"}
                      placement="top"
                    >
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center rounded-lg hover:bg-neutral-800"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Caps Lock Alert */}
                {isCapsLockOn && (
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold pt-1 ml-0.5 animate-in fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Warning: Caps Lock is ON</span>
                  </div>
                )}

                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 ml-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] ml-0.5">
                      <span className="text-neutral-400 font-medium">Strength</span>
                      <span className="font-bold text-neutral-200">
                        {strengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${strengthColor()}`}
                        style={{ width: strengthPercent }}
                      />
                    </div>

                    {/* Criteria Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                      <div
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          hasMinLength
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800/60 text-neutral-400 border border-neutral-700/40"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 stroke-[3px] ${
                            hasMinLength ? "opacity-100" : "opacity-30"
                          }`}
                        />
                        <span>8+ chars</span>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          hasUppercase && hasLowercase
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800/60 text-neutral-400 border border-neutral-700/40"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 stroke-[3px] ${
                            hasUppercase && hasLowercase ? "opacity-100" : "opacity-30"
                          }`}
                        />
                        <span>A-Z & a-z</span>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          hasNumber
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800/60 text-neutral-400 border border-neutral-700/40"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 stroke-[3px] ${
                            hasNumber ? "opacity-100" : "opacity-30"
                          }`}
                        />
                        <span>Number (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          hasSpecial
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-neutral-800/60 text-neutral-400 border border-neutral-700/40"
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 stroke-[3px] ${
                            hasSpecial ? "opacity-100" : "opacity-30"
                          }`}
                        />
                        <span>Symbol (!@#)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Confirm Password
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 ${
                        passwordsMatch ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    className={`w-full bg-[#121417] border rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
                      fieldErrors.confirmPassword
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    }`}
                    placeholder="Re-enter your password"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
                    <Tooltip
                      text={showConfirmPassword ? "Hide password" : "Show password"}
                      placement="top"
                    >
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center rounded-lg hover:bg-neutral-800"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </Tooltip>
                  </div>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 ml-0.5 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Checkboxes: Terms & Newsletter */}
              <div className="space-y-3 pt-2">
                {/* Terms Checkbox */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                          acceptTerms
                            ? "bg-blue-600 border-blue-600"
                            : fieldErrors.acceptTerms
                            ? "bg-[#181818] border-rose-500 ring-1 ring-rose-500/30"
                            : "bg-[#181818] border-[#2F2F2F] group-hover:border-neutral-500"
                        }`}
                      >
                        {acceptTerms && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-300 group-hover:text-white transition-colors leading-relaxed">
                      I agree to the{" "}
                      <span className="text-blue-400 hover:underline">Terms of Service</span> and{" "}
                      <span className="text-blue-400 hover:underline">Privacy Policy</span>
                    </span>
                  </label>
                  {fieldErrors.acceptTerms && (
                    <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 ml-6 mt-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.acceptTerms}</span>
                    </p>
                  )}
                </div>

                {/* Newsletter Checkbox */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${
                          subscribeNewsletter
                            ? "bg-blue-600 border-blue-600"
                            : "bg-[#181818] border-[#2F2F2F] group-hover:border-neutral-500"
                        }`}
                      >
                        {subscribeNewsletter && (
                          <Check className="w-3 h-3 text-white stroke-[3px]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed">
                      Send me weekly comic templates, animation presets, and product feature updates
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Tooltip text="Complete registration and start creating" placement="bottom">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-[0_12px_28px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_36px_rgba(59,130,246,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Your Studio Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </Tooltip>
            </form>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-neutral-400 font-medium">
            Already have an account?{" "}
            <Tooltip text="Sign in to your existing account" placement="bottom">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 decoration-blue-500/50 hover:decoration-blue-400 transition-colors cursor-pointer ml-1"
              >
                Sign In
              </button>
            </Tooltip>
          </p>
        </>
      }
    />
  );
}
