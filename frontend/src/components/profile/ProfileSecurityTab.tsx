import React from "react";
import {
  Lock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
  Key,
  Copy,
  X,
} from "lucide-react";

interface ProfileSecurityTabProps {
  passwordState: {
    current: string;
    new: string;
    confirm: string;
  };
  setPasswordState: React.Dispatch<
    React.SetStateAction<{
      current: string;
      new: string;
      confirm: string;
    }>
  >;
  handlePasswordSave: (e: React.FormEvent) => void;
  passwordSuccess: boolean;
  passwordError: string | null;
  sessions: {
    id: string;
    browser: string;
    ip: string;
    location: string;
    active: boolean;
  }[];
  handleTerminateSession: (id: string) => void;
  is2faEnabled: boolean;
  handleToggleMfa: (enabled: boolean) => Promise<boolean>;
}

export default function ProfileSecurityTab({
  passwordState,
  setPasswordState,
  handlePasswordSave,
  passwordSuccess,
  passwordError,
  sessions,
  handleTerminateSession,
  is2faEnabled,
  handleToggleMfa,
}: ProfileSecurityTabProps) {
  // 2FA state simulations
  const [show2faSetup, setShow2faSetup] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpError, setOtpError] = React.useState<string | null>(null);

  // Security audit logs states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [totalLogsCount, setTotalLogsCount] = React.useState(0);

  React.useEffect(() => {
    const token = localStorage.getItem("anivox_token");
    if (!token) return;

    fetch(
      `/api/auth/audit-logs?query=${encodeURIComponent(
        searchQuery
      )}&page=${currentPage}&limit=3`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAuditLogs(
            data.logs.map((l: any) => ({
              id: l.id.toString(),
              event: l.event,
              ip: l.ip,
              date: l.created_at.substring(0, 16),
              status: l.status,
            }))
          );
          setTotalLogsCount(data.total);
        }
      })
      .catch(console.error);
  }, [searchQuery, currentPage]);

  // Real-time password strength check
  const passwordStrength = React.useMemo(() => {
    const pw = passwordState.new;
    if (!pw) return { label: "Empty", percentage: 0, color: "bg-neutral-800" };

    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score === 4)
      return { label: "Very Strong", percentage: 100, color: "bg-emerald-500" };
    if (score === 3)
      return { label: "Strong", percentage: 75, color: "bg-indigo-500" };
    if (score === 2)
      return { label: "Moderate", percentage: 50, color: "bg-purple-500" };
    return { label: "Weak", percentage: 25, color: "bg-rose-500" };
  }, [passwordState.new]);

  // Password requirements met checklist flags
  const pwRequirements = React.useMemo(() => {
    const pw = passwordState.new || "";
    return {
      length: pw.length >= 8,
      uppercase: /[A-Z]/.test(pw),
      number: /[0-9]/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    };
  }, [passwordState.new]);

  const handleGeneratePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordState({
      current: passwordState.current,
      new: generated,
      confirm: generated,
    });
  };

  const itemsPerPage = 3;
  const totalPages = Math.ceil(totalLogsCount / itemsPerPage);
  const paginatedLogs = auditLogs;

  // Security score calculation
  const securityScore = React.useMemo(() => {
    let score = 65; // base score
    if (is2faEnabled) score += 25;
    if (sessions.length < 3) score += 10;
    return score;
  }, [is2faEnabled, sessions]);

  const scoreLabel = () => {
    if (securityScore >= 95)
      return {
        grade: "A+",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    if (securityScore >= 80)
      return {
        grade: "B",
        color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      };
    return {
      grade: "C",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    };
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (otpCode === "123456") {
      const ok = await handleToggleMfa(true);
      if (ok) {
        setShow2faSetup(false);
        setOtpCode("");
      } else {
        setOtpError("Failed to enable MFA on server.");
      }
    } else {
      setOtpError("Invalid verification token. Try: 123456");
    }
  };

  const handleDisable2FA = async () => {
    if (
      confirm("Are you sure you want to disable Two-Factor Authentication?")
    ) {
      const ok = await handleToggleMfa(false);
      if (!ok) {
        alert("Failed to disable MFA on server.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Security Audit Score Dashboard */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 relative flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Security Integrity Score
            </h4>
            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">
              Automated workspace safety checklist review
            </p>
          </div>
        </div>

        {/* Dynamic grade badge */}
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  is2faEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="text-neutral-400 font-bold">
                2FA: {is2faEnabled ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 font-semibold font-mono">
              Sessions Limit: {sessions.length} / 5 active
            </div>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
              scoreLabel().color
            }`}
          >
            {scoreLabel().grade}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change password section */}
        <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

          <div className="space-y-1 mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Update Account Password
            </h3>
            <p className="text-xs text-neutral-400 font-semibold">
              Provide credentials to modify key security levels
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl text-center mb-5">
              Account security password successfully updated!
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl text-center mb-5">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordState.current}
                  onChange={(e) =>
                    setPasswordState((prev) => ({
                      ...prev,
                      current: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    New Secure Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase cursor-pointer"
                  >
                    Generate Secure
                  </button>
                </div>
                <input
                  type="password"
                  value={passwordState.new}
                  onChange={(e) =>
                    setPasswordState((prev) => ({
                      ...prev,
                      new: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all font-mono"
                />

                {/* Password strength checklist and bar */}
                {passwordState.new && (
                  <div className="space-y-2 mt-2 bg-black/20 p-3 rounded-2xl border border-white/5 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-400 font-semibold">
                        Strength:{" "}
                        <span className="font-bold text-white">
                          {passwordStrength.label}
                        </span>
                      </span>
                      <span className="text-neutral-500 font-mono font-bold">
                        {passwordStrength.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-semibold text-neutral-500 mt-1">
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            pwRequirements.length
                              ? "text-emerald-400"
                              : "text-neutral-600"
                          }
                        >
                          ●
                        </span>
                        <span
                          className={
                            pwRequirements.length ? "text-neutral-300" : ""
                          }
                        >
                          Min 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            pwRequirements.uppercase
                              ? "text-emerald-400"
                              : "text-neutral-600"
                          }
                        >
                          ●
                        </span>
                        <span
                          className={
                            pwRequirements.uppercase ? "text-neutral-300" : ""
                          }
                        >
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            pwRequirements.number
                              ? "text-emerald-400"
                              : "text-neutral-600"
                          }
                        >
                          ●
                        </span>
                        <span
                          className={
                            pwRequirements.number ? "text-neutral-300" : ""
                          }
                        >
                          Number (0-9)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={
                            pwRequirements.special
                              ? "text-emerald-400"
                              : "text-neutral-600"
                          }
                        >
                          ●
                        </span>
                        <span
                          className={
                            pwRequirements.special ? "text-neutral-300" : ""
                          }
                        >
                          Special symbol
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordState.confirm}
                  onChange={(e) =>
                    setPasswordState((prev) => ({
                      ...prev,
                      confirm: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-xs cursor-pointer shadow-sm active:scale-95 duration-300"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication (2FA) setup card */}
        <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

          <div className="space-y-1.5 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-neutral-400 font-semibold">
              Secure your comic workspace uploads with secondary mobile auth
              keys
            </p>
          </div>

          {is2faEnabled ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                <span>2FA Protection Active</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
                Secondary biometric codes are required to perform exports and
                settings edits.
              </p>
              <button
                onClick={handleDisable2FA}
                className="w-full bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
              >
                Deactivate 2FA
              </button>
            </div>
          ) : (
            <div className="p-4 bg-neutral-900/40 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>2FA Deactivated</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">
                Enable MFA to protect developer API scopes and storyboard data
                caches.
              </p>

              {!show2faSetup ? (
                <button
                  onClick={() => setShow2faSetup(true)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all cursor-pointer"
                >
                  Configure 2FA Protection
                </button>
              ) : (
                <form
                  onSubmit={handleVerify2FA}
                  className="space-y-4 pt-2 border-t border-white/5 animate-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center gap-3">
                    {/* Simulated visual QR code */}
                    <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#000_30%,_transparent_35%)] bg-[size:6px_6px]" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">
                        Secret: AV_2FA_SEC_99A
                      </span>
                      <p className="text-[9px] text-neutral-500 font-semibold">
                        Scan with Google Authenticator or scan demo token code{" "}
                        <strong>123456</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter 6-digit code"
                      className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs text-white focus:outline-none font-mono text-center tracking-[0.2em]"
                    />
                    {otpError && (
                      <p className="text-[9px] text-rose-400 font-bold ml-1">
                        {otpError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShow2faSetup(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Verify & Activate
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session management section */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative space-y-5">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Active Login Sessions
          </h3>
          <p className="text-xs text-neutral-400 font-semibold">
            View and manage sessions currently signed into your studio account
          </p>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    {sess.browser}
                    {sess.active && (
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    IP: {sess.ip} • Location: {sess.location}
                  </div>
                </div>
              </div>

              {!sess.active && (
                <button
                  onClick={() => handleTerminateSession(sess.id)}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Terminate Session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Audit Log Section */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative space-y-5">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Security Audit Log
            </h3>
            <p className="text-xs text-neutral-400 font-semibold">
              Track authentication events, profile changes, and API revisions
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search event or IP..."
              className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <th className="py-3 px-2">Event</th>
                <th className="py-3 px-2">IP Address</th>
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-neutral-300">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-neutral-500 font-semibold"
                  >
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-2 font-semibold text-white">
                      {log.event}
                    </td>
                    <td className="py-3 px-2 font-mono text-[10px] text-neutral-400">
                      {log.ip}
                    </td>
                    <td className="py-3 px-2 text-neutral-500">{log.date}</td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-[10px] text-neutral-500 font-semibold">
              Page {currentPage} of {totalPages} ({totalLogsCount} events)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="py-1 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 border border-white/5 rounded-lg text-[10px] text-white font-bold transition-all cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="py-1 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-neutral-900 border border-white/5 rounded-lg text-[10px] text-white font-bold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
