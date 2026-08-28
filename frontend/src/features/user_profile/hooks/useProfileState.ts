import { useState, useEffect, useCallback } from "react";
import {
  updateProfile,
  updatePassword,
  getSessions,
  terminateSession,
  claimCredits,
  upgradePlan,
  saveCard,
  purchaseCredits,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  updateMfa,
  redeemReward,
  deleteAccount,
  getInvoices,
} from "@/api/endpoints/auth";
import { getProjects, deleteProject } from "@/api/endpoints/projects";
import { getUserAvatarUrl } from "@/shared/utils/avatar";

export type ProfileTabId =
  | "account"
  | "projects"
  | "analytics"
  | "billing"
  | "security";

export interface UseProfileStateOptions {
  user?: any;
  projects?: any[];
  onLogout?: () => void;
  onRefreshUser?: () => void | Promise<void>;
  navigateTo?: (path: string) => void;
  addNotification?: (
    msg: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  fetchWithInterceptor?: any;
  initialTab?: string;
}

export function useProfileState({
  user,
  projects: initialProjects = [],
  onLogout,
  onRefreshUser,
  addNotification,
  fetchWithInterceptor,
  initialTab = "account",
}: UseProfileStateOptions) {
  // Parse initial tab from URL query params
  const getInitialTab = (): ProfileTabId => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab")?.toLowerCase() as ProfileTabId;
      const validTabs: ProfileTabId[] = [
        "account",
        "projects",
        "analytics",
        "billing",
        "security",
      ];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam;
      }
    } catch (e) {
      // Fallback
    }
    return (initialTab as ProfileTabId) || "account";
  };

  const [activeTab, setActiveTab] = useState<ProfileTabId>(getInitialTab);

  // Sync tab change with browser URL
  const handleTabChange = useCallback((tab: ProfileTabId) => {
    setActiveTab(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab")?.toLowerCase() as ProfileTabId;
      if (
        tabParam &&
        [
          "account",
          "projects",
          "analytics",
          "billing",
          "preferences",
          "security",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // --- Real Account Tab Data ---
  const [profileUser, setProfileUser] = useState({
    fullName: user?.full_name || user?.name || "",
    email: user?.email || "",
    avatarUrl: getUserAvatarUrl(user),
    role: user?.creator_role || "Creator",
    bio: user?.bio || "",
    newsletter: user?.newsletter === 1 || user?.newsletter === true,
    language: user?.language || "en",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connections, setConnections] = useState(
    user?.social_connections || { google: true, discord: false }
  );
  const [achievementPoints, setAchievementPoints] = useState<number>(
    user?.achievement_points ?? 0
  );
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>(
    user?.unlocked_rewards || []
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    user?.unlocked_achievements || []
  );
  const [portfolios, setPortfolios] = useState<
    { id: string; site: string; url: string }[]
  >(user?.portfolio_links || []);

  useEffect(() => {
    if (user) {
      setProfileUser((prev) => ({
        ...prev,
        fullName: user.full_name || user.name || prev.fullName,
        email: user.email || prev.email,
        avatarUrl: getUserAvatarUrl(user),
        role: user.creator_role || prev.role,
        bio: user.bio || prev.bio,
        newsletter: user.newsletter === 1 || user.newsletter === true,
        language: user.language || prev.language,
      }));
      if (typeof user.achievement_points === "number") {
        setAchievementPoints(user.achievement_points);
      }
      if (Array.isArray(user.unlocked_rewards)) {
        setUnlockedRewards(user.unlocked_rewards);
      }
      if (Array.isArray(user.unlocked_achievements)) {
        setUnlockedAchievements(user.unlocked_achievements);
      }
      if (Array.isArray(user.portfolio_links)) {
        setPortfolios(user.portfolio_links);
      }
      if (user.social_connections) {
        setConnections(user.social_connections);
      }
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (fetchWithInterceptor) {
        const payload = {
          full_name: profileUser.fullName,
          avatar_url: profileUser.avatarUrl,
          creator_role: profileUser.role,
          bio: profileUser.bio,
          language: profileUser.language,
          newsletter: profileUser.newsletter,
          portfolio_links: portfolios,
          social_connections: connections,
        };
        const res = await updateProfile(fetchWithInterceptor, payload);
        if (res && (res.success || res.message)) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          addNotification?.("Profile updated successfully", "success");
          if (onRefreshUser) await onRefreshUser();
          return;
        }
      }
    } catch (err: any) {
      addNotification?.(err?.message || "Failed to update profile", "error");
    }
  };

  const handleRedeemReward = async (
    cost: number,
    type: string,
    value: string
  ): Promise<boolean> => {
    if (achievementPoints < cost) {
      addNotification?.("Insufficient XP points for this reward", "warning");
      return false;
    }
    try {
      if (fetchWithInterceptor) {
        const res = await redeemReward(fetchWithInterceptor, {
          cost,
          reward_type: type,
          reward_value: value,
        });
        if (res && res.success) {
          setAchievementPoints((prev) => prev - cost);
          setUnlockedRewards((prev) => [...prev, `${type}_${value}`]);
          addNotification?.("Reward redeemed successfully!", "success");
          if (onRefreshUser) await onRefreshUser();
          return true;
        }
      }
      return false;
    } catch (err: any) {
      addNotification?.(err?.message || "Redemption failed", "error");
      return false;
    }
  };

  // --- Real Projects Tab Data ---
  const [projectsList, setProjectsList] = useState<any[]>(initialProjects);

  const fetchProjects = useCallback(async () => {
    if (!fetchWithInterceptor) return;
    try {
      const data = await getProjects(fetchWithInterceptor);
      if (Array.isArray(data)) {
        setProjectsList(data);
      } else if (data && Array.isArray((data as any).projects)) {
        setProjectsList((data as any).projects);
      }
    } catch (err) {
      // Keep existing list
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleBatchDeleteProjects = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      if (fetchWithInterceptor) {
        await Promise.all(
          ids.map((id) => deleteProject(fetchWithInterceptor, id))
        );
        addNotification?.(
          `Successfully deleted ${ids.length} project(s)`,
          "success"
        );
        fetchProjects();
      }
    } catch (err: any) {
      addNotification?.("Failed to delete selected projects", "error");
    }
  };

  // --- Real Billing Tab Data ---
  const [userCredits, setUserCredits] = useState<number>(user?.credits ?? 0);
  const [streakDays, setStreakDays] = useState<number>(user?.streak_days ?? 1);
  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(
    user?.has_claimed_today ?? user?.claimed_today ?? false
  );
  const [claimNotification, setClaimNotification] = useState<boolean>(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>(
    user?.subscription_tier || "Free"
  );
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cardInfo, setCardInfo] = useState({
    cardHolder: user?.full_name || "",
    cardNo: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const fetchInvoicesList = useCallback(async () => {
    if (!fetchWithInterceptor) return;
    try {
      const res = await getInvoices(fetchWithInterceptor);
      if (res && res.success && Array.isArray(res.invoices)) {
        setInvoices(res.invoices);
      }
    } catch (e) {
      // Ignore
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    fetchInvoicesList();
  }, [fetchInvoicesList]);

  useEffect(() => {
    if (user) {
      setUserCredits(user.credits ?? 0);
      setStreakDays(user.streak_days ?? 1);
      setHasClaimedToday(user.has_claimed_today ?? user.claimed_today ?? false);
      setSubscriptionTier(user.subscription_tier || "Free");
    }
  }, [user]);

  const handleClaimCredits = async () => {
    if (hasClaimedToday) {
      addNotification?.("Daily credits already claimed for today!", "info");
      return;
    }
    try {
      if (fetchWithInterceptor) {
        const res = await claimCredits(fetchWithInterceptor);
        if (res && res.success) {
          setUserCredits(res.new_balance ?? userCredits + 25);
          setHasClaimedToday(true);
          setStreakDays(res.streak_days ?? streakDays + 1);
          setClaimNotification(true);
          setTimeout(() => setClaimNotification(false), 4000);
          addNotification?.(
            res.message || "Claimed daily bonus credits!",
            "success"
          );
          if (onRefreshUser) await onRefreshUser();
          return;
        }
      }
    } catch (err: any) {
      addNotification?.(err?.message || "Failed to claim credits", "error");
    }
  };

  const handleUpgradePlan = async () => {
    try {
      if (fetchWithInterceptor) {
        const res = await upgradePlan(fetchWithInterceptor);
        if (res && res.success) {
          setSubscriptionTier("Pro Creator");
          addNotification?.("Successfully upgraded plan!", "success");
          if (onRefreshUser) await onRefreshUser();
          return;
        }
      }
    } catch (err: any) {
      addNotification?.("Failed to upgrade plan", "error");
    }
  };

  const handleUpdateCard = async (newCard: {
    cardHolder: string;
    cardNo: string;
    cardExpiry: string;
    cardCvv: string;
  }) => {
    try {
      if (fetchWithInterceptor) {
        await saveCard(fetchWithInterceptor, newCard);
      }
      setCardInfo(newCard);
      addNotification?.("Payment card details updated", "success");
    } catch (err: any) {
      addNotification?.("Failed to save card info", "error");
    }
  };

  const handlePurchaseCredits = async (
    amountCredits: number,
    priceUSD: number
  ) => {
    try {
      if (fetchWithInterceptor) {
        const res = await purchaseCredits(fetchWithInterceptor, {
          credits: amountCredits,
          price: priceUSD,
        });
        if (res && res.success) {
          setUserCredits((prev) => prev + amountCredits);
          addNotification?.(
            `Purchased +${amountCredits} credits for $${priceUSD}!`,
            "success"
          );
          if (onRefreshUser) await onRefreshUser();
          return;
        }
      }
    } catch (err: any) {
      addNotification?.("Failed to purchase credits", "error");
    }
  };

  // --- Real API Keys Tab Data ---
  const [apiTokens, setApiTokens] = useState<any[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [tokenToast, setTokenToast] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!fetchWithInterceptor) return;
    try {
      const res = await getApiKeys(fetchWithInterceptor);
      if (res && res.success && Array.isArray(res.api_keys)) {
        setApiTokens(res.api_keys);
      }
    } catch (e) {
      // Ignore
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    try {
      if (fetchWithInterceptor) {
        const res = await createApiKey(fetchWithInterceptor, {
          name: newTokenName.trim(),
        });
        if (res && res.success && res.api_key) {
          const createdKey = res.api_key;
          setApiTokens((prev) => [...prev, createdKey]);
          setTokenToast(createdKey.raw_key || createdKey.key);
          setNewTokenName("");
          addNotification?.("Studio API key generated successfully", "success");
          return;
        }
      }
    } catch (err: any) {
      addNotification?.("Failed to generate API Key", "error");
    }
  };

  const handleCopyToastKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addNotification?.("Copied API Key to clipboard!", "success");
  };

  const handleDeleteToken = async (id: string) => {
    try {
      if (fetchWithInterceptor) {
        await deleteApiKey(fetchWithInterceptor, id);
      }
      setApiTokens((prev) => prev.filter((t) => t.id !== id));
      addNotification?.("API Key revoked", "info");
    } catch (err) {
      addNotification?.("Failed to revoke API key", "error");
    }
  };

  // --- Real Preferences Tab Data ---
  const [notifications, setNotifications] = useState(
    user?.preferences?.notifications || {
      newsletter: true,
      productUpdates: true,
      securityAlerts: true,
      billingReceipts: true,
      pushNotifications: false,
    }
  );
  const [workspace, setWorkspace] = useState(
    user?.preferences?.workspace || {
      hardwareAcceleration: true,
      compactMode: false,
      autoSaveInterval: "30s",
    }
  );
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  const handleSavePreferences = async () => {
    try {
      if (fetchWithInterceptor) {
        await updateProfile(fetchWithInterceptor, {
          preferences: {
            notifications,
            workspace,
          },
        });
      }
      setPrefSaveSuccess(true);
      setTimeout(() => setPrefSaveSuccess(false), 3000);
      addNotification?.("Preferences updated successfully", "success");
    } catch (err) {
      addNotification?.("Failed to save preferences", "error");
    }
  };

  // --- Real Security Tab Data ---
  const [passwordState, setPasswordState] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [is2faEnabled, setIs2faEnabled] = useState(
    user?.mfa_enabled === 1 || user?.mfa_enabled === true
  );

  const fetchSessionsList = useCallback(async () => {
    if (!fetchWithInterceptor) return;
    try {
      const res = await getSessions(fetchWithInterceptor);
      if (res && res.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      }
    } catch (e) {
      // Ignore
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    fetchSessionsList();
  }, [fetchSessionsList]);

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!passwordState.current) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (passwordState.new.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwordState.new !== passwordState.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }
    try {
      if (fetchWithInterceptor) {
        const res = await updatePassword(fetchWithInterceptor, {
          currentPassword: passwordState.current,
          newPassword: passwordState.new,
        });
        if (res && (res.success || res.message)) {
          setPasswordSuccess(true);
          setPasswordState({ current: "", new: "", confirm: "" });
          setTimeout(() => setPasswordSuccess(false), 3000);
          addNotification?.("Password updated successfully!", "success");
          return;
        }
      }
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password");
      addNotification?.("Failed to update password", "error");
    }
  };

  const handleTerminateSession = async (id: string) => {
    try {
      if (fetchWithInterceptor) {
        await terminateSession(fetchWithInterceptor, id);
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      addNotification?.("Session terminated", "info");
    } catch (err) {
      addNotification?.("Failed to terminate session", "error");
    }
  };

  const handleToggleMfa = async (enabled: boolean): Promise<boolean> => {
    try {
      if (fetchWithInterceptor) {
        const res = await updateMfa(fetchWithInterceptor, enabled);
        if (res && res.success) {
          setIs2faEnabled(enabled);
          addNotification?.(
            `Two-Factor Authentication ${enabled ? "enabled" : "disabled"}`,
            "success"
          );
          return true;
        }
      }
      return false;
    } catch (err) {
      addNotification?.("Failed to update 2FA status", "error");
      return false;
    }
  };

  const handleExportData = () => {
    const exportObject = {
      profile: profileUser,
      credits: userCredits,
      streak: streakDays,
      projectsCount: projectsList.length,
      exportedAt: new Date().toISOString(),
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `sonikoma_user_data_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification?.("Exported user data to JSON file", "success");
  };

  const handleDeleteAccountConfirm = async () => {
    if (
      !window.confirm(
        "Are you absolutely sure you want to delete your account? This action is permanent and irreversible."
      )
    ) {
      return;
    }
    try {
      if (fetchWithInterceptor) {
        await deleteAccount(fetchWithInterceptor);
      }
      addNotification?.("Account scheduled for deletion", "warning");
      if (onLogout) onLogout();
    } catch (err) {
      addNotification?.("Failed to delete account", "error");
    }
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
    profileUser,
    setProfileUser,
    handleProfileSave,
    saveSuccess,
    connections,
    setConnections,
    achievementPoints,
    setAchievementPoints,
    unlockedRewards,
    setUnlockedRewards,
    unlockedAchievements,
    portfolios,
    setPortfolios,
    handleRedeemReward,
    projectsList,
    fetchProjects,
    handleBatchDeleteProjects,
    userCredits,
    streakDays,
    hasClaimedToday,
    claimNotification,
    subscriptionTier,
    invoices,
    cardInfo,
    handleClaimCredits,
    handleUpgradePlan,
    handleUpdateCard,
    handlePurchaseCredits,
    apiTokens,
    newTokenName,
    setNewTokenName,
    tokenToast,
    handleGenerateToken,
    handleCopyToastKey,
    handleDeleteToken,
    notifications,
    setNotifications,
    workspace,
    setWorkspace,
    prefSaveSuccess,
    handleSavePreferences,
    passwordState,
    setPasswordState,
    handlePasswordSave,
    passwordSuccess,
    passwordError,
    sessions,
    handleTerminateSession,
    is2faEnabled,
    handleToggleMfa,
    handleExportData,
    handleDeleteAccountConfirm,
  };
}
