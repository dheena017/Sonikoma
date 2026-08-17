import React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";

export interface CardPaymentFormProps {
  cardHolder: string;
  setCardHolder: (value: string) => void;
  cardNo: string;
  onCardNoChange: (value: string) => void;
  cardExpiry: string;
  onCardExpiryChange: (value: string) => void;
  cardCvv: string;
  onCardCvvChange: (value: string) => void;
  onSaveCard: () => Promise<void> | void;
  isComplete: boolean;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
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
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1 text-left">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-400" />
          Saved Payment Method
        </h4>
        <p className="text-xs text-neutral-400 font-semibold">
          Add a credit card for instant one-click compute top-ups and priority queue allocations.
        </p>
      </div>

      <div className="space-y-3 text-xs text-left">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 focus:border-purple-500/60 text-white focus:outline-none placeholder:text-neutral-600 font-sans"
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
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 focus:border-purple-500/60 text-white focus:outline-none font-mono placeholder:text-neutral-600"
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
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 focus:border-purple-500/60 text-white focus:outline-none font-mono placeholder:text-neutral-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              CVV / CVC
            </label>
            <input
              type="password"
              maxLength={4}
              value={cardCvv}
              onChange={(e) => onCardCvvChange(e.target.value)}
              placeholder="•••"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 focus:border-purple-500/60 text-white focus:outline-none font-mono placeholder:text-neutral-600"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onSaveCard}
        disabled={!isComplete}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
          isComplete
            ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md shadow-purple-900/20 active:scale-95"
            : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60"
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        Save Card Method
      </button>
    </div>
  );
};

export default CardPaymentForm;
