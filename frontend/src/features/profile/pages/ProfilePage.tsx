import React, { useMemo } from "react";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import {
  User,
  FolderGit2,
  BarChart3,
  CreditCard,
  ShieldCheck,
  LogOut,
  Home,
  Sparkles,
  Zap,
  Award,
  Flame,
  ChevronRight,
  Globe,
  Pencil,
} from "lucide-react";

import {
  ProfileAccountTab,
  ProfileAnalyticsTab,
  ProfileBillingTab,
  ProfileSecurityTab,
} from "../components";

import { useProfileState, ProfileTabId } from "../hooks/useProfileState";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import {
  ConfirmModal,
  GoodbyeUserModal,
  ComeBackUserModal,
} from "@/shared/ui/modal";

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
  // Stage 1 Confirmation Modal states
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    React.useState(false);

  // Stage 2 User Lifecycle Modal states
  const [showComeBackModal, setShowComeBackModal] = React.useState(false);
  const [showGoodbyeModal, setShowGoodbyeModal] = React.useState(false);

  const [privacy, setPrivacy] = React.useState({
    analyticsTelemetry: true,
    publicProfile: false,
  });

  // Flow 1: Sign Out / Log Out
  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleAcceptSignOutConfirm = () => {
    setShowSignOutConfirm(false);
    setShowComeBackModal(true);
  };

  const handleFinalSignOut = () => {
    setShowComeBackModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Flow 2: Delete Account
  const handleDeleteAccountRequest = () => {
    setShowDeleteAccountConfirm(true);
  };

  const handleAcceptDeleteAccountConfirm = () => {
    setShowDeleteAccountConfirm(false);
    setShowGoodbyeModal(true);
  };

  const handleFinalDeleteAccount = async () => {
    setShowGoodbyeModal(false);
    await state.handleDeleteAccountConfirm(true);
  };

  const tabsList = useMemo(
    () => [
      {
        id: "account" as ProfileTabId,
        label: "Account",
        icon: User,
        badge: null,
      },
      {
        id: "analytics" as ProfileTabId,
        label: "Analytics",
        icon: BarChart3,
        badge: null,
      },
      {
        id: "billing" as ProfileTabId,
        label: "Billing & Credits",
        icon: CreditCard,
        badge: `${state.userCredits} CR`,
      },
      {
        id: "security" as ProfileTabId,
        label: "Security",
        icon: ShieldCheck,
        badge: null,
      },
    ],
    [state.projectsList.length, state.userCredits, state.apiTokens.length]
  );

  return (
    <div className="w-full flex-1 text-[#E5E5E5] flex flex-col font-sans py-4 sm:py-6 max-w-7xl mx-auto animate-fade-in text-left">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-7 relative overflow-hidden text-left">
        {/* Compact Breadcrumb & Quick Actions Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3.5">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Tooltip text="Return to Main Dashboard" placement="bottom">
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer text-neutral-400 shadow-sm"
                aria-label="Dashboard Home"
              >
                <Home className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Dashboard</span>
              </button>
            </Tooltip>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="px-2.5 py-1 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA] font-bold">
              User Profile & Settings
            </span>
          </div>

          {onLogout && (
            <Tooltip text="Safely sign out of your creator session" placement="bottom">
              <button
                onClick={handleSignOutClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-rose-500/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-400 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Premium Glassmorphic Hero Banner */}
        <div className="relative w-full rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/90 via-neutral-900/50 to-neutral-950 p-5 sm:p-6 shadow-xl overflow-hidden">
          {/* Subtle top ambient glow line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/40 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* User Profile Identity Block */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative group shrink-0">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-neutral-700/80 bg-neutral-900 shadow-sm sm:h-20 sm:w-20">
                  <img
                    src={state.profileUser.avatarUrl}
                    alt={state.profileUser.fullName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-2xl object-cover bg-neutral-900"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = DEFAULT_USER_AVATAR_DATA_URI;
                    }}
                  />
                </div>
                <Tooltip text="Change avatar image" placement="top">
                  <button
                    onClick={() => state.setActiveTab("account")}
                    aria-label="Edit Avatar"
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-[#111827] text-neutral-200 shadow-[0_0_0_2px_rgba(17,24,39,1)] transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white cursor-pointer sm:h-7 sm:w-7"
                  >
                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </Tooltip>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                    {state.profileUser.fullName || "Creator"}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider uppercase font-bold bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                    {state.subscriptionTier || "Free"} Tier
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono flex-wrap">
                  <span className="text-neutral-300 font-medium">
                    {state.profileUser.email}
                  </span>
                  <span className="text-neutral-700">•</span>
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <Globe className="w-3 h-3 text-[#3B82F6]" />
                    <span className="capitalize">{state.profileUser.role || "Creator"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              {/* CREDITS CARD */}
              <div className="bg-neutral-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-xl px-3.5 py-2.5 transition-all text-left min-w-[90px] shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span>Credits</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 font-mono flex items-baseline gap-1">
                  {state.userCredits}
                  <span className="text-[10px] text-amber-400 font-normal">CR</span>
                </p>
              </div>

              {/* STREAK CARD */}
              <div className="bg-neutral-950/80 border border-rose-500/20 hover:border-rose-500/40 rounded-xl px-3.5 py-2.5 transition-all text-left min-w-[90px] shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  <span>Streak</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 font-mono flex items-baseline gap-1">
                  {state.streakDays}
                  <span className="text-[10px] text-rose-400 font-normal">d</span>
                </p>
              </div>

              {/* XP CARD */}
              <div className="bg-neutral-950/80 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl px-3.5 py-2.5 transition-all text-left min-w-[90px] shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XP</span>
                </div>
                <p className="text-base sm:text-lg font-black text-white mt-0.5 font-mono flex items-baseline gap-1">
                  {state.achievementPoints}
                  <span className="text-[10px] text-emerald-400 font-normal">pts</span>
                </p>
              </div>
            </div>
          </div>

          {/* Daily Reward Alert Banner */}
          {!state.hasClaimedToday && (
            <div className="mt-4 pt-3.5 border-t border-neutral-800 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-neutral-950 to-neutral-950 border border-amber-500/20 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2.5 text-xs">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse shrink-0 fill-amber-400/20" />
                <span className="text-neutral-200 font-medium">
                  Daily Creator Bonus: <strong className="text-white">+25 free credits</strong> waiting for today!
                </span>
              </div>
              <Tooltip text="Claim daily login bonus" placement="top">
                <button
                  onClick={state.handleClaimCredits}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer shadow-md shadow-amber-500/20 transition-all"
                  aria-label="Claim Daily Credits"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Claim</span>
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Modern Segmented Navigation Bar */}
        <div className="w-full">
          <div className="bg-neutral-950/90 p-1.5 rounded-2xl border border-neutral-800/90 inline-flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = state.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => state.setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30 font-bold"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-white" : "text-neutral-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
              user={user}
              fetchWithInterceptor={fetchWithInterceptor}
              addNotification={props.addNotification}
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
              onDeleteAccount={handleDeleteAccountRequest}
              fetchWithInterceptor={fetchWithInterceptor}
            />
          )}
        </div>
      </div>

      {/* STAGE 1: Confirmation Modal when clicking "Log Out" / "Sign Out" */}
      {showSignOutConfirm && (
        <ConfirmModal
          title="Sign Out Confirmation"
          message="Are you sure you want to sign out of your Sonikoma account?"
          accentColor="blue"
          onConfirm={handleAcceptSignOutConfirm}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}

      {/* STAGE 2: Come Back Lifecycle Modal on Sign Out */}
      <ComeBackUserModal
        isOpen={showComeBackModal}
        username={user?.full_name || state?.profileUser?.fullName || undefined}
        title="Leaving Sonikoma?"
        message="You are signing out. Your studio projects, custom assets, and workspace configuration are safely stored. We look forward to seeing you back soon!"
        confirmText="Confirm Sign Out"
        cancelText="Stay Signed In"
        onConfirm={handleFinalSignOut}
        onCancel={() => setShowComeBackModal(false)}
      />

      {/* STAGE 1: Confirmation Modal when clicking "Delete Account" */}
      {showDeleteAccountConfirm && (
        <ConfirmModal
          title="Delete Account Confirmation"
          message="Are you sure you want to delete your account? This action will erase your data and cannot be undone."
          accentColor="red"
          onConfirm={handleAcceptDeleteAccountConfirm}
          onCancel={() => setShowDeleteAccountConfirm(false)}
        />
      )}

      {/* STAGE 2: Goodbye Farewell Lifecycle Modal on Account Deletion */}
      <GoodbyeUserModal
        isOpen={showGoodbyeModal}
        username={user?.full_name || state?.profileUser?.fullName || undefined}
        title="Account Deleted"
        message="Your account deletion process is complete. All projects, generated videos, assets, and subscription history have been permanently erased."
        confirmText="Return Home"
        cancelText="Close"
        onConfirm={handleFinalDeleteAccount}
        onCancel={() => setShowGoodbyeModal(false)}
      />
    </div>
  );
}
