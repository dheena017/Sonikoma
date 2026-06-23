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
import AuthShowcase, { THEMES, ThemeKey } from "./AuthShowcase.js";

interface RegisterPageProps {
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

export default function RegisterPage({
  onRegister,
  onNavigateToLogin,
  onNavigateHome,
}: RegisterPageProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Premium interactive states
  const [showPassword, setShowPassword] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = React.useState(true);
  const [creatorRole, setCreatorRole] = React.useState("creator");
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [passwordNotification, setPasswordNotification] = React.useState<
    string | null
  >(null);

  // Password complexity checkers
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const passwordStrength = React.useMemo(() => {
    let score = 0;
    if (password.length > 0) score += 1;
    if (hasMinLength) score += 1;
    if (hasUppercase && hasNumber) score += 1;
    return score; // 0 = empty, 1 = weak, 2 = medium, 3 = strong
  }, [password, hasMinLength, hasUppercase, hasNumber]);

  const strengthColor = () => {
    if (passwordStrength === 1) return "bg-rose-500";
    if (passwordStrength === 2) return "bg-amber-500";
    if (passwordStrength === 3) return "bg-emerald-500";
    return "bg-white/10";
  };

  const strengthText = () => {
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Medium";
    if (passwordStrength === 3) return "Strong";
    return "None";
  };

  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isFormValid = React.useMemo(() => {
    return (
      fullName.trim().length > 0 && isEmailValid && hasMinLength && acceptTerms
    );
  }, [fullName, isEmailValid, hasMinLength, acceptTerms]);

  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=";

    // Build guaranteed segments
    let generated = "";
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += special[Math.floor(Math.random() * special.length)];

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 9; i++) {
      generated += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle
    generated = generated
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setPassword(generated);
    setShowPassword(true);
    setPasswordNotification("Secure password auto-filled & shown below!");
    setTimeout(() => setPasswordNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await onRegister({
        email,
        password,
        full_name: fullName,
        creator_role: creatorRole,
        subscribe_newsletter: subscribeNewsletter,
      });
      (window as any).navigateTo?.("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider: string) => {
    console.log(`[OAuth] Register with ${provider}`);
    setError(
      `OAuth register via ${provider} is not configured for this environment.`
    );
  };

  const currentTheme = THEMES[activeTheme];

  return (
    <div className="min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden">
      {/* LEFT PANEL: Auth Product Slideshow (extracted child component) */}
      <AuthShowcase activeTheme={activeTheme} iconType="register" />

      {/* RIGHT PANEL: Registration Form Interface */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 lg:p-16 bg-[#040406] relative overflow-y-auto">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

        {/* Header branding & Theme Selector */}
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
                  src="/logo.png"
                  alt="Logo"
                  className="w-6 h-6 object-contain drop-shadow-md"
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight mr-0.5">
                Sonikoma
              </span>
            </div>
          </div>

          {/* Minimal Palette Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 p-1 rounded-full backdrop-blur-md">
            {(Object.keys(THEMES) as ThemeKey[]).map((theme) => {
              const colors = {
                purple: "bg-purple-500",
                blue: "bg-blue-500",
                emerald: "bg-emerald-500",
                amber: "bg-amber-500",
              };

              return (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  className={`w-4 h-4 rounded-full transition-transform active:scale-90 cursor-pointer ${
                    colors[theme]
                  } ${
                    activeTheme === theme
                      ? "scale-110 ring-2 ring-white/40"
                      : "scale-90 opacity-60 hover:opacity-100"
                  }`}
                  title={`Switch to ${theme} theme`}
                />
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-6 text-left">
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-neutral-400 text-sm font-medium">
              Start parsing webtoons and compiling animations today.
            </p>
          </div>

          {/* Social Registrations */}
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

          {/* Separator Line */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink mx-4 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
              Or Sign Up With Email
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          {/* Form Card */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                  {error}
                </div>
              )}

              {/* Full Name input */}
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
                    className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Input */}
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
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all font-medium ${
                      isEmailValid
                        ? "border-emerald-500/20 focus:border-emerald-500/40"
                        : "border-white/5 focus:border-purple-500/50"
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Creator Role Pill Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 ml-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
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
                            ? "bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-900/10"
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

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[9px] text-purple-400 hover:text-purple-300 font-extrabold flex items-center gap-0.5 cursor-pointer hover:underline transition-all"
                  >
                    <Key className="w-3 h-3" />
                    Auto-Generate Secure Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                      hasMinLength
                        ? "border-emerald-500/20 focus:border-emerald-500/40"
                        : "border-white/5 focus:border-purple-500/50"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
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

              {/* Password strength details */}
              {password.length > 0 && (
                <div className="space-y-2 px-1">
                  {/* Strength Bar */}
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

                  {/* Requirements checklist */}
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

              {/* Accept Terms Checkbox */}
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
                          ? "bg-purple-600 border-purple-500 shadow-md shadow-purple-900/30"
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
                      className="text-purple-400 hover:text-purple-300 underline font-semibold"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="text-purple-400 hover:text-purple-300 underline font-semibold"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* Newsletter check */}
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
                          ? "bg-purple-600 border-purple-500 shadow-md shadow-purple-900/30"
                          : "bg-black/40 border-white/10 group-hover:border-white/20"
                      }`}
                    >
                      {subscribeNewsletter && (
                        <Check className="w-3 h-3 text-white stroke-[4px]" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors font-medium flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-purple-400" />
                    Receive comic updates and tutorial emails
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:text-white/40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-900/30 cursor-pointer duration-300 active:scale-[0.99] mt-2"
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

          {/* Sign In Link */}
          <p className="text-center text-sm text-neutral-500 font-medium">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-purple-400 hover:text-purple-300 font-extrabold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Footer for mobile only */}
        <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
          © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
        </div>
      </div>
    </div>
  );
}
