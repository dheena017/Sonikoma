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
    activeTheme,
    passwordNotification,
    hasMinLength,
    isEmailValid,
    isFormValid,
    handleSubmit,
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
        </div>
      }
      rightBody={
        <>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Get Started Free</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-medium leading-relaxed">
              Start creating animated, voiced comic videos in seconds.
            </p>
          </div>



          <div className="rounded-[30px] border border-[#2F2F2F]/90 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,#1a1a1d_0%,#141517_48%,#0d0e11_100%)] p-4 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/5 space-y-4">
            <form noValidate className="space-y-4" onSubmit={handleSubmit}>
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
                    className="w-full bg-[#121417] border border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Email Address
                  </label>
                  {email && (
                    <span
                      className={`text-[10px] font-bold ${
                        isEmailValid ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {isEmailValid ? "Valid format" : "Check email"}
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
                    className="w-full bg-[#121417] border border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 ml-0.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121417] border border-[#2F2F2F] hover:border-blue-500/40 focus:border-blue-400 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 hover:placeholder:text-neutral-400 focus:placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                    placeholder="Enter your password"
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
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start ml-0.5 pt-1">
                <Tooltip
                  text="Click to accept terms and conditions"
                  placement="top"
                >
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
                </Tooltip>
              </div>

              {/* Submit Button */}
              <Tooltip
                text="Complete registration and start creating"
                placement="bottom"
              >
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className="w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#4F8EF7] hover:via-[#3B82F6] hover:to-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-[0_12px_28px_rgba(59,130,246,0.35)] hover:shadow-[0_16px_36px_rgba(59,130,246,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
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
