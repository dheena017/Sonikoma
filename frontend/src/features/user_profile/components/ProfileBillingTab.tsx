import React from "react";
import AICreditWalletPage from "@/features/ai_core/pages/AICreditWalletPage";

export interface ProfileBillingTabProps {
  credits?: number;
  hasClaimedToday?: boolean;
  handleClaimCredits?: () => void;
  claimNotification?: boolean;
  invoices?: { id: string; date: string; amount: number; status: string }[];
  streakDays?: number;
  subscriptionTier?: string;
  cardInfo?: any;
  onUpdateCard?: (card: {
    cardHolder: string;
    cardNo: string;
    cardExpiry: string;
    cardCvv: string;
  }) => Promise<void>;
  onUpgradePlan?: () => Promise<void>;
  onPurchaseCredits?: (credits: number, priceUSD: number) => Promise<void>;
  user?: any;
  fetchWithInterceptor?: any;
  addNotification?: (msg: string, type?: any) => void;
}

export default function ProfileBillingTab({
  credits,
  hasClaimedToday,
  streakDays,
  subscriptionTier,
  user,
  fetchWithInterceptor,
  addNotification,
}: ProfileBillingTabProps) {
  return (
    <AICreditWalletPage
      addNotification={addNotification}
    />
  );
}

