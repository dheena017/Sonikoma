import React from "react";
import {
  Settings,
  Bell,
  Palette,
  Moon,
  Sun,
  Monitor,
  ShieldAlert,
  Sparkles,
  Mail,
  Smartphone,
  MonitorPlay,
  Cpu,
  Minimize2,
  Save,
  Eye,
  Globe,
  LineChart,
  Bot,
  FileVideo,
  Mic,
  Crop,
  Clapperboard,
  Volume2,
  Type,
  Square,
  ZapOff,
} from "lucide-react";

interface ProfilePreferencesTabProps {
  notifications: {
    newsletter: boolean;
    productUpdates: boolean;
    securityAlerts: boolean;
    billingReceipts: boolean;
    pushNotifications: boolean;
  };
  setNotifications: React.Dispatch<React.SetStateAction<any>>;
  workspace: {
    hardwareAcceleration: boolean;
    compactMode: boolean;
    autoSaveInterval: string;
  };
  setWorkspace: React.Dispatch<React.SetStateAction<any>>;
  privacy: {
    analyticsTelemetry: boolean;
    publicProfile: boolean;
  };
  setPrivacy: React.Dispatch<React.SetStateAction<any>>;
  ai?: {
    defaultModel: string;
    defaultVoice: string;
    autoCropSensitivity: string;
  };
  setAi?: React.Dispatch<React.SetStateAction<any>>;
  exportSettings?: {
    resolution: string;
    framerate: string;
    audioFormat: string;
  };
  setExportSettings?: React.Dispatch<React.SetStateAction<any>>;
  themeMode?: "dark" | "light" | string;
  toggleThemeMode?: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontScale?: string;
  setFontScale?: (scale: string) => void;
  reduceMotion?: boolean;
  setReduceMotion?: (reduce: boolean) => void;
  cornerRadius?: string;
  setCornerRadius?: (radius: string) => void;
  onSave: (e: React.FormEvent) => void;
  saveSuccess: boolean;
}

