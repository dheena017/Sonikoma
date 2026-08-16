import React from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Chrome,
  Github,
  Key,
  Compass,
  Bell,
  Sparkles,
} from "lucide-react";
import AuthPageShell from "@/features/app_auth/components/AuthPageShell";
import ThemeSwitcher from "@/features/app_auth/components/ThemeSwitcher";
import { useRegisterForm } from "@/features/app_auth/hooks";

interface RegisterFormProps {
  onRegister: (data: any) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

const CREATOR_ROLES = [
  { id: "artist", label: "Artist", desc: "I draw comics" },
  { id: "creator", label: "Video Creator", desc: "I make recaps" },
  { id: "producer", label: "Producer", desc: "Studio workflow" },
  { id: "fan", label: "Enthusiast", desc: "I love webtoons" },
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
    strengthColor,
    strengthText,
    isEmailValid,
    isFormValid,
    handleGeneratePassword,
    handleSubmit,
    handleSocialRegister,
    currentTheme,
    onNavigateToLogin: navigateToLogin,
    onNavigateHome: navigateHome,
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
        <div className="flex items-center justify-between mb-8 relative z-10">
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
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 overflow-hidden">
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

          <ThemeSwitcher activeTheme={activeTheme} onChange={setActiveTheme} />
        </div>
      }
      rightBody={
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 p-2 shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center backdrop-blur-md">
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                  }}
                  alt="Sonikoma"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Join Sonikoma Studio</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-300 text-sm font-medium leading-relaxed">
              Start parsing webtoons and compiling animations today.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialRegister("Google")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#141624] hover:bg-[#1a1e32] border border-white/10 hover:border-purple-500/40 text-white font-bold text-xs transition-all duration-300 cursor-pointer shadow-md active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialRegister("GitHub")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#141624] hover:bg-[#1a1e32] border border-white/10 hover:border-purple-500/40 text-white font-bold text-xs transition-all duration-300 cursor-pointer shadow-md active:scale-[0.98]"
            >
              <Github className="w-4 h-4 text-white" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-4 text-neutral-400 text-[10px] font-bold uppercase tracking-widest bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
              Or Sign Up With Email
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <div className="bg-[#0b0c18]/90 backdrop-blur-3xl border border-white/12 rounded-[28px] p-7 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_40px_rgba(168,85,247,0.12)] relative overflow-hidden transition-all duration-500">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${currentTheme.focus}`}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                    Email Address
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
                        ? "border-emerald-500/20 focus:border-emerald-500/40"
                        : `border-white/5 ${currentTheme.focus}`
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1 flex items-center gap-1">
                  <Compass className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                  Select Creator Profile
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CREATOR_ROLES.map((role) => {
                    const isSelected = role.id === creatorRole;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setCreatorRole(role.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? `${currentTheme.accentBg} ${currentTheme.accentBorder} text-white shadow-md`
                            : "bg-black/30 border-white/5 hover:border-white/10 text-neutral-400 hover:text-neutral-300"
                        }`}
                      >
                        <div className="text-xs font-bold">{role.label}</div>
                        <div className="text-[9px] text-neutral-500 mt-0.5">
                          {role.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className={`text-[9px] ${currentTheme.accentText} hover:opacity-85 font-extrabold flex items-center gap-0.5 cursor-pointer hover:underline transition-all`}
                  >
                    <Key className="w-3 h-3" />
                    Auto-Generate Secure Password
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center z-10">
                    <Lock className="w-4 h-4 text-neutral-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all font-medium ${
                      hasMinLength
                        ? "border-emerald-500/20 focus:border-emerald-500/40"
                        : `border-white/5 ${currentTheme.focus}`
                    }`}
                    placeholder="Create password (min 6 characters)"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="no-hover-lift p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
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
                </div>
                {passwordNotification && (
                  <p className="text-[10px] font-semibold text-emerald-400 ml-1 animate-pulse">
                    {passwordNotification}
                  </p>
                )}
              </div>

              {password.length > 0 && (
                <div className="space-y-2 px-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex-grow h-full rounded-full transition-colors duration-300 ${
                          passwordStrength >= step
                            ? strengthColor()
                            : "bg-white/5"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    <span>Password Strength:</span>
                    <span
                      className={
                        passwordStrength > 0
                          ? strengthColor().replace("bg-", "text-")
                          : "text-neutral-500"
                      }
                    >
                      {strengthText()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          hasMinLength
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-white/5 border-white/5 text-neutral-600"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </div>
                      <span
                        className={
                          hasMinLength ? "text-neutral-300" : "text-neutral-500"
                        }
                      >
                        8+ characters
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          hasUppercase
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-white/5 border-white/5 text-neutral-600"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </div>
                      <span
                        className={
                          hasUppercase ? "text-neutral-300" : "text-neutral-500"
                        }
                      >
                        1 uppercase letter
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                          hasNumber
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-white/5 border-white/5 text-neutral-600"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                      </div>
                      <span
                        className={
                          hasNumber ? "text-neutral-300" : "text-neutral-500"
                        }
                      >
                        1 number
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start ml-1 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center ${
                        acceptTerms
                          ? `${currentTheme.dot} border-transparent shadow-md`
                          : "bg-black/40 border-white/10 group-hover:border-white/20"
                      }`}
                    >
                      {acceptTerms && (
                        <Check className="w-3 h-3 text-white stroke-[4px]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors font-medium leading-relaxed">
                    I accept Sonikoma's{" "}
                    <button
                      type="button"
                      className={`${currentTheme.accentText} hover:opacity-85 underline font-semibold`}
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className={`${currentTheme.accentText} hover:opacity-85 underline font-semibold`}
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="flex items-start ml-1 pt-0.5">
                <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={subscribeNewsletter}
                      onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center ${
                        subscribeNewsletter
                          ? `${currentTheme.dot} border-transparent shadow-md`
                          : "bg-black/40 border-white/10 group-hover:border-white/20"
                      }`}
                    >
                      {subscribeNewsletter && (
                        <Check className="w-3 h-3 text-white stroke-[4px]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors font-medium flex items-center gap-1">
                    <Bell className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                    Receive comic updates and tutorial emails
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full ${currentTheme.button} disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer duration-300 active:scale-[0.99] mt-2`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Studio Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-neutral-500 font-medium">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className={`${currentTheme.accentText} hover:opacity-85 font-extrabold transition-colors cursor-pointer`}
            >
              Sign In
            </button>
          </p>
        </>
      }
    />
  );
}
