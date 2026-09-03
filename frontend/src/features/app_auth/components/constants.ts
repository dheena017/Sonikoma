import {
  Sparkles,
  Film,
  Volume2,
  Cpu,
  LogIn,
  UserPlus,
  KeyRound,
} from "lucide-react";

export type ThemeKey = "blue" | "purple" | "emerald" | "amber";
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
    cardBorder: string;
    badgeBg: string;
  }
> = {
  blue: {
    glowPrimary: "bg-blue-600/10",
    glowSecondary: "bg-indigo-600/10",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/20",
    button:
      "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md",
    focus: "focus:border-blue-500/60 focus:ring-blue-600/20",
    dot: "bg-blue-500",
    cardBorder: "from-blue-500/30 via-indigo-500/20 to-transparent",
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  purple: {
    glowPrimary: "bg-purple-600/10",
    glowSecondary: "bg-indigo-600/10",
    accentText: "text-[#3B82F6]",
    accentBg: "bg-[#3B82F6]/10",
    accentBorder: "border-[#3B82F6]/20",
    button:
      "bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md",
    focus: "focus:border-blue-500/60 focus:ring-blue-600/20",
    dot: "bg-blue-500",
    cardBorder: "from-blue-500/30 via-indigo-500/20 to-transparent",
    badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  },
  emerald: {
    glowPrimary: "bg-emerald-600/10",
    glowSecondary: "bg-teal-600/10",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    button:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md",
    focus: "focus:border-emerald-500/50 focus:ring-emerald-600/20",
    dot: "bg-emerald-500",
    cardBorder: "from-emerald-500/30 via-teal-500/20 to-transparent",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  amber: {
    glowPrimary: "bg-amber-600/10",
    glowSecondary: "bg-orange-600/10",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/20",
    button:
      "bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md",
    focus: "focus:border-amber-500/50 focus:ring-amber-600/20",
    dot: "bg-amber-500",
    cardBorder: "from-amber-500/30 via-orange-500/20 to-transparent",
    badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
};

export const SHOWCASE_SLIDES = [
  {
    icon: Sparkles,
    title: "AI Webtoon Parser",
    description:
      "Instantly segment vertical webtoon strips into independent, perfectly cropped storyboard panels using our custom CV engine.",
    badge: "Smart Detection",
    color: "from-blue-400 to-blue-400",
  },
  {
    icon: Film,
    title: "Cinematic Motion Dynamics",
    description:
      "Bring static frames to life with keyframe camera animations, auto zooms, responsive pans, and cinematic camera shakes.",
    badge: "Motion Director",
    color: "from-blue-400 to-indigo-400",
  },
  {
    icon: Volume2,
    title: "AI Narrative Audio Mixer",
    description:
      "Generate natural voice narration, synchronize multi-character dialogue, and mix contextual sound effects automatically.",
    badge: "Voice & SFX",
    color: "from-indigo-400 to-blue-400",
  },
  {
    icon: Cpu,
    title: "One-Click Video Compiler",
    description:
      "Review auto-generated scripts, translate text into target languages, and export high-definition video files ready for publishing.",
    badge: "Instant Render",
    color: "from-blue-400 to-teal-400",
  },
];

export const TOUR_STEPS = [
  {
    icon: Film,
    title: "1. Upload Webtoon Strips",
    description:
      "Paste a webtoon link or upload a long strip image. Our scraper automatically retrieves high-resolution content panels in seconds.",
    color: "from-blue-400 to-blue-400",
  },
  {
    icon: Sparkles,
    title: "2. Smart Gutter-Agnostic Slicing",
    description:
      "Click Auto-Crop to let our local computer vision algorithm trace row variance and cut strips into clean panel storyboards automatically.",
    color: "from-blue-400 to-indigo-400",
  },
  {
    icon: KeyRound,
    title: "3. Dramatize & Translate",
    description:
      "Use Gemini AI to transcribe bubble texts, translate storyboard dialogues into multiple languages, and generate detailed descriptions.",
    color: "from-indigo-400 to-blue-400",
  },
  {
    icon: Volume2,
    title: "4. Cinematic Motion & SFX",
    description:
      "Apply responsive pan/zoom effects and mix background tracks or speech scripts to transform static panels into animated movies.",
    color: "from-blue-400 to-teal-400",
  },
];

export const TRANSLATIONS = {
  en: {
    welcome: "Welcome to Sonikoma Studio",
    subtitle: "Log in to access your dashboard, projects, and production tools.",
    email: "Email Address",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgot: "Forgot Password?",
    remember: "Keep me signed in on this device",
    signIn: "Sign In to Studio",
    or: "Or Sign In With Email",
    createAcc: "Don't have an account yet?",
    createBtn: "Create free account",
    tour: "Take Tour",
    capsLock: "Warning: Caps Lock is ON",
  },
  ko: {
    welcome: "Sonikoma Studio에 오신 것을 환영합니다",
    subtitle: "대시보드와 비디오 프로젝트에 액세스하려면 로그인하세요.",
    email: "이메일 주소",
    emailPlaceholder: "name@example.com",
    password: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    forgot: "비밀번호를 잊으셨나요?",
    remember: "이 기기에서 로그인 상태 유지",
    signIn: "스튜디오 로그인",
    or: "또는 이메일로 로그인",
    createAcc: "아직 계정이 없으신가요?",
    createBtn: "무료 계정 생성",
    tour: "튜토리얼 보기",
    capsLock: "주의: Caps Lock이 켜져 있습니다",
  },
  ja: {
    welcome: "Sonikoma Studioへようこそ",
    subtitle: "ダッシュボードと動画プロジェクトにアクセスします。",
    email: "メールアドレス",
    emailPlaceholder: "name@example.com",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    forgot: "パスワードをお忘れですか？",
    remember: "このデバイスでログイン状態を保持する",
    signIn: "スタジオにサインイン",
    or: "またはメールアドレスでサインイン",
    createAcc: "アカウントをお持ちでないですか？",
    createBtn: "無料アカウントを作成",
    tour: "ツアーを開始",
    capsLock: "警告: Caps Lockがオンになっています",
  },
};
