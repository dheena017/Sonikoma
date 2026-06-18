import React from "react";
import {
  User,
  Mail,
  Shield,
  History,
  Settings,
  LogOut,
  Camera,
  LayoutGrid,
  CreditCard,
  Key,
  Globe,
  Sparkles,
} from "lucide-react";

// Sub-components
import ProfileProjectsTab from "./profile/ProfileProjectsTab.js";
import ProfileAccountTab from "./profile/ProfileAccountTab.js";
import ProfileSecurityTab from "./profile/ProfileSecurityTab.js";
import ProfileBillingTab from "./profile/ProfileBillingTab.js";
import ProfileApiTab from "./profile/ProfileApiTab.js";

interface ProfilePageProps {
  user: any;
  projects: any[];
  onLogout: () => void;
  onNavigateHome: () => void;
}

const AVATAR_TEMPLATES = [
  "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)", // Purple-indigo
  "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)", // Blue-cyan
  "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)", // Emerald-teal
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // Amber-orange
  "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)", // Pink-rose
  "linear-gradient(135deg, #64748b 0%, #475569 100%)", // Slate-gray
];

const CREATOR_ROLES = [
  { id: "artist", label: "Artist", desc: "Draw and design characters" },
  { id: "creator", label: "Video Editor", desc: "Compile clips and recaps" },
  { id: "producer", label: "Producer", desc: "Manage voice and soundscapes" },
  { id: "fan", label: "Comic Lover", desc: "Experiment with scripts" },
];

