import React from "react";
import {
  Gift,
  Plus,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Ticket,
} from "lucide-react";

interface ProfileBillingTabProps {
  credits: number;
  hasClaimedToday: boolean;
  handleClaimCredits: () => void;
  claimNotification: boolean;
  invoices: { id: string; date: string; amount: number; status: string }[];
}

export default function ProfileBillingTab({
  credits,
  hasClaimedToday,
  handleClaimCredits,
  claimNotification,
  invoices,
}: ProfileBillingTabProps) {
  const [currency, setCurrency] = React.useState<"USD" | "KRW" | "JPY">("USD");
  
  // Local state for daily streak claiming tracker
  const [streakDays, setStreakDays] = React.useState<number>(() => {
    return parseInt(localStorage.getItem("app-claim-streak") || "1");
  });

  const onClaimClick = () => {
    handleClaimCredits();
    const nextStreak = streakDays >= 7 ? 1 : streakDays + 1;
    localStorage.setItem("app-claim-streak", String(nextStreak));
    setStreakDays(nextStreak);
  };

  const [couponCode, setCouponCode] = React.useState("");
  const [couponStatus, setCouponStatus] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0); // percentage

  // Interactive custom credits volume states
  const [customCredits, setCustomCredits] = React.useState(500);

  // Saved credit card states
  const [cardNo, setCardNo] = React.useState("");
  const [cardHolder, setCardHolder] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [isCardSaved, setIsCardSaved] = React.useState(false);

  // Currency converter formatting helper
  const formatPrice = (baseUSD: number) => {
    const rate = {
      USD: { symbol: "$", value: 1, suffix: "/mo" },
      KRW: { symbol: "₩", value: 1300, suffix: "/월" },
      JPY: { symbol: "¥", value: 150, suffix: "/月" },
    };

    const curr = rate[currency];
    const converted = Math.round(baseUSD * curr.value * (1 - discount / 100));
    return `${curr.symbol}${converted.toLocaleString()}${curr.suffix}`;
  };

  // Custom credits purchase price formatter
  const getCustomPrice = () => {
    const baseUSD = customCredits * 0.02;
    const rate = {
      USD: { symbol: "$", value: 1 },
      KRW: { symbol: "₩", value: 1300 },
      JPY: { symbol: "¥", value: 150 },
    };
    const curr = rate[currency];
    const converted = Math.round(baseUSD * curr.value * (1 - discount / 100));
    return `${curr.symbol}${converted.toLocaleString()}`;
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponStatus(null);
    if (couponCode.trim().toUpperCase() === "COMIC50") {
      setDiscount(50);
      setCouponStatus("Promo Code Applied: 50% discount locked!");
    } else {
      setDiscount(0);
      setCouponStatus("Invalid promo code. Try: COMIC50");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Plan details and currency switchers */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              Subscription Plan
            </span>
            <h3 className="text-2xl font-black text-white">
              Creator Studio Free Tier
            </h3>
            <p className="text-xs text-neutral-500 font-semibold">
              Includes 1000 rendering credits per month with core scraping tools
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Currency toggle */}
            <div className="flex items-center gap-1 bg-neutral-900 border border-white/5 p-1 rounded-xl">
              {(["USD", "KRW", "JPY"] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`py-1 px-2.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                    currency === curr
                      ? "bg-purple-600/15 border border-purple-500/30 text-purple-400"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              onClick={() => alert("Premium upgrade payment modal triggered!")}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-purple-900/30 text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 duration-300"
            >
              <Plus className="w-4 h-4" />
              Upgrade to Studio Pro
            </button>
          </div>
        </div>

        {/* Claim Daily bonus credits - Streak Tracker */}
        <div className="pt-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Gift className="w-4.5 h-4.5 text-amber-400 font-bold" />
                Daily Claim Streak Tracker
              </div>
              <p className="text-xs text-neutral-400 font-semibold font-sans">
                Claim consecutive daily credits to unlock the Mega Claim Bonus on Day 7 (+150 credits!).
              </p>
            </div>

            <div className="bg-neutral-900/80 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0">
              <span className="text-[9px] text-neutral-500 font-mono uppercase block">Streak</span>
              <span className="text-xs font-black text-amber-400 font-mono">
                {hasClaimedToday ? streakDays - 1 : streakDays - 1} {streakDays - 1 === 1 ? "Day" : "Days"}
              </span>
            </div>
          </div>

          {/* 7 Day Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { day: 1, reward: 50, label: "+50 Credits" },
              { day: 2, reward: 60, label: "+60 Credits" },
              { day: 3, reward: 75, label: "+75 Credits" },
              { day: 4, reward: 90, label: "+90 Credits" },
              { day: 5, reward: 110, label: "+110 Credits" },
              { day: 6, reward: 130, label: "+130 Credits" },
              { day: 7, reward: 150, label: "+150 Mega", special: true }
            ].map((d) => {
              const isClaimed = d.day < streakDays;
              const isActive = d.day === streakDays && !hasClaimedToday;
              const isLocked = d.day > streakDays || (d.day === streakDays && hasClaimedToday);

              return (
                <button
                  key={d.day}
                  type="button"
                  disabled={!isActive}
                  onClick={onClaimClick}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-2 relative min-h-[110px] ${
                    isClaimed
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/80 opacity-80"
                      : isActive
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-400 cursor-pointer animate-pulse shadow-md shadow-amber-900/10"
                      : "bg-[#09090b]/40 border-white/5 text-neutral-600"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider">
                    Day {d.day}
                  </span>

                  <div className="flex items-center justify-center py-1">
                    {isClaimed ? (
                      <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" />
                    ) : d.special ? (
                      <Ticket className={`w-6 h-6 ${isActive ? "text-amber-400 animate-bounce" : "text-neutral-650"}`} />
                    ) : (
                      <Gift className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-neutral-700"}`} />
                    )}
                  </div>

                  <span className="text-[10px] font-black font-mono">
                    {d.label}
                  </span>

                  {/* Status Overlay Badge */}
                  {isActive && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-500 text-[8px] font-black text-neutral-950 rounded-full tracking-wider uppercase">
                      Claim!
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              disabled={hasClaimedToday}
              onClick={onClaimClick}
              className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                hasClaimedToday
                  ? "bg-neutral-900 border-white/5 text-neutral-500 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 border-amber-500/30 text-neutral-950 active:scale-95 shadow-md shadow-amber-950/30"
              }`}
            >
              <Gift className="w-4 h-4" />
              {hasClaimedToday ? "Claimed for today" : `Claim Day ${streakDays} Reward`}
            </button>
          </div>
        </div>

        {claimNotification && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center rounded-xl animate-bounce">
            🚀 Streak bonus claimed! Compute workspace updated.
          </div>
        )}
      </div>

      {/* Subscriptions Grid & Coupon Code Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free Plan */}
        <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
              Free Tier
            </span>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 rounded-full font-bold">
              Active
            </span>
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(0)}</div>
          <ul className="text-[11px] text-neutral-400 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
            <li>Up to 10 webtoon strip scrapes / day</li>
            <li>Row-wise background panel segmentation</li>
            <li>Standard voice synthesizing nodes</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-b from-[#121218]/80 to-[#070709]/80 border border-purple-500/20 rounded-3xl p-6 text-left space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">
              Studio Pro
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 rounded-full font-bold">
              Recommended
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {formatPrice(19)}
          </div>
          <ul className="text-[11px] text-neutral-300 space-y-2 list-disc pl-4 leading-relaxed font-bold">
            <li>Unlimited vertical scrapers & compiles</li>
            <li>1080p / 4K Ultra-HD video compilation</li>
            <li>Advanced character profiles & translation</li>
          </ul>
        </div>

        {/* Coupon Promo code form */}
        <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-left space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 flex items-center gap-1">
              <Ticket className="w-3.5 h-3.5 text-purple-400" />
              Promo Coupons
            </span>
            <p className="text-[10px] text-neutral-500 font-semibold leading-relaxed">
              Enter coupon code to unlock premium subscription discounts
            </p>
          </div>

          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <input
              type="text"
              required
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. COMIC50"
              className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-700 uppercase"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all cursor-pointer"
            >
              Apply Coupon
            </button>
          </form>

          {couponStatus && (
            <div
              className={`text-[10px] font-bold ${
                couponStatus.includes("Applied")
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {couponStatus}
            </div>
          )}
        </div>
      </div>

      {/* Credit Volume Pricing Calculator slider card */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative space-y-5">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Interactive Credit Purchase Calculator
            </h3>
            <p className="text-xs text-neutral-400 font-semibold">
              Slide to estimate pricing for custom rendering volume packages
            </p>
          </div>
          <div className="bg-purple-600/10 border border-purple-500/20 px-4 py-2 rounded-2xl text-purple-400 text-sm font-black font-mono">
            Price: {getCustomPrice()}
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={customCredits}
            onChange={(e) => setCustomCredits(parseInt(e.target.value))}
            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
            <span>100 Credits</span>
            <span className="text-white font-extrabold text-[11px]">
              {customCredits} Credits chosen
            </span>
            <span>5000 Credits</span>
          </div>
        </div>

        <button
          onClick={() =>
            alert(
              `Simulated purchase of ${customCredits} credits for ${getCustomPrice()} triggered!`
            )
          }
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-purple-900/10"
        >
          Purchase Package ({getCustomPrice()})
        </button>
      </div>

      {/* Dynamic Payment Card details and visual layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        {/* Left: Input Form */}
        <div className="space-y-4">
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-white">
              Save Credit Card Info
            </h4>
            <p className="text-xs text-neutral-500 font-semibold">
              Add credit card for automated high-priority rendering upgrades
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 focus:border-purple-500/50 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Card Number
              </label>
              <input
                type="text"
                maxLength={19}
                value={cardNo}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/\D/g, "")
                    .replace(/(.{4})/g, "$1 ")
                    .trim();
                  setCardNo(val);
                }}
                placeholder="4111 2222 3333 4444"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 focus:border-purple-500/50 text-white focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Expiry Date
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length >= 2) {
                      setCardExpiry(
                        val.substring(0, 2) + "/" + val.substring(2, 4)
                      );
                    } else {
                      setCardExpiry(val);
                    }
                  }}
                  placeholder="MM/YY"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 focus:border-purple-500/50 text-white focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  CVV
                </label>
                <input
                  type="password"
                  maxLength={3}
                  value={cardCvv}
                  onChange={(e) =>
                    setCardCvv(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="•••"
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 focus:border-purple-500/50 text-white focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!cardNo || !cardHolder) {
                alert("Please fill card details first!");
                return;
              }
              setIsCardSaved(true);
              alert("Payment method saved successfully!");
            }}
            className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-xl text-xs font-bold transition-all text-white cursor-pointer"
          >
            Save Card Method
          </button>
        </div>

        {/* Right: Graphic Mock Card preview */}
        <div className="flex items-center justify-center p-4">
          <div className="relative w-72 h-44 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 p-6 flex flex-col justify-between text-left text-white shadow-xl shadow-purple-950/20 overflow-hidden font-sans select-none">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                Anivox Premium Pay
              </span>
              <CreditCard className="w-5 h-5 text-white/80" />
            </div>

            <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300/20 shadow-inner flex items-center justify-center">
              <div className="w-4 h-4 border border-black/10 rounded" />
            </div>

            <div className="text-base font-black tracking-widest font-mono text-white/95">
              {cardNo || "•••• •••• •••• ••••"}
            </div>

            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/70">
              <div className="space-y-0.5">
                <span className="text-[7px] text-white/55 block">
                  Card Holder
                </span>
                <span className="font-bold truncate max-w-[150px] block">
                  {cardHolder || "ANIVOX CREATOR"}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[7px] text-white/55 block">Expires</span>
                <span className="font-bold font-mono">
                  {cardExpiry || "MM/YY"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice receipt history table */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 space-y-4">
        <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
          <CreditCard className="w-4 h-4 text-purple-400" />
          Billing Invoice History
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">Billing Date</th>
                <th className="py-2.5 px-3">Total Cost</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-white/5 text-neutral-300 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {inv.id}
                  </td>
                  <td className="py-3 px-3 font-medium">{inv.date}</td>
                  <td className="py-3 px-3 font-semibold">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[9px] uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() =>
                        alert(
                          `Simulated PDF receipt download for invoice ${inv.id}`
                        )
                      }
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline cursor-pointer"
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
