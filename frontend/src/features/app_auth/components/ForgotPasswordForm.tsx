import React from "react";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import AuthShowcase from "@/features/app_auth/components/AuthShowcase";
import { useForgotPasswordForm } from "@/features/app_auth/hooks";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function ForgotPasswordPage({
  onForgotPassword,
  onNavigateToLogin,
  onNavigateHome,
}: ForgotPasswordPageProps) {
  const {
    email,
    setEmail,
    isLoading,
    error,
    verificationCode,
    setVerificationCode,
    isCodeSent,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isCompleted,
    showPassword,
    setShowPassword,
    activeTheme,
    isEmailValid,
    handleSubmit,
    handleNewPasswordSubmit,
  } = useForgotPasswordForm({
    onForgotPassword,
    onNavigateToLogin,
    onNavigateHome,
  });

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-[#E5E5E5] font-sans overflow-hidden relative">
      {/* LEFT PANEL: Product Preview with Anime Scene */}
      <AuthShowcase activeTheme={activeTheme} iconType="forgot" />

      {/* RIGHT PANEL: Clean Solid Studio Form */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col bg-[#0D0E12] relative border-l border-[#2F2F2F] text-left z-10">
        {/* Top Controls Toolbar */}
        <div className="relative z-10 flex items-center justify-between px-8 lg:px-16 py-6 flex-shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <Tooltip text="Return to Sign In" placement="bottom">
              <button
                onClick={onNavigateToLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] hover:border-neutral-600 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Login</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-8 lg:px-16 pb-8 lg:pb-16 flex flex-col justify-center">
          <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-4 text-left">
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Account Recovery</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Reset Password
              </h2>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                Enter your email address and we'll send you a recovery code.
              </p>
            </div>

            {/* Form Card */}
            <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 shadow-2xl space-y-5">
              {isCompleted ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Your password has been reset successfully. You can now log in with your new password.
                  </p>
                  <Tooltip text="Go to Sign In" placement="bottom">
                    <button
                      onClick={onNavigateToLogin}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer text-sm"
                    >
                      Go to Login
                    </button>
                  </Tooltip>
                </div>
              ) : isCodeSent ? (
                <form noValidate className="space-y-4" onSubmit={handleNewPasswordSubmit}>
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-[#181818] border border-[#2F2F2F] hover:border-neutral-600 focus:border-blue-500 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-widest text-center"
                      placeholder="6-digit code"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2F2F2F] hover:border-neutral-600 focus:border-blue-500 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="Enter new password"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
                        <Tooltip text={showPassword ? "Hide password" : "Show password"} placement="top">
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 z-10 flex items-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#181818] border border-[#2F2F2F] hover:border-neutral-600 focus:border-blue-500 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Tooltip text="Save new password and sign in" placement="bottom">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password</span>}
                    </button>
                  </Tooltip>
                </form>
              ) : (
                <form noValidate className="space-y-4" onSubmit={handleSubmit}>
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
                      {error}
                    </div>
                  )}

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
                        className="w-full bg-[#181818] border border-[#2F2F2F] hover:border-neutral-600 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <Tooltip text="Send password recovery code to your email" placement="bottom">
                    <button
                      type="submit"
                      disabled={isLoading || !isEmailValid}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Send Recovery Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </Tooltip>
                </form>
              )}
            </div>

            {/* Back to Login Link */}
            <p className="text-center text-sm text-neutral-400 font-medium">
              Remember your password?{" "}
              <Tooltip text="Return to Sign In" placement="bottom">
                <button
                  onClick={onNavigateToLogin}
                  className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 decoration-blue-500/50 hover:decoration-blue-400 transition-colors cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </Tooltip>
            </p>
          </div>

          <div className="flex lg:hidden text-center justify-center mt-6 text-xs text-neutral-500 font-mono">
            © {new Date().getFullYear()} Sonikoma Studio
          </div>
        </div>
      </div>
    </div>
  );
}
