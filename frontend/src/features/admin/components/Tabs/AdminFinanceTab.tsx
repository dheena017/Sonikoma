import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
} from "lucide-react";

export function AdminFinanceTab({ fetchWithInterceptor, analytics }: any) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetchWithInterceptor(
        "/api/auth/admin/db/query?table=user_invoices&limit=50"
      );
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.data || []);
      }
    } catch (err) {
      console.error("Finance fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">Monthly Revenue</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${(analytics?.mrr || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+15% vs last month</span>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">Active Subs</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics?.active_subscriptions || 0}
          </div>
          <div className="text-xs text-neutral-500">Premium & Studio plans</div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">Churn Rate</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {analytics?.churn_rate || 0}%
          </div>
          <div className="text-xs text-neutral-500">30-day average</div>
        </div>
      </div>

      <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Transaction
            Ledger
          </h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-all flex items-center gap-1.5">
              <Download className="w-3 h-3" /> Export Tax CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-black/20 text-neutral-400 border-b border-neutral-800 uppercase tracking-tighter font-bold">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {invoices.map((inv, i) => (
                <tr key={i} className="hover:bg-white/[0.02] group">
                  <td className="px-6 py-4 text-neutral-300 font-mono">
                    {inv.invoice_id}
                  </td>
                  <td className="px-6 py-4 text-neutral-500 font-mono">
                    {inv.user_id.substring(0, 12)}...
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status.toLowerCase() === "paid"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {inv.status.toLowerCase() === "paid" ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-neutral-500 italic"
                  >
                    No transactions found in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
