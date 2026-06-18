import React from "react";
import {
  LogIn,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Chrome,
  Github,
  Languages,
  Activity,
  KeyRound,
  HelpCircle,
  X,
  Film,
  Info,
  Sparkles,
  Volume2,
  Keyboard,
  QrCode,
} from "lucide-react";
import AuthShowcase, { THEMES, ThemeKey } from "./AuthShowcase.js";

interface LoginPageProps {
  onLogin: (data: any) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

const TOUR_STEPS = [
  {
    icon: Film,
    title: "1. Upload Webtoon Strips",
    description:
      "Paste a webtoon link or upload a long strip image. Our scraper automatically retrieves high-resolution content panels in seconds.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Sparkles,
    title: "2. Smart Gutter-Agnostic Slicing",
    description:
      "Click Auto-Crop to let our local computer vision algorithm trace row variance and cut strips into clean panel storyboards automatically.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Languages,
    title: "3. Dramatize & Translate",
    description:
      "Use Gemini AI to transcribe bubble texts, translate storyboard dialogues into multiple languages, and generate detailed descriptions.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Volume2,
    title: "4. Cinematic Motion & SFX",
    description:
      "Apply responsive pan/zoom effects and mix background tracks or speech scripts to transform static panels into animated movies.",
    color: "from-amber-500 to-orange-500",
  },
];

type Language = "en" | "ko" | "ja";

const TRANSLATIONS: Record<Language, any> = {
  en: {
    welcome: "Welcome Back",
    subtitle: "Log in to access your dashboard and video projects.",
    email: "Email Address",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    forgot: "Forgot Password?",
    remember: "Keep me signed in on this device",
    signIn: "Sign In to Studio",
    or: "Or Sign In With Email",
    demo: "Testing the dashboard?",
    demoBtn: "Auto-fill Demo Credentials",
    createAcc: "Don't have an account yet?",
    createBtn: "Create free account",
    systemHealth: "Compute System Health",
    tour: "Take Tour",
    passkeyBtn: "Sign in with Passkey",
    capsLock: "Warning: Caps Lock is ON",
    qrTitle: "Sign in with QR Code",
    qrDesc: "Scan code with Anivox Mobile to log in instantly",
    qrToggle: "Sign In via Mobile QR",
    qrFormToggle: "Back to Email Login",
    qrSimulate: "Simulate mobile scan success",
    qrExpire: "QR expires in: ",
  },
  ko: {
    welcome: "다시 오신 것을 환영합니다",
    subtitle: "대시보드와 비디오 프로젝트에 액세스하려면 로그인하세요.",
    email: "이메일 주소",
    emailPlaceholder: "name@example.com",
    password: "비밀번호",
    passwordPlaceholder: "••••••••",
    forgot: "비밀번호를 잊으셨나요?",
    remember: "이 기기에서 로그인 상태 유지",
    signIn: "스튜디오 로그인",
    or: "또는 이메일로 로그인",
    demo: "대시보드를 테스트 중이신가요?",
    demoBtn: "데모 자격 증명 자동 입력",
    createAcc: "아직 계정이 없으신가요?",
    createBtn: "무료 계정 생성",
    systemHealth: "컴퓨팅 시스템 상태",
    tour: "튜토리얼 보기",
    passkeyBtn: "패스키(Passkey)로 로그인",
    capsLock: "주의: Caps Lock이 켜져 있습니다",
    qrTitle: "QR 코드로 로그인",
    qrDesc: "모바일 앱으로 QR 코드를 스캔하여 즉시 로그인하세요",
    qrToggle: "모바일 QR 로그인",
    qrFormToggle: "이메일 로그인으로 돌아가기",
    qrSimulate: "모바일 스캔 성공 시뮬레이션",
    qrExpire: "만료 시간: ",
  },
  ja: {
    welcome: "おかえりなさい",
    subtitle:
      "ダッシュボードとビデオプロジェクトにアクセスするにはログインしてください。",
    email: "メールアドレス",
    emailPlaceholder: "name@example.com",
    password: "パスワード",
    passwordPlaceholder: "••••••••",
    forgot: "パスワードをお忘れですか？",
    remember: "このデバイスでログイン状態を保持する",
    signIn: "スタジオにサインイン",
    or: "またはメールアドレスでサインイン",
    demo: "ダッシュボードをお試しですか？",
    demoBtn: "デモ認証情報の自動入力",
    createAcc: "アカウントをお持ちでないですか？",
    createBtn: "無料アカウントを作成",
    systemHealth: "システム稼働ステータス",
    tour: "ツアーを開始",
    passkeyBtn: "パスキーでサインイン",
    capsLock: "警告: Caps Lockがオンになっています",
    qrTitle: "QRコードでサインイン",
    qrDesc: "モバイルアプリでQRコードをスキャンして即時ログイン",
    qrToggle: "モバイルQRサインイン",
    qrFormToggle: "メールログインに戻る",
    qrSimulate: "スキャン成功をシミュレート",
    qrExpire: "コード有効期限: ",
  },
};

export default function LoginPage({
  onLogin,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}: LoginPageProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Custom states
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<ThemeKey>("purple");
  const [language, setLanguage] = React.useState<Language>("en");
  const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);

