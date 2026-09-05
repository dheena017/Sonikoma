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
  Camera,
  Globe,
} from "lucide-react";

import {
  ProfileAccountTab,
  ProfileAnalyticsTab,
  ProfileBillingTab,
  ProfileSecurityTab,
} from "../components";

import { useProfileState, ProfileTabId } from "../hooks/useProfileState";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { ConfirmModal, GoodbyeUserModal, ComeBackUserModal } from "@/shared/ui/modal";

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
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = React.useState(false);

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
        <div className="flex items-center justify-between border-b border-[#2F2F2F] pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
            <Tooltip text="Return to Main Dashboard" placement="bottom">
              <button
                onClick={onNavigateHome}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                aria-label="Dashboard Home"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </Tooltip>
            <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-[#3B82F6] font-semibold">
              User Profile & Settings
            </span>
          </div>

          {onLogout && (
            <Tooltip text="Log out of your account" placement="bottom">
              <button
                onClick={handleSignOutClick}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 text-xs font-medium transition-all cursor-pointer"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Compact Glassmorphic Hero Banner */}
        <div className="relative w-full rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-4 sm:p-5 shadow-md overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* User Profile Block */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl p-0.5 bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 shadow-md overflow-hidden shrink-0">
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
                  <Tooltip text="Change avatar in Account settings" placement="top">
                    <button
                      onClick={() => state.setActiveTab("account")}
                      aria-label="Edit Avatar"
                      className="!absolute !top-auto bottom-1 right-1 !z-10 p-1.5 rounded-lg bg-neutral-950/95 border border-white/30 text-[#60A5FA] hover:text-white transition-all shadow-md cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E5E5E5]">
                    {state.profileUser.fullName}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-[#121212] text-[#3B82F6] border border-[#3B82F6]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                    {state.subscriptionTier}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] font-mono">
                  {state.profileUser.email}
                </p>
                <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#3B82F6]" />
                  <span>{state.profileUser.role}</span>
                </p>
              </div>
            </div>

            {/* Compact Quick Stats Pills */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-[#9CA3AF] font-mono">
                  <Zap className="w-3 h-3 text-[#F59E0B]" />
                  <span>Credits</span>
                </div>
                <p className="text-sm font-bold text-[#E5E5E5] mt-0.5 font-mono">
                  {state.userCredits}{" "}
                  <span className="text-[10px] text-[#3B82F6] font-normal">
                    CR
                  </span>
                </p>
              </div>

              <div className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-[#9CA3AF] font-mono">
                  <Flame className="w-3 h-3 text-[#EF4444]" />
                  <span>Streak</span>
                </div>
                <p className="text-sm font-bold text-[#E5E5E5] mt-0.5 font-mono">
                  {state.streakDays}d
                </p>
              </div>

              <div className="bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-1.5 text-center min-w-[75px]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-[#9CA3AF] font-mono">
                  <Award className="w-3 h-3 text-[#10B981]" />
                  <span>XP</span>
                </div>
                <p className="text-sm font-bold text-[#E5E5E5] mt-0.5 font-mono">
                  {state.achievementPoints}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Reward Alert Banner */}
          {!state.hasClaimedToday && (
            <div className="mt-3 pt-3 border-t border-[#2F2F2F] flex items-center justify-between gap-2 bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <Flame className="w-4 h-4 text-[#F59E0B] animate-pulse shrink-0" />
                <span className="text-[#E5E5E5]">
                  Daily Bonus Ready: Claim +25 free credits today!
                </span>
              </div>
              <Tooltip text="Claim daily login bonus" placement="top">
                <button
                  onClick={state.handleClaimCredits}
                  className="btn-primary px-3 py-1 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                  aria-label="Claim Daily Credits"
                >
                  <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                  <span>Claim</span>
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Sleek Navigation Bar */}
        <div className="w-full border-b border-[#2F2F2F] pb-1 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 min-w-max">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = state.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => state.setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm font-bold"
                      : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#262626] border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#121212] text-[#9CA3AF] border border-[#2F2F2F]"
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
