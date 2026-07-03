import React from "react";

interface CardPaymentFormProps {
  cardHolder: string;
  setCardHolder: (value: string) => void;
  cardNo: string;
  onCardNoChange: (value: string) => void;
  cardExpiry: string;
  onCardExpiryChange: (value: string) => void;
  cardCvv: string;
  onCardCvvChange: (value: string) => void;
  onSaveCard: () => Promise<void>;
  isComplete: boolean;
}

export default function CardPaymentForm({
  cardHolder,
  setCardHolder,
  cardNo,
  onCardNoChange,
  cardExpiry,
  onCardExpiryChange,
  cardCvv,
  onCardCvvChange,
  onSaveCard,
  isComplete,
}: CardPaymentFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1 text-left">
        <h4 className="text-sm font-bold text-white">Save Credit Card Info</h4>
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
            onChange={(e) => onCardNoChange(e.target.value)}
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
              onChange={(e) => onCardExpiryChange(e.target.value)}
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
              onChange={(e) => onCardCvvChange(e.target.value)}
              placeholder="•••"
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 focus:border-purple-500/50 text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSaveCard}
        disabled={!isComplete}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
          isComplete
            ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
            : "bg-neutral-700 text-neutral-500 cursor-not-allowed opacity-60"
        }`}
      >
        Save Card Method
      </button>
    </div>
  );
}