  // QR code simulator states
  const [isQrLogin, setIsQrLogin] = React.useState(false);
  const [qrTimer, setQrTimer] = React.useState(60);

  // Keyboard shortcuts panel state
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  // Passkey simulated auth states
  const [isPasskeyLoading, setIsPasskeyLoading] = React.useState(false);
  const [passkeyStatus, setPasskeyStatus] = React.useState<string | null>(null);

  // Interactive tour state
  const [isTourOpen, setIsTourOpen] = React.useState(false);
  const [tourStep, setTourStep] = React.useState(0);

  // Slide verification captcha states
  const [showCaptcha, setShowCaptcha] = React.useState(false);
  const [captchaSliderPos, setCaptchaSliderPos] = React.useState(10);
  const [captchaTargetPos, setCaptchaTargetPos] = React.useState(
    () => Math.floor(Math.random() * 40) + 45
  ); // 45 to 85
  const [isCaptchaVerified, setIsCaptchaVerified] = React.useState(false);

  // QR Code expiration timer tick
  React.useEffect(() => {
    if (!isQrLogin || qrTimer <= 0) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isQrLogin, qrTimer]);

  // Simple client-side input validation states
  const isEmailValid = React.useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const isPasswordValid = React.useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!isCaptchaVerified) {
      setShowCaptcha(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onLogin({ email, password, rememberMe });
      (window as any).navigateTo?.("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`[OAuth] Initiate login with ${provider}`);
    setError(
      `OAuth sign in with ${provider} is not configured for this environment yet.`
    );
  };

  const handleQuickFill = () => {
    setEmail("admin@anivox.com");
    setPassword("password123");
    setRememberMe(true);
    if (error) setError(null);
  };

  const handlePasskeySignIn = () => {
    setIsPasskeyLoading(true);
    setPasskeyStatus("Contacting biometric key hardware...");
    setTimeout(() => {
      setPasskeyStatus("Scanning TouchID / FaceID sensors...");
      setTimeout(() => {
        setIsPasskeyLoading(false);
        setPasskeyStatus(null);
        setEmail("passkey_creator@anivox.com");
        setPassword("passkey_secret_2026");
        setRememberMe(true);
        setError(null);
      }, 1400);
    }, 1000);
  };

  const handleQrSimulateSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setEmail("qr_direct_creator@anivox.com");
      setPassword("qr_token_verified_99");
      setRememberMe(true);
      setIsLoading(false);
      setIsQrLogin(false);
      alert("Mobile authenticator token successfully verified! Logging in...");
    }, 1200);
  };

  const checkCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const t = TRANSLATIONS[language];
  const currentTheme = THEMES[activeTheme];

  // Helper references for icons dynamically instantiated in Tour
  const getTourIconComponent = (idx: number) => {
    switch (idx) {
      case 0:
        return Film;
      case 1:
        return Sparkles;
      case 2:
        return Languages;
      default:
        return Volume2;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#070709] text-white font-sans overflow-hidden">
      {/* LEFT PANEL: Auth Product Slideshow (extracted child component) */}
      <AuthShowcase activeTheme={activeTheme} iconType="login" />

      {/* RIGHT PANEL: Login Form Interface */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 lg:p-16 bg-[#040406] relative overflow-y-auto">
        {/* Soft background glow (Theme-driven) */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full ${currentTheme.glowPrimary} blur-[120px] pointer-events-none transition-all duration-1000`}
        />

        {/* Top Controls Toolbar */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          {/* Header branding (only visible on mobile/tablet) */}
          <div className="flex lg:hidden items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg ${currentTheme.accentBg} border ${currentTheme.accentBorder}`}
            >
              <LogIn className={`w-4 h-4 ${currentTheme.accentText}`} />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Anivox
            </span>
          </div>
          <div className="hidden lg:block" /> {/* Spacer */}
          {/* Theme Selector & Tour Button */}
          <div className="flex items-center gap-4">
            {/* Keyboard Shortcuts Trigger Button */}
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-1.5 bg-neutral-900/60 border border-white/5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Keyboard Shortcuts Guide"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Multi-language translator dropdown selector */}
            <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 p-1 rounded-xl backdrop-blur-md">
              <Languages className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border-none text-[11px] font-bold text-white py-1 pl-1 pr-6 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#0c0c14] text-white">
                  English
                </option>
                <option value="ko" className="bg-[#0c0c14] text-white">
                  한국어
                </option>
                <option value="ja" className="bg-[#0c0c14] text-white">
                  日本語
                </option>
              </select>
            </div>

            {/* Minimal Palette Theme Switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 p-1 rounded-full backdrop-blur-md">
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

            <button
              onClick={() => setIsTourOpen(true)}
              className={`flex items-center gap-1 text-xs ${currentTheme.accentText} ${currentTheme.accentBg} border ${currentTheme.accentBorder} px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/5 transition-all`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t.tour}
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 py-6 text-left">
          {/* Welcome Text */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {t.welcome}
            </h2>
            <p className="text-neutral-400 text-sm">{t.subtitle}</p>
          </div>

          {/* Social Sign-In buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin("Google")}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-medium text-xs transition-all duration-300 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <Chrome className="w-4 h-4 text-neutral-300" />
              Google
            </button>
            <button
              onClick={() => handleSocialLogin("GitHub")}
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
              {t.or}
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          {/* Login Card */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

            {/* Passkey authentication status overlay */}
            {isPasskeyLoading && (
              <div className="absolute inset-0 z-30 bg-[#070709]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center relative">
                  <div className="absolute inset-2 border-2 border-purple-500 rounded-full animate-ping" />
                  <KeyRound className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-2 max-w-xs">
                  <span className="text-xs font-black text-white uppercase tracking-wider block">
                    Passkey Quick Authentication
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium leading-relaxed block">
                    {passkeyStatus}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasskeyLoading(false)}
                  className="bg-white/5 border border-white/10 text-neutral-400 hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
                >
                  Cancel Passkey sign in
                </button>
              </div>
            )}

            {isQrLogin ? (
              // SIMULATED MOBILE QR LOGIN LAYOUT
              <div className="space-y-5 flex flex-col items-center text-center py-2 animate-in fade-in duration-350">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{t.qrTitle}</h4>
                  <p className="text-[10px] text-neutral-500 max-w-xs">
                    {t.qrDesc}
                  </p>
                </div>

                {/* Pulse QR Code Layout */}
                <div className="w-44 h-44 bg-white p-3 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <QrCode className="w-full h-full text-black" />

                  {/* Neon scan beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-purple-500 shadow-md shadow-purple-500 animate-scan-beam" />
                </div>

                <div className="text-[10px] font-bold text-purple-400 font-mono">
                  {t.qrExpire}
                  {qrTimer}s
                </div>

                <button
                  type="button"
                  onClick={handleQrSimulateSuccess}
                  className="bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-purple-400 font-bold py-1.5 px-4 rounded-xl text-[10px] cursor-pointer"
                >
                  {t.qrSimulate}
                </button>

                <button
                  type="button"
                  onClick={() => setIsQrLogin(false)}
                  className="text-xs font-bold text-neutral-500 hover:text-white hover:underline transition-all cursor-pointer"
                >
                  {t.qrFormToggle}
                </button>
              </div>
            ) : (
              // DEFAULT EMAIL/PASSWORD INPUT FORM
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium animate-shake">
                    {error}
                  </div>
                )}

                {/* Email address input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                      {t.email}
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
                          ? "border-emerald-500/20 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                          : `border-white/5 ${currentTheme.focus}`
                      }`}
                      placeholder={t.emailPlaceholder}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                      {t.password}
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className={`text-[10px] ${currentTheme.accentText} hover:opacity-85 transition-opacity font-bold tracking-tight`}
                    >
                      {t.forgot}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        isPasswordValid
                          ? "text-emerald-400"
                          : "text-neutral-500"
                      }`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={checkCapsLock}
                      onKeyUp={checkCapsLock}
                      className={`w-full bg-black/40 border rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 transition-all font-medium ${
                        isPasswordValid
                          ? "border-emerald-500/20 focus:ring-emerald-500/20 focus:border-emerald-500/40"
                          : `border-white/5 ${currentTheme.focus}`
                      }`}
                      placeholder={t.passwordPlaceholder}
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
                  {/* Caps Lock warning indicator */}
                  {isCapsLockOn && (
                    <div className="text-[9px] font-bold text-amber-500 ml-1 mt-1 flex items-center gap-1.5 animate-pulse">
                      <Info className="w-3.5 h-3.5" />
                      <span>{t.capsLock}</span>
                    </div>
                  )}
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center ml-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center ${
                          rememberMe
                            ? `${currentTheme.dot.replace(
                                "bg-",
                                "bg-"
                              )} border-transparent shadow-md`
                            : "bg-black/40 border-white/10 group-hover:border-white/20"
                        }`}
                      >
                        {rememberMe && (
                          <Check className="w-3 h-3 text-white stroke-[4px]" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors font-medium">
                      {t.remember}
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${currentTheme.button} text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group cursor-pointer duration-300 active:scale-[0.99] mt-2`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t.signIn}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Toggle between QR Code and Form buttons */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handlePasskeySignIn}
                className="flex-1 bg-[#0a0a0e]/60 hover:bg-[#101018]/80 text-neutral-300 hover:text-white border border-white/5 hover:border-white/10 text-[10px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer duration-300"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                {t.passkeyBtn}
              </button>

              <button
                type="button"
                onClick={() => setIsQrLogin(!isQrLogin)}
                className="flex-1 bg-[#0a0a0e]/60 hover:bg-[#101018]/80 text-neutral-300 hover:text-white border border-white/5 hover:border-white/10 text-[10px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer duration-300"
              >
                <QrCode className="w-3.5 h-3.5 text-purple-400" />
                {isQrLogin ? t.qrFormToggle : t.qrToggle}
              </button>
            </div>

            {/* Quick Demo Fill Utility Banner */}
            {!isQrLogin && (
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-neutral-500 flex items-center gap-1 font-medium">
                  <Info className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                  {t.demo}
                </span>
                <button
                  onClick={handleQuickFill}
                  className={`hover:opacity-85 hover:underline font-bold cursor-pointer transition-colors active:scale-95 ${currentTheme.accentText}`}
                >
                  {t.demoBtn}
                </button>
              </div>
            )}
          </div>

          {/* Create Account Link */}
          <p className="text-center text-sm text-neutral-500 font-medium">
            {t.createAcc}{" "}
            <button
              onClick={onNavigateToRegister}
              className={`hover:opacity-85 font-extrabold transition-colors cursor-pointer ${currentTheme.accentText}`}
            >
              {t.createBtn}
            </button>
          </p>
        </div>

        {/* Live System Health Dashboard */}
        <div className="relative z-10 w-full max-w-md mx-auto mt-4 p-4 bg-neutral-900/20 border border-white/5 rounded-2xl flex items-center justify-between text-[10px] font-bold text-neutral-500 tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-neutral-600 animate-pulse" />
            {t.systemHealth}
          </span>
          <div className="flex gap-4 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute" />
              <span className="text-neutral-400">FastAPI</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-400">Gemini</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-400">SQLite</span>
            </div>
          </div>
        </div>

        {/* Footer for mobile only */}
        <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
          © {new Date().getFullYear()} Anivox AI Corp. All rights reserved.
        </div>
      </div>

      {/* KEYBOARD SHORTCUTS GUIDE OVERLAY MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#101018] to-[#070709] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-300 text-left">
            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-purple-400" />
                Workspace Hotkeys Guide
              </h3>
              <p className="text-xs text-neutral-500">
                Accelerate your Webtoon-to-Video compilation workflow
              </p>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                <span className="text-neutral-400 font-medium">
                  Toggle Playback
                </span>
                <kbd className="bg-neutral-800 text-neutral-200 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                <span className="text-neutral-400 font-medium">
                  Auto-Crop Strip
                </span>
                <kbd className="bg-neutral-800 text-neutral-200 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                  Ctrl + Shift + C
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                <span className="text-neutral-400 font-medium">
                  Next Panel Frame
                </span>
                <kbd className="bg-neutral-800 text-neutral-200 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                  →
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                <span className="text-neutral-400 font-medium">
                  Previous Panel Frame
                </span>
                <kbd className="bg-neutral-800 text-neutral-200 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                  ←
                </kbd>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-neutral-400 font-medium">
                  Mute Synthesizer
                </span>
                <kbd className="bg-neutral-800 text-neutral-200 border border-white/15 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
                  M
                </kbd>
              </div>
            </div>

            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="mt-2 w-full bg-neutral-900 border border-white/5 hover:bg-neutral-800 py-2.5 rounded-xl text-xs font-bold transition-all text-neutral-300 hover:text-white cursor-pointer"
            >
              Close Guide Drawer
            </button>
          </div>
        </div>
      )}

      {/* PORTAL OVERLAY: Step-by-Step Interactive Features Tour Modal */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#101018] to-[#070709] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 animate-in zoom-in-95 duration-300 text-left">
            {/* Corner Close Button */}
            <button
              onClick={() => setIsTourOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Visual Representation of Step */}
            <div className="w-full md:w-2/5 flex flex-col items-center justify-center p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/10 mb-6 animate-pulse">
                {React.createElement(getTourIconComponent(tourStep), {
                  className: "w-8 h-8 text-white",
                })}
              </div>
              <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                Pipeline Step {tourStep + 1}
              </span>
            </div>

            {/* Right Column: Step Description and Navigation */}
            <div className="w-full md:w-3/5 flex flex-col justify-between py-2 text-left">
              <div className="space-y-4">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Anivox Studio Tour
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                  {TOUR_STEPS[tourStep].title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {TOUR_STEPS[tourStep].description}
                </p>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTourStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === tourStep
                          ? "w-6 bg-purple-500"
                          : "w-1.5 bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {tourStep > 0 && (
                    <button
                      onClick={() => setTourStep((prev) => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Back
                    </button>
                  )}
                  {tourStep < TOUR_STEPS.length - 1 ? (
                    <button
                      onClick={() => setTourStep((prev) => prev + 1)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer transition-colors active:scale-95"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTourOpen(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold cursor-pointer transition-colors active:scale-95"
                    >
                      Finish Tour
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCaptcha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#101018] to-[#070709] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowCaptcha(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Security Panel Verification
              </h3>
              <p className="text-[10px] text-neutral-500">
                Drag the speech balloon to match the panel bubble outline
              </p>
            </div>

            {/* Captcha Track Area */}
            <div className="relative h-24 bg-black/40 border border-white/5 rounded-2xl overflow-hidden flex items-center p-2">
              {/* Target Outline (Fixed at target position) */}
              <div
                className="absolute w-12 h-12 border-2 border-dashed border-purple-500 rounded-xl bg-purple-500/10 flex items-center justify-center"
                style={{
                  left: `${captchaTargetPos}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-6 h-6 border-b-2 border-r-2 border-purple-400 rotate-45 transform origin-bottom-right opacity-30" />
              </div>

              {/* Slidable element (Controlled by slider) */}
              <div
                className="absolute w-12 h-12 bg-purple-600 border border-purple-500 rounded-xl shadow-lg flex items-center justify-center cursor-ew-resize transition-all"
                style={{
                  left: `${captchaSliderPos}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="text-[9px] font-black text-white uppercase tracking-tighter">
                  *POW*
                </span>
              </div>
            </div>

            {/* Slider track input */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="10"
                max="90"
                value={captchaSliderPos}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCaptchaSliderPos(val);
                  if (Math.abs(val - captchaTargetPos) < 4) {
                    setIsCaptchaVerified(true);
                    setTimeout(() => {
                      setShowCaptcha(false);
                      setIsLoading(true);
                      setError(null);
                      onLogin({ email, password, rememberMe })
                        .then(() => {
                          (window as any).navigateTo?.("/dashboard");
                        })
                        .catch((err: any) => {
                          setError(
                            err.message ||
                              "Invalid credentials. Please try again."
                          );
                          setIsLoading(false);
                        });
                    }, 500);
                  }
                }}
                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-ew-resize accent-purple-500"
              />
              <div className="flex justify-between text-[8px] font-mono text-neutral-500 font-bold uppercase tracking-wider">
                <span>Start</span>
                <span className={isCaptchaVerified ? "text-emerald-400" : ""}>
                  {isCaptchaVerified ? "VERIFIED MATCH!" : "Slide to align"}
                </span>
                <span>End</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan-beam {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan-beam {
          animation: scan-beam 2.8s infinite linear;
        }
      `,
        }}
      />
    </div>
  );
}
