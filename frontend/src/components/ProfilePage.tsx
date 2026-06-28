import React from "react";
import * as api from "../api/index.js";
import {
  User,
  Mail,
  Shield,
  Settings,
  LogOut,
  Camera,
  LayoutGrid,
  CreditCard,
  Key,
  Sparkles,
  BarChart3,
  Activity,
} from "lucide-react";

// Sub-components
import ProfileProjectsTab from "./profile/ProfileProjectsTab.js";
import ProfileAccountTab from "./profile/ProfileAccountTab.js";
import ProfileSecurityTab from "./profile/ProfileSecurityTab.js";
import ProfileBillingTab from "./profile/ProfileBillingTab.js";
import ProfileApiTab from "./profile/ProfileApiTab.js";
import ProfileAnalyticsTab from "./profile/ProfileAnalyticsTab.js";
import ProfilePreferencesTab from "./profile/ProfilePreferencesTab.js";

interface ProfilePageProps {
  user: any;
  projects: any[];
  onLogout: () => void;
  onNavigateHome: () => void;
  onRefreshUser?: (showDelay?: boolean) => void | Promise<void>;
  themeMode?: "dark" | "light" | string;
  toggleThemeMode?: () => void;
}

export default function ProfilePage({
  user,
  projects = [],
  onLogout,
  onNavigateHome,
  onRefreshUser,
  themeMode,
  toggleThemeMode,
}: ProfilePageProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = React.useState<string | null>(null);

  // Navigation tabs
  const [activeTab, setActiveTab] = React.useState<
    | "projects"
    | "account"
    | "security"
    | "billing"
    | "api"
    | "analytics"
    | "preferences"
    | "stats"
  >("projects");

  // Local state for profile values
  const [profileUser, setProfileUser] = React.useState({
    fullName: user?.full_name || "Sonikoma Creator",
    email: user?.email || "creator@sonikoma.com",
    avatarUrl: user?.avatar_url || "",
    role: user?.creator_role || "creator",
    bio:
      user?.bio ||
      "Comic visual director and anime fan editing high-quality cinematic stories.",
    newsletter: user?.newsletter !== undefined ? user.newsletter : true,
    language: user?.language || "en",
  });

  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Preferences State
  const [notificationPrefs, setNotificationPrefs] = React.useState({
    newsletter: true,
    productUpdates: true,
    securityAlerts: true,
    billingReceipts: true,
    pushNotifications: false,
  });
  const [workspacePrefs, setWorkspacePrefs] = React.useState({
    hardwareAcceleration: true,
    compactMode: false,
    autoSaveInterval: "5m",
  });
  const [privacyPrefs, setPrivacyPrefs] = React.useState({
    analyticsTelemetry: true,
    publicProfile: false,
  });
  const [aiPrefs, setAiPrefs] = React.useState({
    defaultModel: "gemini-1.5-flash",
    defaultVoice: "google-tts-en-US-Standard-D",
    autoCropSensitivity: "medium",
  });
  const [exportPrefs, setExportPrefs] = React.useState({
    resolution: "1080p",
    framerate: "30fps",
    audioFormat: "mp3",
  });
  const [themePrefs, setThemePrefs] = React.useState("dark");
  const [accentColor, setAccentColor] = React.useState("purple");
  const [fontScale, setFontScale] = React.useState("medium");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [cornerRadius, setCornerRadius] = React.useState("rounded");
  const [prefsSaveSuccess, setPrefsSaveSuccess] = React.useState(false);

  // Password Update Fields
  const [passwordState, setPasswordState] = React.useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  // Active Device sessions state
  const [sessions, setSessions] = React.useState<any[]>([]);

  // Credit claiming states
  const [credits, setCredits] = React.useState(
    user?.credits !== undefined ? user.credits : 840
  );
  const [hasClaimedToday, setHasClaimedToday] = React.useState(false);
  const [claimNotification, setClaimNotification] = React.useState(false);
  const [streakDays, setStreakDays] = React.useState(1);
  const [subscriptionTier, setSubscriptionTier] = React.useState("free");
  const [cardInfo, setCardInfo] = React.useState<any>(null);

  // API token creator state
  const [apiTokens, setApiTokens] = React.useState<
    { id: string; name: string; key: string; created: string }[]
  >([]);
  const [newTokenName, setNewTokenName] = React.useState("");
  const [tokenToast, setTokenToast] = React.useState<string | null>(null);

  // Invoices list state
  const [invoices, setInvoices] = React.useState<any[]>([]);

  // Lifted state from ProfileAccountTab
  const [connections, setConnections] = React.useState({
    google: true,
    github: false,
    discord: false,
  });
  const [achievementPoints, setAchievementPoints] = React.useState(380);
  const [unlockedRewards, setUnlockedRewards] = React.useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = React.useState<
    string[]
  >([]);
  const [portfolios, setPortfolios] = React.useState<any[]>([]);
  const [cacheUsed, setCacheUsed] = React.useState<number>(134637568); // 128.4 MB fallback
  const [cacheLimit, setCacheLimit] = React.useState<number>(5368709120); // 5 GB fallback

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Local state for project list
  const [localProjects, setLocalProjects] = React.useState<any[]>(projects);

  // MFA state
  const [is2faEnabled, setIs2faEnabled] = React.useState(false);

  const identifyPortfolioSite = (url: string) => {
    const low = url.toLowerCase();
    if (low.includes("webtoons.com")) return "Webtoons";
    if (low.includes("tapas.io")) return "Tapas";
    if (low.includes("artstation.com")) return "ArtStation";
    if (low.includes("behance.net")) return "Behance";
    if (low.includes("twitter.com") || low.includes("x.com")) return "Twitter";
    if (low.includes("instagram.com")) return "Instagram";
    if (low.includes("github.com")) return "GitHub";
    return "Website";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      await (window as any).alertAsync(
        "Image is too large. Please choose an image smaller than 2MB."
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTempAvatarUrl(reader.result);
        setShowConfirmModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmAvatarUpdate = async () => {
    if (!tempAvatarUrl) return;

    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    try {
      const data = await api.updateProfile(
        {
          full_name: profileUser.fullName,
          avatar_url: tempAvatarUrl,
          creator_role: profileUser.role,
          bio: profileUser.bio,
          newsletter: profileUser.newsletter,
          language: profileUser.language,
          portfolio_links: portfolios.map((p) => p.url),
          social_connections: connections,
        },
        token
      );

      setProfileUser((prev) => ({
        ...prev,
        avatarUrl: tempAvatarUrl,
      }));

      // Update comparison ref to avoid dirty warnings
      const updatedUser = {
        ...profileUser,
        avatarUrl: tempAvatarUrl,
      };
      lastSavedProfileRef.current = getSerializedProfile(
        updatedUser,
        connections,
        portfolios
      );

      if (onRefreshUser) {
        await onRefreshUser(false);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      await (window as any).alertAsync(
        err.message || "Failed to update profile picture"
      );
    } finally {
      setShowConfirmModal(false);
      setTempAvatarUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelAvatarUpdate = () => {
    setShowConfirmModal(false);
    setTempAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Serialization helper for dirty state comparison
  const getSerializedProfile = React.useCallback(
    (
      userObj: typeof profileUser,
      connObj: typeof connections,
      portList: typeof portfolios
    ) => {
      return JSON.stringify({
        fullName: userObj.fullName,
        avatarUrl: userObj.avatarUrl,
        role: userObj.role,
        bio: userObj.bio,
        newsletter: userObj.newsletter,
        language: userObj.language,
        connections: {
          google: !!connObj.google,
          github: !!connObj.github,
          discord: !!connObj.discord,
        },
        portfolios: portList.map((p) => ({ site: p.site, url: p.url })),
      });
    },
    []
  );

  const lastSavedProfileRef = React.useRef<string>("");

  // Initialize the ref on the first render if not already set
  if (!lastSavedProfileRef.current) {
    lastSavedProfileRef.current = getSerializedProfile(
      profileUser,
      connections,
      portfolios
    );
  }

  const currentProfileStr = getSerializedProfile(
    profileUser,
    connections,
    portfolios
  );
  const isDirty = currentProfileStr !== lastSavedProfileRef.current;

  const fetchProjects = React.useCallback(() => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .getProjects(token)
      .then((res) => {
        if (res.success) setLocalProjects(res.projects);
      })
      .catch(console.error);
  }, []);

  // Load profile assets dynamically on mount
  React.useEffect(() => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .getCurrentUser(token)
      .then((data) => {
        const u = data.user || data;
        if (u && (u.user_id || u.id)) {
          setCredits(u.credits);
          setSubscriptionTier(u.subscription_tier || "free");
          setAchievementPoints(u.achievement_points || 0);
          setUnlockedRewards(u.unlocked_rewards || []);
          setIs2faEnabled(u.mfa_enabled);
          setPortfolios(
            (u.portfolio_links || []).map((url: string) => ({
              id: Math.random().toString(36).substring(2, 11),
              site: identifyPortfolioSite(url),
              url,
            }))
          );
          setConnections(
            u.social_connections || {
              google: false,
              github: false,
              discord: false,
            }
          );
        }
      })
      .catch(console.error);

    fetchProjects();

    api
      .getSessions(token)
      .then((res) => {
        if (res.success && res.sessions) {
          setSessions(
            res.sessions.map((s: any) => ({
              id: s.session_id || s.id,
              browser: s.browser,
              ip: s.ip,
              location: s.location || "Unknown",
              active: !!s.active,
            }))
          );
        }
      })
      .catch(console.error);

    api
      .getApiKeys(token)
      .then((res) => {
        if (res.success) setApiTokens(res.keys);
      })
      .catch(console.error);

    api
      .getInvoices(token)
      .then((res) => {
        if (res.success && res.invoices) {
          setInvoices(
            res.invoices.map((inv: any) => ({
              id: inv.invoice_id || inv.id,
              date: inv.created_at || inv.date,
              amount: inv.amount,
              status: inv.status,
            }))
          );
        }
      })
      .catch(console.error);

    api
      .getMetrics()
      .then((res) => {
        if (res.storage) {
          setCacheUsed(res.storage.usedBytes);
          setCacheLimit(res.storage.limitBytes);
        }
      })
      .catch(console.error);
  }, [user, fetchProjects]);

  // Real-time polling for Workspace Stats
  React.useEffect(() => {
    const interval = setInterval(() => {
      api
        .getMetrics()
        .then((res) => {
          if (res.storage) {
            setCacheUsed(res.storage.usedBytes);
            setCacheLimit(res.storage.limitBytes);
          }
        })
        .catch(() => {});

      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      if (token) {
        api
          .getCurrentUser(token)
          .then((data) => {
            const u = data.user || data;
            if (u) setCredits(u.credits);
          })
          .catch(() => {});
      }
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Render initials or background gradients for avatar
  const renderAvatarContent = (url: string, name: string) => {
    if (url.startsWith("linear-gradient")) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-white font-extrabold text-3xl select-none"
          style={{ background: url }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      );
    }
    if (url) {
      return (
        <img src={url} alt="Profile" className="w-full h-full object-cover" />
      );
    }
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-3xl select-none">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    const data = {
      full_name: profileUser.fullName,
      avatar_url: profileUser.avatarUrl,
      creator_role: profileUser.role,
      bio: profileUser.bio,
      newsletter: profileUser.newsletter,
      language: profileUser.language,
      portfolio_links: portfolios.map((p) => p.url),
      social_connections: connections,
    };

    api
      .updateProfile(data, token)
      .then(() => {
        setSaveSuccess(true);
        lastSavedProfileRef.current = currentProfileStr;
        onRefreshUser?.();
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Failed to save profile changes"
        );
      });
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordState.current === "") {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordState.new.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordState.new !== passwordState.confirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    const data = {
      current_password: passwordState.current,
      new_password: passwordState.new,
    };

    api
      .updatePassword(data, token)
      .then(() => {
        setPasswordSuccess(true);
        setPasswordState({ current: "", new: "", confirm: "" });
        setTimeout(() => setPasswordSuccess(false), 3000);
      })
      .catch((err) => {
        setPasswordError(err.message || "An error occurred");
      });
  };

  const handleTerminateSession = async (id: string) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await (window as any).confirmAsync(
      "Are you sure you want to terminate this session? You will be logged out on that device."
    );
    if (!confirmed) {
      return;
    }

    api
      .terminateSession(id, token)
      .then((res) => {
        if (res.success) {
          setSessions((prev) => prev.filter((s) => s.id !== id));
        }
      })
      .catch(console.error);
  };

  const handleClaimCredits = () => {
    if (hasClaimedToday) return;
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .claimCredits(token)
      .then((res) => {
        if (res.success) {
          setCredits(res.credits);
          setStreakDays(res.streak_days);
          setHasClaimedToday(true);
          setClaimNotification(true);
          setTimeout(() => setClaimNotification(false), 4000);
          if (onRefreshUser) {
            onRefreshUser(false);
          }
        }
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Could not claim daily credits"
        );
      });
  };

  const handleUpgradePlan = async () => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;
    try {
      const res = await api.upgradePlan(token);
      if (res.success) {
        setSubscriptionTier("pro");
        const invRes = await api.getInvoices(token);
        if (invRes.success) {
          setInvoices(invRes.invoices);
        }
      }
    } catch (err: any) {
      await (window as any).alertAsync(err.message || "Failed to upgrade plan");
    }
  };

  const handleSaveCard = async (card: {
    cardHolder: string;
    cardNo: string;
    cardExpiry: string;
    cardCvv: string;
  }) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;
    try {
      const res = await api.saveCard(card, token);
      if (res.success) {
        setCardInfo(card);
        await (window as any).alertAsync("Payment method saved successfully!");
      }
    } catch (err: any) {
      await (window as any).alertAsync(err.message || "Failed to save card");
    }
  };

  const handlePurchaseCredits = async (
    amountOfCredits: number,
    priceUSD: number
  ) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;
    try {
      const data = { credits: amountOfCredits, amount: priceUSD };
      const res = await api.purchaseCredits(data, token);
      if (res.success) {
        setCredits(res.credits);
        const invRes = await api.getInvoices(token);
        if (invRes.success) {
          setInvoices(invRes.invoices);
        }
      }
    } catch (err: any) {
      await (window as any).alertAsync(
        err.message || "Failed to purchase package"
      );
    }
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .createApiKey({ name: newTokenName }, token)
      .then((res) => {
        if (res.success) {
          setApiTokens((prev) => [
            ...prev,
            {
              id: res.key.id,
              name: res.key.name,
              key: res.key.key,
              created: res.key.created.split(" ")[0],
            },
          ]);
          setNewTokenName("");
          setTokenToast(`Generated key: ${res.raw_key}`);
        }
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Failed to generate key"
        );
      });
  };

  const handleCopyToastKey = async (key: string) => {
    navigator.clipboard.writeText(key);
    await (window as any).alertAsync("Copied full API key to clipboard!");
  };

  const handleDeleteToken = async (id: string) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await (window as any).confirmAsync(
      "Are you sure you want to delete this API key? Apps using it will immediately lose access."
    );
    if (!confirmed) {
      return;
    }

    api
      .deleteApiKey(id, token)
      .then((res) => {
        if (res.success) {
          setApiTokens((prev) => prev.filter((t) => t.id !== id));
        }
      })
      .catch(console.error);
  };

  const handleToggleMfa = async (enabled: boolean): Promise<boolean> => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return false;

    try {
      const res = await api.updateMfa(enabled, token);
      if (res.success) {
        setIs2faEnabled(enabled);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const onRedeemReward = async (
    cost: number,
    type: string,
    value: string
  ): Promise<boolean> => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return false;

    try {
      const data = {
        points: cost,
        reward_type: type,
        reward_value: value,
      };
      const res = await api.redeemReward(data, token);
      if (res.success) {
        if (type === "credits") {
          setCredits(res.credits);
        } else if (type === "badge") {
          setUnlockedRewards(res.badges || []);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleBatchDeleteProjects = (ids: string[]) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .batchDeleteProjects(ids, token)
      .then((res) => {
        if (res.success) {
          setLocalProjects((prev) =>
            prev.filter((p) => !ids.includes(p.project_id))
          );
        }
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Failed to bulk delete projects"
        );
      });
  };

  const handleDeleteChapter = (id: string) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .deleteProject(id, token)
      .then((res) => {
        if (res.success) {
          setLocalProjects((prev) => prev.filter((p) => p.project_id !== id));
        }
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Failed to delete chapter"
        );
      });
  };

  const handleDeleteSeries = (seriesId: string) => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .deleteSeries(seriesId, token)
      .then((res) => {
        if (res.success) {
          setLocalProjects((prev) =>
            prev.filter((p) => p.series_id !== seriesId)
          );
        }
      })
      .catch(async (err) => {
        await (window as any).alertAsync(
          err.message || "Failed to delete series"
        );
      });
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsSaveSuccess(true);
    setTimeout(() => setPrefsSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      profile: profileUser,
      projects: localProjects,
      connections: connections,
      apiTokens: apiTokens,
      invoices: invoices,
      preferences: {
        notifications: notificationPrefs,
        workspace: workspacePrefs,
        privacy: privacyPrefs,
        ai: aiPrefs,
        export: exportPrefs,
        theme: themePrefs,
        accentColor: accentColor,
        fontScale: fontScale,
        reduceMotion: reduceMotion,
        cornerRadius: cornerRadius,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sonikoma_account_export_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await (window as any).confirmAsync(
      "CRITICAL: Are you absolutely sure you want to permanently delete your account? All projects, assets, and data will be lost forever. This action cannot be undone.",
      "Permanently Delete Account",
      "red"
    );
    if (!confirmed) return;

    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) {
      onLogout();
      return;
    }

    try {
      const res = await api.deleteAccount(token);
      if (res.success) {
        await (window as any).alertAsync("Account deleted successfully.");
        onLogout();
      } else {
        await (window as any).alertAsync(
          res.detail || "Failed to delete account"
        );
      }
    } catch (err: any) {
      console.error(err);
      await (window as any).alertAsync(
        err.message || "Failed to delete account."
      );
    }
  };

  // Dynamic calculations for overall stats using real data from localProjects
  const queueProjects = localProjects.filter(
    (p) => p.status === "pending" || p.status === "processing"
  );
  const queueSeconds = queueProjects.reduce(
    (sum, p) => sum + (p.panels_count || 0) * 4.5,
    0
  );
  const queueMinutes = queueSeconds / 60;
  const queueText =
    queueMinutes > 0
      ? queueMinutes >= 60
        ? `${(queueMinutes / 60).toFixed(1)} hrs`
        : `${queueMinutes.toFixed(1)} mins`
      : "0 mins";
  const queueSubtext =
    queueProjects.length > 0
      ? `${queueProjects.length} active compilation job(s)`
      : "No active compilation jobs";

  const totalPanels = localProjects.reduce(
    (sum, p) => sum + (p.panels_count || 0),
    0
  );
  const avgPanels =
    localProjects.length > 0
      ? Math.round(totalPanels / localProjects.length)
      : 0;
  const avgPanelsSubtext =
    localProjects.length > 0
      ? `Total: ${totalPanels} panels across ${localProjects.length} chapters`
      : "No chapters created yet";

  const completedCount = localProjects.filter(
    (p) => p.status === "completed"
  ).length;
  const failedCount = localProjects.filter((p) => p.status === "failed").length;
  const totalFinished = completedCount + failedCount;
  const successRate =
    totalFinished > 0
      ? ((completedCount / totalFinished) * 100).toFixed(1)
      : "100.0";
  const successRateSubtext =
    totalFinished > 0
      ? `${completedCount} succeeded / ${failedCount} failed compiles`
      : "No finished compiles yet";

  return (
    <div className="min-h-screen bg-[#070709] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Hidden file input for custom profile image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative group">
              {/* Profile Avatar Card */}
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/30 shadow-2xl shadow-purple-500/15 bg-neutral-900 flex items-center justify-center">
                {renderAvatarContent(
                  profileUser.avatarUrl,
                  profileUser.fullName
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg border border-white/10 transition-all scale-95 hover:scale-100 cursor-pointer"
                title="Upload Profile Image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-left">
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {profileUser.fullName}
                <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {profileUser.role}
                </span>
              </h1>
              <p className="text-neutral-400 flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-purple-400" />
                {profileUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 rounded-xl text-sm font-bold text-neutral-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 duration-300"
            >
              Back to Dashboard
            </button>
            <button
              onClick={async () => {
                const confirm = (window as any).confirmAsync || window.confirm;
                const confirmed = await (window as any).confirmAsync(
                  "Are you sure you want to sign out? You will need to log back in to access your projects.",
                  "Sign Out",
                  "red"
                );
                if (confirmed) {
                  onLogout();
                }
              }}
              className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 rounded-xl text-sm font-bold text-rose-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 duration-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Premium overall stats counters row */}
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-4 pb-4 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[260px] sm:min-w-0 snap-center shrink-0 sm:shrink bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Total Compilation Queue
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {queueText}
            </div>
            <div className="text-[9px] text-purple-400 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {queueSubtext}
            </div>
          </div>
          <div className="min-w-[260px] sm:min-w-0 snap-center shrink-0 sm:shrink bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Average Panels per Strip
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {avgPanels} frames
            </div>
            <div className="text-[9px] text-indigo-400 font-semibold mt-1">
              {avgPanelsSubtext}
            </div>
          </div>
          <div className="min-w-[260px] sm:min-w-0 snap-center shrink-0 sm:shrink bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Smart Sync Success Rate
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {successRate}%
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold mt-1">
              {successRateSubtext}
            </div>
          </div>
        </div>
        {/* PROFILE WORKSPACE HORIZONTAL TABS */}
        <div className="space-y-6">
          {/* HORIZONTAL TAB BAR */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "projects"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Recent Projects
              <span className="text-[10px] bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-full font-mono ml-1">
                {localProjects.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "analytics"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Creator Analytics
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "account"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4" />
              Account Settings
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "security"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Shield className="w-4 h-4" />
              Security & Sessions
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "preferences"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4" />
              Preferences & Theme
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "billing"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Billing & Credits
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold font-sans ml-1">
                Active
              </span>
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "api"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Key className="w-4 h-4" />
              Developer APIs
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap snap-start shrink-0 ${
                activeTab === "stats"
                  ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                  : "bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Activity className="w-4 h-4" />
              Workspace Stats
            </button>
          </div>

          {/* TAB CONTENT PANEL SWITCHER */}
          <div className="space-y-6">
            {/* TAB: WORKSPACE STATS */}
            {activeTab === "stats" && (
              <div className="bg-[#0c0c0e]/30 border border-white/5 rounded-3xl p-6 space-y-6 text-left shadow-xl animate-in fade-in zoom-in-95 duration-300">
                <h4 className="text-xs font-black uppercase text-neutral-500 tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Workspace System Stats
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                      <span>Smart Engine Credits</span>
                      <span className="text-white font-bold">
                        {credits} /{" "}
                        {Math.max(
                          1000,
                          Math.min(5000, Math.ceil(credits / 1000) * 1000)
                        )}
                      </span>
                    </div>
                    <div className="h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (credits /
                              Math.max(
                                1000,
                                Math.min(5000, Math.ceil(credits / 1000) * 1000)
                              )) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Storage usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
                      <span>Cache Storage</span>
                      <span className="text-white font-bold">
                        {formatBytes(cacheUsed)} / {formatBytes(cacheLimit)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (cacheUsed / cacheLimit) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 0: CREATOR PERFORMANCE ANALYTICS */}
            {activeTab === "analytics" && <ProfileAnalyticsTab />}

            {/* TAB 1: RECENT PROJECTS */}
            {activeTab === "projects" && (
              <ProfileProjectsTab
                projects={localProjects}
                onNavigateHome={onNavigateHome}
                onBatchDelete={handleBatchDeleteProjects}
                onDeleteChapter={handleDeleteChapter}
                onDeleteSeries={handleDeleteSeries}
                onRefreshProjects={fetchProjects}
              />
            )}

            {/* TAB 2: ACCOUNT SETTINGS EDIT FORM */}
            {activeTab === "account" && (
              <ProfileAccountTab
                user={user}
                profileUser={profileUser}
                setProfileUser={setProfileUser}
                handleProfileSave={handleProfileSave}
                saveSuccess={saveSuccess}
                connections={connections}
                setConnections={setConnections}
                achievementPoints={achievementPoints}
                setAchievementPoints={setAchievementPoints}
                unlockedRewards={unlockedRewards}
                setUnlockedRewards={setUnlockedRewards}
                unlockedAchievements={unlockedAchievements}
                portfolios={portfolios}
                setPortfolios={setPortfolios}
                onRedeemReward={onRedeemReward}
                isDirty={isDirty}
              />
            )}

            {/* TAB 3: SECURITY & SESSIONS MANAGER */}
            {activeTab === "security" && (
              <ProfileSecurityTab
                passwordState={passwordState}
                setPasswordState={setPasswordState}
                handlePasswordSave={handlePasswordSave}
                passwordSuccess={passwordSuccess}
                passwordError={passwordError}
                sessions={sessions}
                handleTerminateSession={handleTerminateSession}
                is2faEnabled={is2faEnabled}
                handleToggleMfa={handleToggleMfa}
                onExportData={handleExportData}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {/* TAB 4: BILLING & CREDITS */}
            {activeTab === "billing" && (
              <ProfileBillingTab
                credits={credits}
                hasClaimedToday={hasClaimedToday}
                handleClaimCredits={handleClaimCredits}
                claimNotification={claimNotification}
                invoices={invoices}
                streakDays={streakDays}
                subscriptionTier={subscriptionTier}
                cardInfo={cardInfo}
                onUpdateCard={handleSaveCard}
                onUpgradePlan={handleUpgradePlan}
                onPurchaseCredits={handlePurchaseCredits}
              />
            )}

            {/* TAB 5: API & DEVELOPER INTEGRATIONS */}
            {activeTab === "api" && (
              <ProfileApiTab
                apiTokens={apiTokens}
                newTokenName={newTokenName}
                setNewTokenName={setNewTokenName}
                handleGenerateToken={handleGenerateToken}
                tokenToast={tokenToast}
                handleCopyToastKey={handleCopyToastKey}
                handleDeleteToken={handleDeleteToken}
              />
            )}

            {/* TAB 6: PREFERENCES & NOTIFICATIONS */}
            {activeTab === "preferences" && (
              <ProfilePreferencesTab
                notifications={notificationPrefs}
                setNotifications={setNotificationPrefs}
                workspace={workspacePrefs}
                setWorkspace={setWorkspacePrefs}
                privacy={privacyPrefs}
                setPrivacy={setPrivacyPrefs}
                ai={aiPrefs}
                setAi={setAiPrefs}
                exportSettings={exportPrefs}
                setExportSettings={setExportPrefs}
                themeMode={themeMode || themePrefs}
                toggleThemeMode={
                  toggleThemeMode ||
                  (() => setThemePrefs((p) => (p === "dark" ? "light" : "dark")))
                }
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                fontScale={fontScale}
                setFontScale={setFontScale}
                reduceMotion={reduceMotion}
                setReduceMotion={setReduceMotion}
                cornerRadius={cornerRadius}
                setCornerRadius={setCornerRadius}
                onSave={handleSavePreferences}
                saveSuccess={prefsSaveSuccess}
              />
            )}
          </div>
        </div>
      </div>

      {/* Profile Picture Upload Confirmation Modal */}
      {showConfirmModal && tempAvatarUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0f13] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Update Profile Picture?
              </h3>
              <p className="text-xs text-neutral-400">
                Confirm updating your avatar image. This will automatically save
                changes to your profile.
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 py-2">
              {/* Old avatar */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                  Current
                </span>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 flex items-center justify-center">
                  {renderAvatarContent(
                    profileUser.avatarUrl,
                    profileUser.fullName
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-purple-500 font-bold text-xl">➔</div>

              {/* New avatar preview */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">
                  New Preview
                </span>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/50 bg-neutral-900 flex items-center justify-center shadow-lg shadow-purple-500/10">
                  <img
                    src={tempAvatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelAvatarUpdate}
                className="flex-1 py-2.5 bg-neutral-900 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAvatarUpdate}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 duration-200 shadow-md shadow-purple-950/30"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
