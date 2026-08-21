import React, { useState, useEffect } from "react";
import {
  Coins,
  CreditCard,
  History,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface AICreditWalletPageProps {
  addNotification?: (msg: string, type?: string) => void;
}

const CREDIT_PACKAGES = [
  { id: "starter", name: "Creator Starter", credits: 500, price: "$5", badge: "Popular", features: ["~100 Comic Chapters", "Standard Vision & Narration"] },
  { id: "pro", name: "Pro Studio", credits: 2000, price: "$18", badge: "Best Value", features: ["~450 Comic Chapters", "Ultra-Fast Groq & Claude 3.5 Access", "Priority Queue"] },
  { id: "enterprise", name: "Studio Ultra", credits: 10000, price: "$75", badge: "Maximum Power", features: ["~2,500 Comic Chapters", "Unlimited Multi-Speaker Audio", "Dedicated GPU Inpainting"] },
];

export default function AICreditWalletPage({ addNotification }: AICreditWalletPageProps) {
  const [balance, setBalance] = useState<number>(1000);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const res = await fetch("/api/v1/ai/wallet/balance");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setBalance(data.available_credits ?? 1000);
            setTransactions(data.transactions || []);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadWallet();
  }, []);

  const handleTopup = (pkg: any) => {
    addNotification?.(`Simulating checkout for ${pkg.name} (${pkg.credits} credits)`, "info");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-indigo-500 opacity-90" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4" /> Credit Wallet &amp; Billing
            </h3>
            <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              Active Wallet
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
            AI Credits &amp; Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono">
            Check your current Sonikoma credit balance, purchase generation tokens, and view transaction receipts.
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-neutral-400 font-mono uppercase font-bold block">Available Balance</span>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="w-7 h-7 text-purple-400" />
            <span className="text-3xl font-black text-white font-mono">{balance.toLocaleString()}</span>
            <span className="text-sm text-neutral-400 font-mono">Credits</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-neutral-400 font-mono block">Estimated Capacity</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">~{Math.round(balance / 5)} Storyboards</span>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-white font-sans">{pkg.name}</h3>
                <span className="text-[9px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded-full">
                  {pkg.badge}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono">{pkg.price}</span>
                <span className="text-xs text-neutral-400 font-mono">/ {pkg.credits.toLocaleString()} credits</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300 font-mono pt-2 border-t border-neutral-800">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleTopup(pkg)}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all cursor-pointer shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 font-sans"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Purchase Package</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
