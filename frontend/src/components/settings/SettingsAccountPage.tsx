import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Smartphone,
  Globe,
  Save,
  Loader2,
  Trash2,
  ArrowLeft,
  Settings,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from "lucide-react";
import {
  updateProfile,
  updatePassword,
  getSessions,
  terminateSession
} from "../../api/auth";

interface SettingsAccountPageProps {
  user: any;
  onRefreshUser: () => void | Promise<void>;
  fetchWithInterceptor: any;
  addNotification: (msg: string, type: "success" | "error" | "info" | "warning") => void;
  navigateTo: (path: string) => void;
}

export default function SettingsAccountPage({
  user,
  onRefreshUser,
  fetchWithInterceptor,
  addNotification,
  navigateTo
}: SettingsAccountPageProps) {
  // Profile state variables
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [role, setRole] = useState(user?.creator_role || "creator");
  const [bio, setBio] = useState(user?.bio || "");
  const [language, setLanguage] = useState(user?.language || "en");
  const [newsletter, setNewsletter] = useState(user?.newsletter === 1 || user?.newsletter === true);
  
  // Password state variables
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  // Sessions state variables
  const [sessions, setSessions] = useState<any[]>([]);
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await getSessions(fetchWithInterceptor);
      if (data && Array.isArray(data)) {
        setSessions(data);
      } else if (data && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const data = {
        full_name: fullName,
        avatar_url: avatarUrl,
        creator_role: role,
        bio,
        language,
        newsletter
      };
      const res = await updateProfile(fetchWithInterceptor, data);
      if (res && (res.success || res.message)) {
        addNotification("Profile settings updated successfully", "success");
        await onRefreshUser();
      } else {
        addNotification("Failed to update profile", "error");
      }
    } catch (err: any) {
      addNotification(err.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addNotification("New passwords do not match", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await updatePassword(fetchWithInterceptor, {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res && (res.success || res.message)) {
        addNotification("Password updated successfully", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addNotification(res.detail || "Failed to update password", "error");
      }
    } catch (err: any) {
      addNotification(err.message || "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTerminateSession = async (sessId: string) => {
    if (!window.confirm("Are you sure you want to revoke this session?")) return;
    try {
      const res = await terminateSession(fetchWithInterceptor, sessId);
      addNotification("Session terminated successfully", "success");
      await loadSessions();
    } catch (err: any) {
      addNotification(err.message || "Failed to terminate session", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo("/workspace")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-neutral-200 transition-all hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-wider text-white">
              Account Settings
            </h1>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0b0b0f] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <User className="w-32 h-32 text-purple-500" />
              </div>

              <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Personal Details
                </h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                      Email Address (Read Only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full bg-[#050508]/50 border border-neutral-850/50 rounded-xl pl-11 pr-4 py-3 text-sm text-neutral-500 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                      Creator Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 transition-all font-semibold"
                    >
                      <option value="creator">Creator</option>
                      <option value="writer">Writer / Author</option>
                      <option value="illustrator">Illustrator / Artist</option>
                      <option value="producer">Producer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                      Avatar Image URL
                    </label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Bio / Synopsis
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself or your webtoon series..."
                    rows={4}
                    className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-neutral-500" /> Default Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-purple-500/50 transition-all font-semibold"
                    >
                      <option value="en">English (US)</option>
                      <option value="ko">Korean (한국어)</option>
                      <option value="ja">Japanese (日本語)</option>
                      <option value="zh">Chinese (中文)</option>
                      <option value="fr">French (Français)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="newsletter"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#050508] border-neutral-850 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="newsletter" className="text-xs font-bold text-neutral-300 cursor-pointer select-none">
                      Subscribe to platform updates & newsletter
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Security / Password Card */}
          <div className="space-y-8">
            <div className="bg-[#0b0b0f] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-32 h-32 text-indigo-500" />
              </div>

              <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                <Key className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Update Password
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 pr-10 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 pr-10 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#050508] border border-neutral-850 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section: Active Sessions Table */}
        <div className="bg-[#0b0b0f] border border-neutral-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Smartphone className="w-32 h-32 text-teal-500" />
          </div>

          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Browser Sessions
              </h2>
            </div>
            
            <span className="text-[10px] px-3 py-1 rounded-full bg-teal-950/60 text-teal-300 border border-teal-800/50 font-mono font-bold">
              {sessions.length} Session{sessions.length !== 1 ? "s" : ""} Active
            </span>
          </div>

          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">Retrieving sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center gap-3 bg-neutral-900/30 border border-neutral-850 rounded-2xl p-6 text-neutral-400 text-xs">
              <AlertCircle className="w-5 h-5 text-neutral-500" />
              <span>No other active sessions detected. Your credentials are secure.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-400">
                <thead>
                  <tr className="border-b border-neutral-800/50 text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    <th className="py-4 px-4">Device / User Agent</th>
                    <th className="py-4 px-4">IP Address</th>
                    <th className="py-4 px-4">Last Active</th>
                    <th className="py-4 px-4">Current Session</th>
                    <th className="py-4 px-4 text-right">Revoke Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/50">
                  {sessions.map((sess) => {
                    const isCurrent = sess.token_jti === user?.jti || sess.is_current === true;
                    return (
                      <tr key={sess.id} className="hover:bg-neutral-900/10 transition-colors">
                        <td className="py-4 px-4 font-semibold text-neutral-200">
                          {sess.user_agent || "Unknown Browser / Client"}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-neutral-400">
                          {sess.ip_address || "127.0.0.1"}
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-neutral-400">
                          {sess.last_active || "Just now"}
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {isCurrent ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
                              This Device
                            </span>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {!isCurrent && (
                            <button
                              onClick={() => handleTerminateSession(sess.id)}
                              className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
