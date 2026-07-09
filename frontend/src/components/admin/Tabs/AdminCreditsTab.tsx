import React, { useState, useEffect } from "react";
import {
  Coins,
  Search,
  Plus,
  Minus,
  User,
  History,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Download,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Users,
} from "lucide-react";

interface AdminCreditsTabProps {
  fetchWithInterceptor: any;
  addNotification: any;
}

export function AdminCreditsTab({
  fetchWithInterceptor,
  addNotification,
}: AdminCreditsTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerFilterType, setLedgerFilterType] = useState("all"); // 'all' | 'additions' | 'deductions'
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");
  
  // Grant Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  // Pagination state
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Transaction table state
  const [transactionSort, setTransactionSort] = useState<{
    key: "user_id" | "feature_name" | "amount" | "created_at";
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const [showSelectedUserOnly, setShowSelectedUserOnly] = useState(false);

  // Statistics state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalTransactions: 0,
    totalAdded: 0,
    totalDeducted: 0,
  });

  const [monthSummary, setMonthSummary] = useState({
    added: 0,
    deducted: 0,
    net: 0,
  });
  const [dailySummary, setDailySummary] = useState({
    added: 0,
    deducted: 0,
    net: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
  }, [offset]);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          
          // Calculate stats
          const totalBal = data.users.reduce((acc: number, u: any) => acc + (u.credits || 0), 0);
          setStats((prev) => ({
            ...prev,
            totalUsers: data.users.length,
            totalBalance: totalBal,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/db/query?table=credit_transactions&limit=${limit}&offset=${offset}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTransactions(data.data);
          setHasMore(data.data.length === limit);
          const pageAdded = data.data.reduce(
            (acc: number, tx: any) => acc + (tx.amount > 0 ? tx.amount : 0),
            0
          );
          const pageDeducted = data.data.reduce(
            (acc: number, tx: any) => acc + (tx.amount < 0 ? Math.abs(tx.amount) : 0),
            0
          );
          const now = new Date();
          const monthAdded = data.data.reduce((acc: number, tx: any) => {
            const created = new Date(tx.created_at);
            return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
              ? acc + (tx.amount > 0 ? tx.amount : 0)
              : acc;
          }, 0);
          const monthDeducted = data.data.reduce((acc: number, tx: any) => {
            const created = new Date(tx.created_at);
            return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
              ? acc + (tx.amount < 0 ? Math.abs(tx.amount) : 0)
              : acc;
          }, 0);
          const today = new Date();
          const dayAdded = data.data.reduce((acc: number, tx: any) => {
            const created = new Date(tx.created_at);
            return created.toDateString() === today.toDateString()
              ? acc + (tx.amount > 0 ? tx.amount : 0)
              : acc;
          }, 0);
          const dayDeducted = data.data.reduce((acc: number, tx: any) => {
            const created = new Date(tx.created_at);
            return created.toDateString() === today.toDateString()
              ? acc + (tx.amount < 0 ? Math.abs(tx.amount) : 0)
              : acc;
          }, 0);
          setStats((prev) => ({
            ...prev,
            totalTransactions: data.data.length,
            totalAdded: pageAdded,
            totalDeducted: pageDeducted,
          }));
          setMonthSummary({
            added: monthAdded,
            deducted: monthDeducted,
            net: monthAdded - monthDeducted,
          });
          setDailySummary({
            added: dayAdded,
            deducted: dayDeducted,
            net: dayAdded - dayDeducted,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch credit transactions", err);
      addNotification("Failed to load global transaction log", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSortTransactions = (key: "user_id" | "feature_name" | "amount" | "created_at") => {
    setTransactionSort((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const resetLedgerFilters = () => {
    setLedgerSearchQuery("");
    setLedgerFilterType("all");
    setLedgerStartDate("");
    setLedgerEndDate("");
    setShowSelectedUserOnly(false);
  };

  const handleRefreshLedger = () => {
    fetchUsers();
    fetchTransactions();
  };

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === 0) {
      addNotification("Adjustment amount cannot be zero", "warning");
      return;
    }

    if (bulkMode) {
      if (filteredUsers.length === 0) {
        addNotification("No users match the search filters for bulk adjustment", "warning");
        return;
      }
      if (!confirm(`Apply this credit adjustment to ${filteredUsers.length} users?`)) {
        return;
      }
      setIsSubmitting(true);
      let successCount = 0;
      for (const u of filteredUsers) {
        try {
          const res = await fetchWithInterceptor(
            `/api/auth/admin/users/${u.id}/add-credits`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount,
                reason: reason.trim() || "Bulk admin credit adjustment",
              }),
            }
          );
          if (res.ok) successCount++;
        } catch (err) {
          console.error("Failed bulk grant for", u.email, err);
        }
      }
      addNotification(`Bulk adjustment complete: ${successCount}/${filteredUsers.length} succeeded`, "success");
      setReason("");
      fetchUsers();
      fetchTransactions();
      setIsSubmitting(false);
      return;
    }

    if (!selectedUserId) {
      addNotification("Please select a target user", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithInterceptor(
        `/api/auth/admin/users/${selectedUserId}/add-credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: reason.trim() || "Manual adjustment by Admin",
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        addNotification(data.message || `Successfully adjusted user balance.`, "success");
        setReason("");
        fetchUsers();
        fetchTransactions();
      } else {
        const err = await res.json();
        addNotification(err.detail || "Failed to update credits", "error");
      }
    } catch (err) {
      addNotification("Failed to connect to adjustment API", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users search mapping
  const filteredUsers = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedUserObj = users.find((u) => u.id === selectedUserId);

  // Filtered Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const searchTerm = ledgerSearchQuery.toLowerCase();
    const matchesSearch =
      String(tx.id).toLowerCase().includes(searchTerm) ||
      tx.user_id.toLowerCase().includes(searchTerm) ||
      tx.feature_name.toLowerCase().includes(searchTerm);

    const matchesType =
      ledgerFilterType === "all" ||
      (ledgerFilterType === "additions" && tx.amount > 0) ||
      (ledgerFilterType === "deductions" && tx.amount < 0);

    const matchesSelectedUser =
      !showSelectedUserOnly ||
      !selectedUserId ||
      tx.user_id === selectedUserId;

    const transactionTime = new Date(tx.created_at).getTime();
    const startTime = ledgerStartDate ? new Date(ledgerStartDate).getTime() : null;
    const endTime = ledgerEndDate ? new Date(ledgerEndDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const matchesDateRange =
      (!startTime || transactionTime >= startTime) &&
      (!endTime || transactionTime <= endTime);

    return matchesSearch && matchesType && matchesSelectedUser && matchesDateRange;
  });

  const sortedTransactions = React.useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[transactionSort.key];
      const bValue = b[transactionSort.key];

      if (transactionSort.key === "amount") {
        return transactionSort.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (transactionSort.key === "created_at") {
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return transactionSort.direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      return transactionSort.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredTransactions, transactionSort]);

  const transactionSummary = React.useMemo(() => {
    return filteredTransactions.reduce(
      (summary, tx) => {
        if (tx.amount > 0) {
          summary.totalAdded += tx.amount;
          summary.addedCount += 1;
        } else if (tx.amount < 0) {
          summary.totalDeducted += Math.abs(tx.amount);
          summary.deductedCount += 1;
        }
        return summary;
      },
      { totalAdded: 0, totalDeducted: 0, addedCount: 0, deductedCount: 0 }
    );
  }, [filteredTransactions]);

  // Dynamic Credits Consumption breakdown calculations
  const creditUsageBreakdown = React.useMemo(() => {
    const usageMap: { [key: string]: number } = {};
    let totalUsage = 0;
    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        const absVal = Math.abs(tx.amount);
        // group by prefix or exact name
        const key = tx.feature_name.split(":")[0];
        usageMap[key] = (usageMap[key] || 0) + absVal;
        totalUsage += absVal;
      }
    });

    return Object.entries(usageMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalUsage > 0 ? Math.round((value / totalUsage) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // At risk users (balance < 20)
  const lowBalanceUsers = React.useMemo(() => {
    return users.filter((u) => (u.credits !== undefined ? u.credits : u.credit_balance) < 20);
  }, [users]);

  // Filtered transactions specific to the currently selected user
  const selectedUserTransactions = transactions.filter(
    (tx) => tx.user_id === selectedUserId
  );

  const selectedUserActivitySummary = React.useMemo(() => {
    return selectedUserTransactions.reduce(
      (summary, tx) => {
        if (tx.amount > 0) {
          summary.totalAdded += tx.amount;
          summary.addedCount += 1;
        } else if (tx.amount < 0) {
          summary.totalDeducted += Math.abs(tx.amount);
          summary.deductedCount += 1;
        }
        return summary;
      },
      { totalAdded: 0, totalDeducted: 0, addedCount: 0, deductedCount: 0 }
    );
  }, [selectedUserTransactions]);

  // Quick Preset Adders
  const presets = [
    { label: "+10", value: 10 },
    { label: "+50", value: 50 },
    { label: "+100", value: 100 },
    { label: "+500", value: 500 },
    { label: "-10", value: -10 },
    { label: "-50", value: -50 },
    { label: "-100", value: -100 },
  ];

  const reasonPresets = [
    "Support grant",
    "Refund",
    "Compensation",
    "Promo award",
    "Fraud correction",
  ];

  // CSV Export utility
  const exportToCSV = () => {
    if (sortedTransactions.length === 0) return;
    const headers = ["Transaction ID", "User ID", "Feature / Reason", "Amount", "Timestamp"];
    const rows = sortedTransactions.map((tx) => [
      tx.id,
      tx.user_id,
      tx.feature_name,
      tx.amount,
      new Date(tx.created_at).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credit_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSelectedUserCSV = () => {
    if (!selectedUserId || selectedUserTransactions.length === 0) return;
    const headers = ["Transaction ID", "User ID", "Feature / Reason", "Amount", "Timestamp"];
    const rows = selectedUserTransactions.map((tx) => [
      tx.id,
      tx.user_id,
      tx.feature_name,
      tx.amount,
      new Date(tx.created_at).toISOString(),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `credit_ledger_${selectedUserId}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTodayCSV = () => {
    const todayStr = new Date().toDateString();
    const todayRows = sortedTransactions.filter(
      (tx) => new Date(tx.created_at).toDateString() === todayStr
    );
    if (todayRows.length === 0) return;

    const headers = ["Transaction ID", "User ID", "Feature / Reason", "Amount", "Timestamp"];
    const rows = todayRows.map((tx) => [
      tx.id,
      tx.user_id,
      tx.feature_name,
      tx.amount,
      new Date(tx.created_at).toISOString(),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `credit_ledger_today_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      
      {/* ── Header / Intro ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-purple-400" />
            Credits System Management
          </h2>
          <p className="text-xs text-neutral-400 font-semibold mt-1">
            Global ledger inspection, balance administration, and manual credit grants.
          </p>
        </div>
      </div>

      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">System Users</h3>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Users registered on ledger</p>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Total Balance</h3>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalBalance.toLocaleString()} <span className="text-xs text-neutral-500 font-normal">Credits</span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Sum of all current user balances</p>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Loaded Operations</h3>
          </div>
          <div className="text-2xl font-black text-white">
            {transactions.length}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">Audit logs loaded in memory</p>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">This Month</h3>
          </div>
          <div className="text-2xl font-black text-white">
            {monthSummary.net >= 0 ? "+" : ""}{monthSummary.net.toLocaleString()}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            +{monthSummary.added.toLocaleString()} / -{monthSummary.deducted.toLocaleString()}
          </p>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium text-sm">Today</h3>
          </div>
          <div className="text-2xl font-black text-white">
            {dailySummary.net >= 0 ? "+" : ""}{dailySummary.net.toLocaleString()}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            +{dailySummary.added.toLocaleString()} / -{dailySummary.deducted.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── Two-Column High-Level Analytics: Breakdown & At Risk ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Credit Consumption Breakdown Panel */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-neutral-800 pb-3">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            Credit Consumption Breakdown (by Feature)
          </h3>
          <div className="space-y-3">
            {creditUsageBreakdown.length === 0 ? (
              <p className="text-xs text-neutral-500 italic text-center py-6">No usage logs loaded.</p>
            ) : (
              creditUsageBreakdown.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-neutral-350">
                    <span>{item.name}</span>
                    <span className="font-mono text-neutral-400">
                      {item.value.toLocaleString()} credits ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-850">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* At-Risk Users Panel */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Users className="w-4 h-4 text-rose-450" />
            At-Risk Users (Credits Below Threshold)
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {lowBalanceUsers.length === 0 ? (
              <p className="text-xs text-neutral-500 italic text-center py-6">No at-risk users detected!</p>
            ) : (
              lowBalanceUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex justify-between items-center bg-[#0b0b0e] border border-neutral-850 rounded-lg p-2.5 hover:bg-neutral-900 transition-all cursor-pointer ${
                    selectedUserId === u.id ? "ring-1 ring-purple-500/50 border-purple-500/50" : ""
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-200">{u.full_name || "Anonymous"}</p>
                    <p className="text-[10px] text-neutral-500">{u.email}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-mono font-black border border-rose-500/20">
                    {u.credits !== undefined ? u.credits : u.credit_balance} credits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Column 1 & 2: Global Transaction Log ── */}
        <div className="lg:col-span-2 bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            {/* Filters Bar */}
            <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-purple-400" />
                Global Transaction Ledger
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search ID/Feature..."
                    value={ledgerSearchQuery}
                    onChange={(e) => setLedgerSearchQuery(e.target.value)}
                    className="bg-[#111115] border border-neutral-800 text-[11px] text-neutral-200 rounded-lg pl-7 pr-3 py-1 focus:outline-none focus:border-purple-500/50 w-36"
                  />
                </div>

                <select
                  value={ledgerFilterType}
                  onChange={(e) => setLedgerFilterType(e.target.value)}
                  className="bg-[#111115] border border-neutral-800 text-[11px] text-neutral-350 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="all">All Tx</option>
                  <option value="additions">Additions</option>
                  <option value="deductions">Deductions</option>
                </select>

                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="bg-[#111115] border border-neutral-800 text-[11px] text-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500/50"
                />

                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="bg-[#111115] border border-neutral-800 text-[11px] text-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500/50"
                />

                <label className="inline-flex items-center gap-2 text-[11px] text-neutral-300 px-2 py-1 rounded-lg border border-neutral-800 bg-[#111115] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSelectedUserOnly}
                    onChange={(e) => setShowSelectedUserOnly(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-purple-500 bg-[#111115] border-neutral-700 rounded"
                  />
                  <span>Selected user only</span>
                </label>

                <button
                  type="button"
                  onClick={resetLedgerFilters}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-bold transition-all"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleRefreshLedger}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold transition-all"
                >
                  Refresh
                </button>

                <button
                  onClick={exportToCSV}
                  disabled={sortedTransactions.length === 0}
                  className="p-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Export filtered ledger to CSV"
                >
                  <Download className="w-3 h-3" /> Export
                </button>

                <button
                  onClick={exportTodayCSV}
                  disabled={sortedTransactions.filter((tx) => new Date(tx.created_at).toDateString() === new Date().toDateString()).length === 0}
                  className="p-1 px-2.5 bg-sky-700 hover:bg-sky-600 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Export today's transactions to CSV"
                >
                  <Download className="w-3 h-3" /> Today
                </button>
              </div>
            </div>

            <div className="space-y-3 px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-neutral-300">
                <div className="bg-[#111115] border border-neutral-800 rounded-xl p-3">
                  <p className="text-neutral-500 uppercase tracking-widest mb-1">Matching records</p>
                  <p className="font-bold text-white">{filteredTransactions.length}</p>
                </div>
                <div className="bg-[#111115] border border-neutral-800 rounded-xl p-3">
                  <p className="text-neutral-500 uppercase tracking-widest mb-1">Net movement</p>
                  <p className="font-bold text-white">
                    {transactionSummary.totalAdded - transactionSummary.totalDeducted} credits
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#0b0b0e]/50 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider font-semibold sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortTransactions("user_id")}> 
                      <div className="flex items-center gap-1">
                        User ID
                        {transactionSort.key === "user_id" && (
                          transactionSort.direction === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortTransactions("feature_name")}> 
                      <div className="flex items-center gap-1">
                        Feature / Reason
                        {transactionSort.key === "feature_name" && (
                          transactionSort.direction === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortTransactions("amount")}> 
                      <div className="flex items-center gap-1">
                        Amount
                        {transactionSort.key === "amount" && (
                          transactionSort.direction === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortTransactions("created_at")}> 
                      <div className="flex items-center gap-1">
                        Timestamp
                        {transactionSort.key === "created_at" && (
                          transactionSort.direction === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {loading && transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                        Loading transaction ledger...
                      </td>
                    </tr>
                  ) : sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 italic">
                        No transactions match search filter.
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                          selectedUserId === tx.user_id ? "bg-purple-500/10" : ""
                        }`}
                        onClick={() => setSelectedUserId(tx.user_id)}
                      >
                        <td className="px-5 py-3.5 font-mono text-neutral-400 text-[10px]">
                          {tx.user_id}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-neutral-200">
                          {tx.feature_name}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              tx.amount >= 0
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {tx.amount >= 0 ? "+" : ""}
                            {tx.amount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 text-[10px]">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Pagination Controls */}
          <div className="p-4 border-t border-neutral-800 bg-[#0b0b0e] flex items-center justify-between text-xs">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-all"
            >
              Previous
            </button>
            <span className="text-neutral-500 font-mono text-[10px]">
              Offset: {offset} (Loaded: {filteredTransactions.length})
            </span>
            <button
              onClick={() => setOffset((o) => o + limit)}
              disabled={!hasMore}
              className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold transition-all"
            >
              Next
            </button>
          </div>
        </div>

        {/* ── Column 3: Manual adjustment panel ── */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-400" />
                {bulkMode ? "Bulk Adjustment Console" : "Manual Adjustment Console"}
              </h3>
              
              {/* Bulk Mode Toggle */}
              <label className="inline-flex items-center gap-2 text-[10px] text-neutral-400 uppercase tracking-wider font-bold cursor-pointer bg-neutral-900 border border-neutral-850 px-2 py-1 rounded-lg hover:text-white transition-all">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  className="form-checkbox h-3.5 w-3.5 text-purple-500 bg-[#111115] border-neutral-700 rounded"
                />
                <span>Bulk Mode</span>
              </label>
            </div>

            {/* Target User Search & Selection */}
            {!bulkMode ? (
              <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                  Select target user
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search user email/name..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-[#0b0b0e] border border-neutral-800 text-xs text-neutral-200 rounded-lg pl-8 pr-3 py-2.5 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-xs text-neutral-200 rounded-lg p-2.5 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">-- Choose User --</option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.full_name || "No Name"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-[#0b0b0e] border border-neutral-850 rounded-lg p-3 text-xs space-y-2">
                <p className="text-[10px] uppercase font-bold text-neutral-400">
                  Bulk Mode Active
                </p>
                <div className="text-neutral-350 text-[11px] leading-relaxed">
                  Adjustments will apply to all <strong>{filteredUsers.length} users</strong> currently matching the left-hand search filter.
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Filter target users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full bg-[#111115] border border-neutral-800 text-[11px] text-neutral-250 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            )}

            {/* Selection display */}
            {!bulkMode && selectedUserObj && (
              <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-lg p-3.5 text-xs space-y-2 relative">
                <div className="absolute top-2 right-2 text-[9px] uppercase font-bold tracking-widest text-neutral-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                  Current Bal
                </div>
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  {selectedUserObj.full_name || "Anonymous"}
                </div>
                <div className="text-[10px] text-neutral-500">{selectedUserObj.email}</div>
                <div className="text-emerald-400 font-black pt-1 flex items-center gap-1 font-mono">
                  <Coins className="w-3.5 h-3.5" />
                  {selectedUserObj.credits.toLocaleString()} Credits
                </div>

                {/* Selected user recent transactions */}
                {selectedUserTransactions.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2 border-t border-neutral-800 pt-2.5 mt-2 text-[9px] uppercase font-black text-neutral-500 tracking-wider">
                      <div className="bg-[#111115] border border-neutral-800 rounded-xl p-2">
                        <p className="text-neutral-400">Added</p>
                        <p className="font-bold text-emerald-400">+{selectedUserActivitySummary.totalAdded}</p>
                        <p className="text-neutral-500 text-[9px]">{selectedUserActivitySummary.addedCount} tx</p>
                      </div>
                      <div className="bg-[#111115] border border-neutral-800 rounded-xl p-2">
                        <p className="text-neutral-400">Deducted</p>
                        <p className="font-bold text-red-400">-{selectedUserActivitySummary.totalDeducted}</p>
                        <p className="text-neutral-500 text-[9px]">{selectedUserActivitySummary.deductedCount} tx</p>
                      </div>
                    </div>
                    <div className="border-t border-neutral-800 pt-2.5 mt-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] uppercase font-black text-neutral-500 tracking-wider">
                          Recent Activity For User
                        </p>
                        <button
                          type="button"
                          onClick={exportSelectedUserCSV}
                          className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[9px] font-bold transition-all"
                        >
                          Export CSV
                        </button>
                      </div>
                      <div className="space-y-1">
                        {selectedUserTransactions.slice(0, 3).map((tx) => (
                          <div key={tx.id} className="flex justify-between text-[10px] text-neutral-400 font-mono">
                            <span className="truncate w-24">{tx.feature_name}</span>
                            <span className={tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {tx.amount >= 0 ? "+" : ""}
                              {tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Adjust Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">
                Adjustment Amount
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmount((a) => -Math.abs(a))}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    amount < 0
                      ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
                      : "bg-[#0b0b0e] border-neutral-800 text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Deduct
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((a) => Math.abs(a))}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    amount >= 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-[#0b0b0e] border-neutral-800 text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Presets Row */}
              <div className="flex flex-wrap gap-1 mt-1 justify-between">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setAmount(preset.value);
                    }}
                    className={`px-1.5 py-1 text-[9px] font-bold font-mono rounded border transition-all cursor-pointer ${
                      amount === preset.value
                        ? preset.value >= 0
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-red-500/20 border-red-500 text-red-300"
                        : "bg-[#0b0b0e]/60 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={Math.abs(amount)}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0);
                  setAmount(amount < 0 ? -val : val);
                }}
                className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-xs text-white font-mono text-center focus:border-purple-500/50 outline-none"
              />
            </div>

            {/* Justification Reason */}
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block">
                Reason / Justification
              </label>
              <div className="flex flex-wrap gap-2">
                {reasonPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setReason(preset)}
                    className="px-2 py-1 text-[10px] text-neutral-200 rounded-lg border border-neutral-800 bg-[#0b0b0e] hover:bg-neutral-900 transition-all"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Support ticket # or grant details..."
                className="w-full bg-[#0b0b0e] border border-neutral-800 rounded-lg p-2.5 text-xs text-white h-20 focus:border-purple-500/50 outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-3">
            {amount < 0 && selectedUserObj && selectedUserObj.credits < Math.abs(amount) && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 flex items-center gap-2 text-[10px] text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Deduction exceeds user balance. User will drop to negative.
              </div>
            )}

            <button
              onClick={handleGrantCredits}
              disabled={isSubmitting || (!bulkMode && !selectedUserId) || amount === 0}              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/10"
            >
              {isSubmitting ? "Processing..." : `Execute Adjustment (${amount >= 0 ? "+" : ""}${amount})`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
