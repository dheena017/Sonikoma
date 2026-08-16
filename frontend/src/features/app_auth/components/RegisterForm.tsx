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
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-400 text-sm font-medium">
              Start parsing webtoons and compiling animations today.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialRegister("Google")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-medium text-xs transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Chrome className="w-4 h-4 text-neutral-300" />
              Google
            </button>
            <button
              onClick={() => handleSocialRegister("GitHub")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-medium text-xs transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Github className="w-4 h-4 text-neutral-300" />
              GitHub
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink mx-4 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
              Or Sign Up With Email
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
            <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${currentTheme.cardBorder}`} />

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
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 z-10">
                    <Lock className="w-4 h-4 text-neutral-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-12 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                      hasMinLength
                        ? "border-emerald-500/20 focus:border-emerald-500/40"
                        : `border-white/5 ${currentTheme.focus}`
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none cursor-pointer z-10"
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
