import React, { useMemo } from "react";
import { getUserAvatarUrl, DEFAULT_USER_AVATAR_DATA_URI } from "@/shared/utils/avatar";
import {
  User,
  FolderGit2,
  BarChart3,
  CreditCard,
  Key,
  Settings,
  ShieldCheck,
  LogOut,
  Home,
  Sparkles,
  Zap,
  Award,
  Flame,
  ChevronRight,
  Camera,
  Globe,
} from "lucide-react";

import {
  ProfileAccountTab,
  ProfileAnalyticsTab,
  ProfileApiTab,
  ProfileBillingTab,
  ProfilePreferencesTab,
  ProfileSecurityTab,
} from "../components";

import {
  useProfileState,
  ProfileTabId,
} from "../hooks/useProfileState";

export interface ProfilePageProps {
  user?: any;
  projects?: any[];
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onRefreshUser?: () => void | Promise<void>;
  themeMode?: any;
  toggleThemeMode?: () => void;
  navigateTo?: (path: string) => void;
  addNotification?: (
    msg: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  fetchWithInterceptor?: any;
  initialTab?: string;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

export default function ProfilePage(props: ProfilePageProps) {
  const {
    user,
    onLogout,
    onNavigateHome,
    themeMode,
    toggleThemeMode,
    navigateTo,
    selectedModel,
    setSelectedModel,
    fetchWithInterceptor,
  } = props;

  const state = useProfileState(props);
  const [privacy, setPrivacy] = React.useState({
    analyticsTelemetry: true,
    publicProfile: false,
  });

  const tabsList = useMemo(
    () => [
      { id: "account" as ProfileTabId, label: "Account", icon: User, badge: null },
      { id: "analytics" as ProfileTabId, label: "Analytics", icon: BarChart3, badge: null },
      {
        id: "billing" as ProfileTabId,
        label: "Billing & Credits",
        icon: CreditCard,
        badge: `${state.userCredits} CR`,
      },
      {
        id: "api" as ProfileTabId,
        label: "API Keys",
        icon: Key,
        badge: state.apiTokens.length > 0 ? state.apiTokens.length : null,
      },
      { id: "preferences" as ProfileTabId, label: "Preferences", icon: Settings, badge: null },
      { id: "security" as ProfileTabId, label: "Security", icon: ShieldCheck, badge: null },
    ],
    [state.projectsList.length, state.userCredits, state.apiTokens.length]
  );

  return (
    <div className="w-full min-h-screen bg-[#07070a] text-white flex flex-col font-sans selection:bg-purple-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-purple-900/15 via-indigo-900/10 to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col space-y-6">
        {/* Compact Breadcrumb & Quick Actions Bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-purple-400 font-semibold">User Profile & Settings</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Compact Glassmorphic Hero Banner */}
        <div className="relative w-full rounded-2xl border border-white/10 bg-[#0c0c12]/90 backdrop-blur-md p-4 sm:p-5 shadow-xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-70" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* User Profile Block */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-0.5 bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-md overflow-hidden shrink-0">
                  <img
                    src={state.profileUser.avatarUrl}
                    alt={state.profileUser.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-[10px] bg-neutral-900"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = DEFAULT_USER_AVATAR_DATA_URI;
                    }}
                  />
                </div>
                <button
                  onClick={() => state.setActiveTab("account")}
                  title="Edit Avatar"
                  className="absolute -bottom-1 -right-1 p-1 rounded-md bg-neutral-900 border border-white/20 text-purple-400 hover:text-white transition-all shadow-xs"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {state.profileUser.fullName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {state.subscriptionTier}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  {state.profileUser.email}
                </p>
                <p className="text-[11px] text-neutral-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-purple-400" />
                  <span>{state.profileUser.role}</span>
                </p>
              </div>
            </div>

            {/* Compact Quick Stats Pills */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 font-mono">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Credits</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  {state.userCredits} <span className="text-[10px] text-purple-400 font-normal">CR</span>
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 font-mono">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>Streak</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  {state.streakDays}d
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 font-mono">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>XP</span>
                </div>
                <p className="text-sm font-bold text-white mt-0.5">
                  {state.achievementPoints}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Reward Alert Banner */}
          {!state.hasClaimedToday && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 bg-purple-950/20 border border-purple-500/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <span className="text-neutral-200">
                  Daily Bonus Ready: Claim +25 free credits today!
                </span>
              </div>
              <button
                onClick={state.handleClaimCredits}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>Claim</span>
              </button>
            </div>
          )}
        </div>

        {/* Sleek Navigation Bar */}
        <div className="w-full border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 min-w-max">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = state.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => state.setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 ${isActive
                      ? "bg-purple-600/20 text-white border border-purple-500/40 shadow-sm font-bold"
                      : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? "text-purple-400" : "text-neutral-500"
                      }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive
                          ? "bg-purple-500/30 text-purple-200 border border-purple-500/30"
                          : "bg-white/10 text-neutral-400"
                        }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Canvas Area */}
        <div className="w-full flex-1 pb-8">
          {state.activeTab === "account" && (
            <ProfileAccountTab
              user={user}
              profileUser={state.profileUser}
              setProfileUser={state.setProfileUser}
              handleProfileSave={state.handleProfileSave}
              saveSuccess={state.saveSuccess}
              connections={state.connections}
              setConnections={state.setConnections}
              achievementPoints={state.achievementPoints}
              setAchievementPoints={state.setAchievementPoints}
              unlockedRewards={state.unlockedRewards}
              setUnlockedRewards={state.setUnlockedRewards}
              unlockedAchievements={state.unlockedAchievements}
              onRedeemReward={state.handleRedeemReward}
            />
          )}

