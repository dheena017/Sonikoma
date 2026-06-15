import React from "react";
import {
  KeyRound,
  Mail,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordPage({
  onForgotPassword,
  onNavigateToLogin,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onForgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070709]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-6">
            {isSent ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <KeyRound className="w-8 h-8 text-purple-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {isSent ? "Check your email" : "Reset password"}
          </h2>
          <p className="mt-2 text-neutral-400 text-sm">
            {isSent
              ? `We've sent a password reset link to ${email}`
              : "Enter your email address and we'll send you a link to reset your password"}
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          {isSent ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs leading-relaxed">
                If an account exists for that email, you will receive password
                reset instructions shortly.
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600/50 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-900/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white text-xs font-medium py-2 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