export default function ProfilePreferencesTab({
  notifications,
  setNotifications,
  workspace,
  setWorkspace,
  privacy,
  setPrivacy,
  ai,
  setAi,
  exportSettings,
  setExportSettings,
  themeMode,
  toggleThemeMode,
  accentColor,
  setAccentColor,
  fontScale,
  setFontScale,
  reduceMotion,
  setReduceMotion,
  cornerRadius,
  setCornerRadius,
  onSave,
  saveSuccess,
}: ProfilePreferencesTabProps) {
  const handleToggle = (stateUpdater: any, key: string) => {
    stateUpdater((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (stateUpdater: any, key: string, value: string) => {
    stateUpdater((prev: any) => ({ ...prev, [key]: value }));
  };

  const accentColors = [
    {
      id: "purple",
      name: "Nebula Purple",
      class: "bg-purple-500",
      shadow: "shadow-purple-500/50",
    },
    {
      id: "indigo",
      name: "Deep Space",
      class: "bg-indigo-500",
      shadow: "shadow-indigo-500/50",
    },
    {
      id: "emerald",
      name: "Cyber Green",
      class: "bg-emerald-500",
      shadow: "shadow-emerald-500/50",
    },
    {
      id: "rose",
      name: "Neon Pink",
      class: "bg-rose-500",
      shadow: "shadow-rose-500/50",
    },
    {
      id: "amber",
      name: "Sunset Gold",
      class: "bg-amber-500",
      shadow: "shadow-amber-500/50",
    },
    {
      id: "cyan",
      name: "Electric Blue",
      class: "bg-cyan-500",
      shadow: "shadow-cyan-500/50",
    },
  ];

  const getThemeClasses = (color: string) => {
    switch (color) {
      case "indigo":
        return {
          text: "text-indigo-400",
          bg10: "bg-indigo-500/10",
          border30: "border-indigo-500/30",
          bg600: "bg-indigo-600",
          bgHover: "hover:bg-indigo-500",
          via: "via-indigo-500/20",
          peerChecked: "peer-checked:bg-indigo-500",
          focusBorder: "focus:border-indigo-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]",
        };
      case "emerald":
        return {
          text: "text-emerald-400",
          bg10: "bg-emerald-500/10",
          border30: "border-emerald-500/30",
          bg600: "bg-emerald-600",
          bgHover: "hover:bg-emerald-500",
          via: "via-emerald-500/20",
          peerChecked: "peer-checked:bg-emerald-500",
          focusBorder: "focus:border-emerald-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]",
        };
      case "rose":
        return {
          text: "text-rose-400",
          bg10: "bg-rose-500/10",
          border30: "border-rose-500/30",
          bg600: "bg-rose-600",
          bgHover: "hover:bg-rose-500",
          via: "via-rose-500/20",
          peerChecked: "peer-checked:bg-rose-500",
          focusBorder: "focus:border-rose-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]",
        };
      case "amber":
        return {
          text: "text-amber-400",
          bg10: "bg-amber-500/10",
          border30: "border-amber-500/30",
          bg600: "bg-amber-600",
          bgHover: "hover:bg-amber-500",
          via: "via-amber-500/20",
          peerChecked: "peer-checked:bg-amber-500",
          focusBorder: "focus:border-amber-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]",
        };
      case "cyan":
        return {
          text: "text-cyan-400",
          bg10: "bg-cyan-500/10",
          border30: "border-cyan-500/30",
          bg600: "bg-cyan-600",
          bgHover: "hover:bg-cyan-500",
          via: "via-cyan-500/20",
          peerChecked: "peer-checked:bg-cyan-500",
          focusBorder: "focus:border-cyan-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]",
        };
      case "purple":
      default:
        return {
          text: "text-purple-400",
          bg10: "bg-purple-500/10",
          border30: "border-purple-500/30",
          bg600: "bg-purple-600",
          bgHover: "hover:bg-purple-500",
          via: "via-purple-500/20",
          peerChecked: "peer-checked:bg-purple-500",
          focusBorder: "focus:border-purple-500/50",
          shadowBtn: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
          shadowBtnHover: "hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]",
          shadowInset: "shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]",
        };
    }
  };
  const tc = getThemeClasses(accentColor);

  return (
    <form
      onSubmit={onSave}
      className="space-y-6 animate-in fade-in duration-300 text-left pb-32"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className={`w-6 h-6 ${tc.text}`} />
            Global Preferences
          </h2>
          <p className="text-sm text-neutral-400 font-medium">
            Customize your workflow, appearance, and alerts.
          </p>
        </div>
        <button
          type="submit"
          className={`px-6 py-2.5 ${tc.bg600} ${tc.bgHover} text-white font-bold rounded-xl text-sm transition-all ${tc.shadowBtn} ${tc.shadowBtnHover} active:scale-95 duration-200`}
        >
          Save Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* APPEARANCE & THEME */}
          <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
            <div
              className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
            />

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className={`w-5 h-5 ${tc.text}`} />
                Appearance & Theme
              </h3>
              <p className="text-xs text-neutral-400 font-semibold">
                Customize the visual experience of your workspace
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Base Theme
              </h4>
              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 ${themeMode === "light" ? "bg-amber-500/10 text-amber-500" : "bg-purple-500/10 text-purple-400"} rounded-lg`}>
                    {themeMode === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Dark / Light Mode
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      {themeMode === "dark" ? "Dark mode active" : "Light mode active"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleThemeMode}
                  title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className={`relative inline-flex items-center w-14 h-7 rounded-full border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
                    themeMode === "light"
                      ? "bg-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                      : "bg-neutral-800 border-neutral-700"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                      themeMode === "light"
                        ? "translate-x-7 bg-white"
                        : "translate-x-1 bg-neutral-600"
                    }`}
                  >
                    {themeMode === "light" ? (
                      <Sun className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Moon className="h-3 w-3 text-neutral-300" />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Accent Color
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setAccentColor(color.id)}
                    className={`relative group aspect-square rounded-2xl flex items-center justify-center border transition-all ${
                      accentColor === color.id
                        ? "border-white/20 bg-white/5 shadow-xl"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        accentColor === color.id ? color.shadow : ""
                      } transition-shadow`}
                    />
                    {accentColor === color.id && (
                      <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 font-semibold italic">
                Note: App-wide color theming will be fully implemented in a
                future update.
              </p>
            </div>

            {/* NEW APPEARANCE SETTINGS */}
            {setFontScale && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Typography Scale
                </h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFontScale("small")}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      fontScale === "small"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text} shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Small
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale("medium")}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                      fontScale === "medium"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text} shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontScale("large")}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-base font-bold transition-all ${
                      fontScale === "large"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text} shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>
            )}

            {setCornerRadius && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Corner Radius
                </h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCornerRadius("sharp")}
                    className={`flex-1 py-3 border flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-sm ${
                      cornerRadius === "sharp"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text}`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Sharp
                  </button>
                  <button
                    type="button"
                    onClick={() => setCornerRadius("rounded")}
                    className={`flex-1 py-3 border flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-xl ${
                      cornerRadius === "rounded"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text}`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Rounded
                  </button>
                  <button
                    type="button"
                    onClick={() => setCornerRadius("pill")}
                    className={`flex-1 py-3 border flex items-center justify-center gap-2 text-xs font-bold transition-all rounded-full ${
                      cornerRadius === "pill"
                        ? `bg-purple-500/10 border-purple-500/30 ${tc.text}`
                        : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Soft
                  </button>
                </div>
              </div>
            )}

            {setReduceMotion && (
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 bg-purple-500/10 rounded-lg ${tc.text}`}>
                      <ZapOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Reduce Motion
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Disable UI animations and transitions.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={reduceMotion}
                      onChange={() => setReduceMotion(!reduceMotion)}
                    />
                    <div
                      className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                    ></div>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* NOTIFICATION PREFERENCES */}
          <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
            <div
              className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
            />

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className={`w-5 h-5 ${tc.text}`} />
                Communication Preferences
              </h3>
              <p className="text-xs text-neutral-400 font-semibold">
                Manage how and when Sonikoma contacts you
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 shrink-0 p-2 bg-purple-500/10 rounded-lg ${tc.text}`}
                  >
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      Newsletter & Updates
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Get the latest features, tips, and comic creation
                      workflows.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.newsletter}
                    onChange={() =>
                      handleToggle(setNotifications, "newsletter")
                    }
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Product Updates
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Be the first to know when new AI models or pipeline tools
                      drop.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.productUpdates}
                    onChange={() =>
                      handleToggle(setNotifications, "productUpdates")
                    }
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Security Alerts
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Receive emails for new logins and critical account
                      changes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                    Required
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed opacity-75">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.securityAlerts}
                      disabled
                    />
                    <div className="w-9 h-5 bg-emerald-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Billing & Receipts
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Monthly invoices and credit package purchase
                      confirmations.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                    Required
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed opacity-75">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications.billingReceipts}
                      disabled
                    />
                    <div className="w-9 h-5 bg-emerald-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Browser Push Notifications
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Get desktop alerts when your renders finish processing.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.pushNotifications}
                    onChange={() =>
                      handleToggle(setNotifications, "pushNotifications")
                    }
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>
            </div>
          </div>

          {/* AI & AUTOMATION DEFAULTS */}
          {ai && setAi && (
            <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
              <div
                className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
              />

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className={`w-5 h-5 ${tc.text}`} />
                  AI & Automation Defaults
                </h3>
                <p className="text-xs text-neutral-400 font-semibold">
                  Set default behaviors for LLMs and automated tools
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-2 bg-purple-500/10 rounded-lg ${tc.text}`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Default AI Model
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Used for automatic text summarization and script
                        generation.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={ai.defaultModel}
                      onChange={(e) =>
                        handleSelect(setAi, "defaultModel", e.target.value)
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="gemini-1.5-flash">
                        Gemini 1.5 Flash (Fast)
                      </option>
                      <option value="gemini-1.5-pro">
                        Gemini 1.5 Pro (Quality)
                      </option>
                      <option value="gpt-4o">GPT-4o</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 p-2 bg-blue-500/10 rounded-lg text-blue-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        Default TTS Voice
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        The primary voice used when generating Text-to-Speech
                        audio.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={ai.defaultVoice}
                      onChange={(e) =>
                        handleSelect(setAi, "defaultVoice", e.target.value)
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="google-tts-en-US-Standard-D">
                        Google US Standard D
                      </option>
                      <option value="google-tts-en-GB-Standard-A">
                        Google UK Standard A
                      </option>
                      <option value="elevenlabs-rachel">
                        ElevenLabs Rachel
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <Crop className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        Auto-Crop Sensitivity
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Tolerance level for automatic panel detection and
                        slicing.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={ai.autoCropSensitivity}
                      onChange={(e) =>
                        handleSelect(
                          setAi,
                          "autoCropSensitivity",
                          e.target.value
                        )
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="low">Low (Fewer panels)</option>
                      <option value="medium">Medium (Recommended)</option>
                      <option value="high">High (More panels)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* WORKSPACE ENVIRONMENT */}
          <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
            <div
              className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
            />

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MonitorPlay className={`w-5 h-5 ${tc.text}`} />
                Workspace Environment
              </h3>
              <p className="text-xs text-neutral-400 font-semibold">
                Optimize canvas rendering and memory handling
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      Hardware Acceleration
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Use GPU to render webtoon panels in real-time. Turn off if
                      experiencing lag.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={workspace.hardwareAcceleration}
                    onChange={() =>
                      handleToggle(setWorkspace, "hardwareAcceleration")
                    }
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 bg-purple-500/10 rounded-lg ${tc.text}`}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Compact Mode
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Reduces padding and shrinks UI elements to fit more panels
                      on screen.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={workspace.compactMode}
                    onChange={() => handleToggle(setWorkspace, "compactMode")}
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Auto-Save Interval
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      How often projects synchronize with cloud storage
                      automatically.
                    </p>
                  </div>
                </div>
                <div className="w-full">
                  <select
                    value={workspace.autoSaveInterval}
                    onChange={(e) =>
                      handleSelect(
                        setWorkspace,
                        "autoSaveInterval",
                        e.target.value
                      )
                    }
                    className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                  >
                    <option value="1m">Every 1 min</option>
                    <option value="5m">Every 5 mins</option>
                    <option value="10m">Every 10 mins</option>
                    <option value="off">Off (Manual)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* PRIVACY & DATA */}
          <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
            <div
              className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
            />

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className={`w-5 h-5 ${tc.text}`} />
                Privacy & Data Options
              </h3>
              <p className="text-xs text-neutral-400 font-semibold">
                Control what you share and how data is utilized
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      Public Creator Profile
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Allow others to view your profile and public project
                      gallery.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacy.publicProfile}
                    onChange={() => handleToggle(setPrivacy, "publicProfile")}
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Analytics Telemetry
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Share anonymized app usage data to help us improve the
                      platform.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={privacy.analyticsTelemetry}
                    onChange={() =>
                      handleToggle(setPrivacy, "analyticsTelemetry")
                    }
                  />
                  <div
                    className={`w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${tc.peerChecked}`}
                  ></div>
                </label>
              </div>
            </div>
          </div>

          {/* EXPORT SETTINGS */}
          {exportSettings && setExportSettings && (
            <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-6">
              <div
                className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${tc.via} to-transparent`}
              />

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileVideo className={`w-5 h-5 ${tc.text}`} />
                  Export Settings
                </h3>
                <p className="text-xs text-neutral-400 font-semibold">
                  Set default formats and quality for rendered videos
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Default Resolution
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Resolution used when rendering final MP4 videos.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={exportSettings.resolution}
                      onChange={(e) =>
                        handleSelect(
                          setExportSettings,
                          "resolution",
                          e.target.value
                        )
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="4k">4K Ultra HD</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 p-2 bg-rose-500/10 rounded-lg text-rose-400">
                      <Clapperboard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        Default Framerate
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        Frames per second for motion transitions and video.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={exportSettings.framerate}
                      onChange={(e) =>
                        handleSelect(
                          setExportSettings,
                          "framerate",
                          e.target.value
                        )
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="24fps">24 FPS (Cinematic)</option>
                      <option value="30fps">30 FPS (Standard)</option>
                      <option value="60fps">60 FPS (Smooth)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 p-2 bg-amber-500/10 rounded-lg text-amber-400">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">
                        Audio Format
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                        File format for exported project audio tracks.
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <select
                      value={exportSettings.audioFormat}
                      onChange={(e) =>
                        handleSelect(
                          setExportSettings,
                          "audioFormat",
                          e.target.value
                        )
                      }
                      className={`w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:outline-none ${tc.focusBorder}`}
                    >
                      <option value="mp3">MP3 (Compressed)</option>
                      <option value="wav">WAV (Lossless)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end mt-4">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-in fade-in slide-in-from-right-4 duration-300">
            All preferences saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}
