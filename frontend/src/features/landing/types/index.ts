export type ThemeMode = "dark" | "light";

export type BillingCycle = "monthly" | "yearly";

export type DemoTabId = "slicing" | "bubbles" | "translation" | "render";

export interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  themeMode?: ThemeMode;
  toggleThemeMode?: () => void;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SampleComic {
  name: string;
  url: string;
  tag: string;
  icon: string;
  thumbnail: string;
  platform: string;
}

export interface DetectedPlatform {
  name: string;
  tagClass: string;
}
