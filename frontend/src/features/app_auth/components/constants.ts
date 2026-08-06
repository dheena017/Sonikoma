import {
  Sparkles,
  Film,
  Volume2,
  Cpu,
  LogIn,
  UserPlus,
  KeyRound,
} from "lucide-react";

export type ThemeKey = "purple" | "blue" | "emerald" | "amber";
export type Language = "en" | "ko" | "ja";

export const THEMES: Record<
  ThemeKey,
  {
    glowPrimary: string;
    glowSecondary: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    button: string;
    focus: string;
    dot: string;
  }
> = {
  purple: {
    glowPrimary: "bg-purple-600/10",
    glowSecondary: "bg-indigo-600/10",
    accentText: "text-purple-400",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/20",
    button: "bg-purple-600 hover:bg-purple-500 shadow-purple-900/30",
    focus: "focus:border-purple-500/50 focus:ring-purple-600/20",
    dot: "bg-purple-500",
  },
  blue: {
    glowPrimary: "bg-blue-600/10",
    glowSecondary: "bg-cyan-600/10",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/20",
    button: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30",
    focus: "focus:border-blue-500/50 focus:ring-blue-600/20",
    dot: "bg-blue-500",
  },
  emerald: {
    glowPrimary: "bg-emerald-600/10",
    glowSecondary: "bg-teal-600/10",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30",
    focus: "focus:border-emerald-500/50 focus:ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  amber: {
    glowPrimary: "bg-amber-600/10",
    glowSecondary: "bg-orange-600/10",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/20",
    button: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30",
    focus: "focus:border-amber-500/50 focus:ring-amber-600/20",
    dot: "bg-amber-500",
  },
};

export const SHOWCASE_SLIDES = [
  {
    icon: Sparkles,
    title: "AI Webtoon Parser",
    description:
      "Instantly segment vertical webtoon strips into independent, perfectly cropped storyboard panels using our custom CV engine.",
    badge: "Smart Detection",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Film,
    title: "Cinematic Motion Dynamics",
    description:
      "Bring static frames to life with keyframe camera animations, auto zooms, responsive pans, and cinematic camera shakes.",
    badge: "Motion Director",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Volume2,
    title: "AI Narrative Audio Mixer",
    description:
      "Generate natural voice narration, synchronize multi-character dialogue, and mix contextual sound effects automatically.",
    badge: "Voice & SFX",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Cpu,
    title: "One-Click Video Compiler",
    description:
      "Review auto-generated scripts, translate text into target languages, and export high-definition video files ready for publishing.",
    badge: "Instant Render",
    color: "from-amber-500 to-orange-500",
  },
];

export const TOUR_STEPS = [
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
    icon: KeyRound,
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

export const TRANSLATIONS = {
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
    qrDesc: "Scan code with Sonikoma Mobile to log in instantly",
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
