import React from "react";
import { LogIn, Mail, Lock, Chrome, ArrowRight, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: (data: any) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onGoogleLogin: () => void;
}

export default function LoginPage({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onGoogleLogin,
}: LoginPageProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onLogin({ email, password });
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070709]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-6">
            <LogIn className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-neutral-400 text-sm">
            Sign in to continue to Anivox
          </p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-medium text-neutral-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateToForgotPassword}
                  className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600/50 transition-all"
                  placeholder="••••••••"
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
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-900 px-2 text-neutral-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={onGoogleLogin}
            className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Chrome className="w-5 h-5" />
            Google Authentication
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500">
          Don't have an account?{" "}
          <button
            onClick={onNavigateToRegister}
            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
