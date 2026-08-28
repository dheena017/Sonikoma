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
    <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200 text-left text-[#E5E5E5]">
      {/* ── MAIN COVER WRAPPER CARD ── */}
      <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F]">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight font-sans">
              AI Credits &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF]">
                Subscriptions
              </span>
            </h1>
            <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
              Check your current Sonikoma credit balance, purchase generation tokens, and view transaction receipts.
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div>
            <span className="text-xs text-[#9CA3AF] font-mono uppercase font-bold block">Available Balance</span>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-7 h-7 text-[#F59E0B]" />
              <span className="text-3xl font-black text-[#E5E5E5] font-mono">{balance.toLocaleString()}</span>
              <span className="text-sm text-[#9CA3AF] font-mono">Credits</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#9CA3AF] font-mono block">Estimated Capacity</span>
            <span className="text-sm font-bold text-[#10B981] font-mono">~{Math.round(balance / 5)} Storyboards</span>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] p-5 space-y-4 hover:border-[#3B82F6]/50 hover:bg-[#242424] transition-all flex flex-col justify-between shadow-md"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-[#E5E5E5] font-sans">{pkg.name}</h3>
                  <span className="text-[9px] font-mono font-bold bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded-full">
                    {pkg.badge}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#E5E5E5] font-mono">{pkg.price}</span>
                  <span className="text-xs text-[#9CA3AF] font-mono">/ {pkg.credits.toLocaleString()} credits</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#E5E5E5] font-mono pt-2 border-t border-[#2F2F2F]">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleTopup(pkg)}
                className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-sans active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Purchase Package</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
