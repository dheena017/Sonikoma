import React from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Chrome,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface RegisterPageProps {
  onRegister: (data: any) => Promise<void>;
  onNavigateToLogin: () => void;
  onGoogleLogin: () => void;
}

export default function RegisterPage({
  onRegister,
  onNavigateToLogin,
  onGoogleLogin,
}: RegisterPageProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onRegister({ email, password, full_name: fullName });
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070709]">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-6">
            <UserPlus className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Join Anivox
          </h2>
          <p className="mt-2 text-neutral-400 text-sm">
            Create your account to start making magic
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-600/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="text-xs font-medium text-neutral-400 ml-1">
                Password
              </label>
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
                  Get Started
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
                Or sign up with
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
          Already have an account?{" "}
          <button
            onClick={onNavigateToLogin}
            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
