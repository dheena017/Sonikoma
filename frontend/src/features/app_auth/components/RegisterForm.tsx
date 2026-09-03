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
  Key,
  Compass,
  Sparkles,
} from "lucide-react";
import AuthPageShell from "@/features/app_auth/components/AuthPageShell";
import { useRegisterForm } from "@/features/app_auth/hooks";

interface RegisterFormProps {
  onRegister: (data: any) => Promise<any>;
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
    creatorRole,
    setCreatorRole,
    activeTheme,
    passwordNotification,
    hasMinLength,
    hasUppercase,
    hasNumber,
    isEmailValid,
    isFormValid,
    handleGeneratePassword,
    handleSubmit,
    handleSocialRegister,
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
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] rounded-xl text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back</span>
              </button>
            )}

            <div className="flex lg:hidden items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 overflow-hidden">
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                  }}
                  alt="Sonikoma Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-lg font-black text-white tracking-tight uppercase">
                Sonikoma
              </span>
            </div>
          </div>
        </div>
      }
      rightBody={
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 p-2 shadow-sm flex items-center justify-center">
                <img
                  src="/logo-dark.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                  }}
                  alt="Sonikoma"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Join Sonikoma Studio</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-400 text-sm font-medium leading-relaxed">
              Start parsing webtoons and compiling animations today.
            </p>
          </div>

          <div className="w-full">
            <button
              onClick={() => handleSocialRegister("Google")}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-md active:scale-[0.99] group"
            >
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
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#2F2F2F]" />
            <span className="flex-shrink mx-4 text-neutral-400 text-[10px] font-bold uppercase tracking-widest bg-[#141414] px-3 py-1 rounded-full border border-[#2F2F2F]">
              Or Sign Up With Email
            </span>
            <div className="flex-grow border-t border-[#2F2F2F]" />
          </div>

          <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 shadow-2xl space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              {passwordNotification && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs text-center font-medium">
                  {passwordNotification}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wider uppercase text-neutral-300 ml-0.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2F2F2F] focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                    Email Address
                  </label>
                  {email && (
                    <span
                      className={`text-[10px] font-bold ${
                        isEmailValid ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isEmailValid ? "Valid Format" : "Invalid Email"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2F2F2F] focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider uppercase text-neutral-300 ml-0.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
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
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500/50 text-white shadow-sm"
                            : "bg-[#181818] border-[#2F2F2F] hover:border-neutral-600 text-neutral-400 hover:text-neutral-300"
                        }`}
                      >
                        <div className="text-xs font-bold">{role.label}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {role.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center z-10">
                    <Lock className="w-4 h-4 text-neutral-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2F2F2F] focus:border-blue-500 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    placeholder="Create a strong password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
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

                {/* Password Requirement Checks */}
                <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-neutral-400">
                  <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400" : ""}`}>
                    <Check className="w-3 h-3" /> 8+ chars
                  </span>
                  <span className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-400" : ""}`}>
                    <Check className="w-3 h-3" /> 1 uppercase
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-400" : ""}`}>
                    <Check className="w-3 h-3" /> 1 number
                  </span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start ml-0.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center mt-0.5">
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
                          : "bg-[#181818] border-[#2F2F2F] group-hover:border-neutral-500"
                      }`}
                    >
                      {acceptTerms && (
                        <Check className="w-3 h-3 text-white stroke-[3px]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-neutral-400 font-medium">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 decoration-blue-500/50 hover:decoration-blue-400 transition-colors cursor-pointer ml-1"
            >
              Sign In
            </button>
          </p>
        </>
      }
    />
  );
}