          {state.activeTab === "analytics" && <ProfileAnalyticsTab />}

          {state.activeTab === "billing" && (
            <ProfileBillingTab
              credits={state.userCredits}
              hasClaimedToday={state.hasClaimedToday}
              handleClaimCredits={state.handleClaimCredits}
              claimNotification={state.claimNotification}
              invoices={state.invoices}
              streakDays={state.streakDays}
              subscriptionTier={state.subscriptionTier}
              cardInfo={state.cardInfo}
              onUpdateCard={state.handleUpdateCard}
              onUpgradePlan={state.handleUpgradePlan}
              onPurchaseCredits={state.handlePurchaseCredits}
            />
          )}

          {state.activeTab === "api" && (
            <ProfileApiTab
              apiTokens={state.apiTokens}
              newTokenName={state.newTokenName}
              setNewTokenName={state.setNewTokenName}
              handleGenerateToken={state.handleGenerateToken}
              tokenToast={state.tokenToast}
              handleCopyToastKey={state.handleCopyToastKey}
              handleDeleteToken={state.handleDeleteToken}
            />
          )}

          {state.activeTab === "preferences" && (
            <ProfilePreferencesTab
              notifications={state.notifications}
              setNotifications={state.setNotifications}
              workspace={state.workspace}
              setWorkspace={state.setWorkspace}
              privacy={privacy}
              setPrivacy={setPrivacy}
              theme={themeMode || "obsidian"}
              setTheme={toggleThemeMode || (() => { })}
              themeMode={themeMode}
              toggleThemeMode={toggleThemeMode}
              isSaving={false}
              onSavePreferences={state.handleSavePreferences}
              saveSuccess={state.prefSaveSuccess}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          )}

          {state.activeTab === "security" && (
            <ProfileSecurityTab
              passwordState={state.passwordState}
              setPasswordState={state.setPasswordState}
              handlePasswordSave={state.handlePasswordSave}
              passwordSuccess={state.passwordSuccess}
              passwordError={state.passwordError}
              sessions={state.sessions}
              handleTerminateSession={state.handleTerminateSession}
              is2faEnabled={state.is2faEnabled}
              handleToggleMfa={state.handleToggleMfa}
              onExportData={state.handleExportData}
              onDeleteAccount={state.handleDeleteAccountConfirm}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}
        </div>
      </div>
    </div>
  );
}