export default function ProfilePage({
  user,
  projects = [],
  onLogout,
  onNavigateHome,
}: ProfilePageProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = React.useState<
    "projects" | "account" | "security" | "billing" | "api"
  >("projects");

  // Local state for profile values
  const [profileUser, setProfileUser] = React.useState({
    fullName: user?.full_name || "Anivox Creator",
    email: user?.email || "creator@anivox.com",
    avatarUrl: user?.avatar_url || AVATAR_TEMPLATES[0],
    role: user?.creator_role || "creator",
    bio:
      user?.bio ||
      "Comic visual director and anime fan editing high-quality cinematic stories.",
    newsletter: user?.newsletter !== undefined ? user.newsletter : true,
    language: user?.language || "en",
  });

  const [isEditingAvatar, setIsEditingAvatar] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

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
  const [achievementPoints, setAchievementPoints] = React.useState(300);
  const [unlockedRewards, setUnlockedRewards] = React.useState<string[]>([]);
  const [portfolios, setPortfolios] = React.useState<any[]>([]);

  // Local state for project list
  const [localProjects, setLocalProjects] = React.useState<any[]>(projects);

  // MFA state
  const [is2faEnabled, setIs2faEnabled] = React.useState(false);

  // Track initial load for profile auto-syncs
  const isInitialLoad = React.useRef(true);

  // Load profile assets dynamically on mount
  React.useEffect(() => {
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user_id) {
          setCredits(data.credits);
          setUnlockedRewards(data.unlocked_rewards || []);
          setConnections(
            data.social_connections || {
              google: true,
              github: false,
              discord: false,
            }
          );

          // Calculate achievement points based on unlocked rewards count
          setAchievementPoints(
            300 - (data.unlocked_rewards?.length || 0) * 100
          );

          setPortfolios(
            (data.portfolio_links || []).map((url: string, idx: number) => ({
              id: idx.toString(),
              site: url.includes("webtoons")
                ? "Webtoons"
                : url.includes("tapas")
                ? "Tapas"
                : "ArtStation",
              url: url,
            }))
          );

          setProfileUser({
            fullName: data.full_name || "Anivox Creator",
            email: data.email || "creator@anivox.com",
            avatarUrl: data.avatar_url || AVATAR_TEMPLATES[0],
            role: data.creator_role || "creator",
            bio:
              data.bio ||
              "Comic visual director and anime fan editing high-quality cinematic stories.",
            newsletter: data.newsletter !== undefined ? data.newsletter : true,
            language: data.language || "en",
          });

          setIs2faEnabled(!!data.mfa_enabled);
          setHasClaimedToday(!!data.has_claimed_today);

          // Mark initial load complete after state updates apply
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      })
      .catch(console.error);

    fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setLocalProjects(res.projects || []);
        }
      })
      .catch(console.error);

    fetch("/api/auth/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSessions(
            res.sessions.map((s: any) => ({
              id: s.session_id,
              browser: s.browser,
              ip: s.ip,
              location: s.location,
              active: s.active === 1,
            }))
          );
        }
      })
      .catch(console.error);

    fetch("/api/auth/api-keys", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setApiTokens(
            res.keys.map((k: any) => ({
              id: k.key_id,
              name: k.name,
              key: k.api_key,
              created: k.created_at.split(" ")[0],
            }))
          );
        }
      })
      .catch(console.error);

    fetch("/api/auth/invoices", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setInvoices(
            res.invoices.map((inv: any) => ({
              id: inv.invoice_id,
              date: inv.created_at.split(" ")[0],
              amount: inv.amount,
              status: inv.status,
            }))
          );
        }
      })
      .catch(console.error);
  }, [user]);

  // Dynamic portfolio and connection auto-saves in background
  React.useEffect(() => {
    if (isInitialLoad.current) return;
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        portfolio_links: portfolios.map((p) => p.url),
        social_connections: connections,
      }),
    }).catch(console.error);
  }, [connections, portfolios]);

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
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: profileUser.fullName,
        avatar_url: profileUser.avatarUrl,
        creator_role: profileUser.role,
        bio: profileUser.bio,
        newsletter: profileUser.newsletter,
        language: profileUser.language,
        portfolio_links: portfolios.map((p) => p.url),
        social_connections: connections,
      }),
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) {
          throw new Error(res.detail || "Profile save failed");
        }
        return res;
      })
      .then(() => {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch((err) => {
        alert(err.message || "Failed to save profile changes");
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

    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: passwordState.current,
        new_password: passwordState.new,
      }),
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) {
          throw new Error(res.detail || "Password update failed");
        }
        return res;
      })
      .then(() => {
        setPasswordSuccess(true);
        setPasswordState({ current: "", new: "", confirm: "" });
        setTimeout(() => setPasswordSuccess(false), 3000);
      })
      .catch((err) => {
        setPasswordError(err.message || "An error occurred");
      });
  };

  const handleTerminateSession = (id: string) => {
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch(`/api/auth/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSessions((prev) => prev.filter((s) => s.id !== id));
        }
      })
      .catch(console.error);
  };

  const handleClaimCredits = () => {
    if (hasClaimedToday) return;
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/claim-credits", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) {
          throw new Error(res.detail || "Failed to claim credits");
        }
        return res;
      })
      .then((res) => {
        if (res.success) {
          setCredits(res.credits);
          setHasClaimedToday(true);
          setClaimNotification(true);
          setTimeout(() => setClaimNotification(false), 4000);
        }
      })
      .catch((err) => {
        alert(err.message || "Could not claim daily credits");
      });
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/auth/api-keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newTokenName }),
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) {
          throw new Error(res.detail || "Failed to generate key");
        }
        return res;
      })
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
      .catch((err) => {
        alert(err.message || "Failed to generate key");
      });
  };

  const handleCopyToastKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert("Copied full API key to clipboard!");
  };

  const handleDeleteToken = (id: string) => {
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch(`/api/auth/api-keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setApiTokens((prev) => prev.filter((t) => t.id !== id));
        }
      })
      .catch(console.error);
  };

  const handleToggleMfa = async (enabled: boolean): Promise<boolean> => {
    const token = localStorage.getItem("anivox_token");
    if (!token) return false;

    try {
      const response = await fetch("/api/auth/mfa", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mfa_enabled: enabled }),
      });

      if (!response.ok) return false;
      const res = await response.json();
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
    const token = localStorage.getItem("anivox_token");
    if (!token) return false;

    try {
      const response = await fetch("/api/auth/redeem-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          points: cost,
          reward_type: type,
          reward_value: value,
        }),
      });

      if (!response.ok) return false;
      const res = await response.json();
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
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch("/api/projects/batch-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ project_ids: ids }),
    })
      .then(async (r) => {
        const res = await r.json();
        if (!r.ok) {
          throw new Error(res.detail || "Bulk deletion failed");
        }
        return res;
      })
      .then((res) => {
        if (res.success) {
          setLocalProjects((prev) =>
            prev.filter((p) => !ids.includes(p.project_id))
          );
        }
      })
      .catch((err) => {
        alert(err.message || "Failed to bulk delete projects");
      });
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
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
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute -bottom-2 -right-2 p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg border border-white/10 transition-all scale-95 hover:scale-100 cursor-pointer"
                title="Change Avatar Style"
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
              onClick={onLogout}
              className="px-4 py-2 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600 rounded-xl text-sm font-bold text-rose-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 duration-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Change Avatar Template Selector Widget */}
        {isEditingAvatar && (
          <div className="p-6 bg-[#0f0f13]/80 border border-white/5 rounded-3xl animate-in slide-in-from-top-4 duration-300 space-y-4">
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">
                Select Profile Avatar Theme
              </h4>
              <p className="text-xs text-neutral-500">
                Pick a curated comic color gradient avatar style
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {AVATAR_TEMPLATES.map((gradient, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setProfileUser((prev) => ({
                      ...prev,
                      avatarUrl: gradient,
                    }));
                    setIsEditingAvatar(false);
                  }}
                  className={`w-12 h-12 rounded-2xl cursor-pointer transition-transform hover:scale-105 active:scale-90 border-2 ${
                    profileUser.avatarUrl === gradient
                      ? "border-purple-500 ring-2 ring-purple-500/30"
                      : "border-transparent"
                  }`}
                  style={{ background: gradient }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Premium overall stats counters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Total Compilation Queue
            </div>
            <div className="text-2xl font-black text-white mt-1">12.8 hrs</div>
            <div className="text-[9px] text-purple-400 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> High-priority GPU instances
            </div>
          </div>
          <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Average Panels per Strip
            </div>
            <div className="text-2xl font-black text-white mt-1">14 frames</div>
            <div className="text-[9px] text-indigo-400 font-semibold mt-1">
              CV bounding variance: optimal
            </div>
          </div>
          <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-xl">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              AI Sync Success Rate
            </div>
            <div className="text-2xl font-black text-white mt-1">99.8%</div>
            <div className="text-[9px] text-emerald-400 font-semibold mt-1">
              Narration voice pitch matched
            </div>
          </div>
        </div>

        {/* PROFILE WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT COLUMN: Sidebar menu list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0c0c0e]/60 border border-white/5 rounded-3xl p-4 flex flex-col gap-1.5 shadow-xl">
              <button
                onClick={() => setActiveTab("projects")}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "projects"
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Recent Projects
                </span>
                <span className="text-[10px] bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-full font-mono">
                  {localProjects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "account"
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-4 h-4" />
                Account Settings
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "security"
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-4 h-4" />
                Security & Sessions
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  activeTab === "billing"
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Billing & Credits
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold font-sans">
                  Active
                </span>
              </button>

              <button
                onClick={() => setActiveTab("api")}
                className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "api"
                    ? "bg-purple-600/10 border border-purple-500/20 text-purple-400"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Key className="w-4 h-4" />
                Developer APIs
              </button>
            </div>

            {/* Quick System usage card */}
            <div className="bg-[#0c0c0e]/30 border border-white/5 rounded-3xl p-5 space-y-4 text-left">
              <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                Workspace Stats
              </h4>
              <div className="space-y-3">
                {/* Credit usage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold">
                    <span>AI Engine Credits</span>
                    <span className="text-white font-bold">
                      {credits} / 1000
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(credits / 1000) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Storage usage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold">
                    <span>Cache Storage</span>
                    <span className="text-white font-bold">
                      128.4 MB / 5 GB
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: "2.5%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Tab content panel switcher */}
          <div className="lg:col-span-3 space-y-6">
            {/* TAB 1: RECENT PROJECTS */}
            {activeTab === "projects" && (
              <ProfileProjectsTab
                projects={localProjects}
                onNavigateHome={onNavigateHome}
                onBatchDelete={handleBatchDeleteProjects}
              />
            )}

            {/* TAB 2: ACCOUNT SETTINGS EDIT FORM */}
            {activeTab === "account" && (
              <ProfileAccountTab
                user={user}
                profileUser={profileUser}
                setProfileUser={setProfileUser}
                CREATOR_ROLES={CREATOR_ROLES}
                handleProfileSave={handleProfileSave}
                saveSuccess={saveSuccess}
                connections={connections}
                setConnections={setConnections}
                achievementPoints={achievementPoints}
                setAchievementPoints={setAchievementPoints}
                unlockedRewards={unlockedRewards}
                setUnlockedRewards={setUnlockedRewards}
                portfolios={portfolios}
                setPortfolios={setPortfolios}
                onRedeemReward={onRedeemReward}
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
          </div>
        </div>
      </div>
    </div>
  );
}
