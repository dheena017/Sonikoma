import React from "react";

export interface BillingState {
  currency: "USD" | "KRW" | "JPY";
  customCredits: number;
  couponCode: string;
  couponStatus: string | null;
  discount: number;
  cardNo: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  isCardSaved: boolean;
}

export const useBillingState = (cardInfo?: any) => {
  const [currency, setCurrency] = React.useState<"USD" | "KRW" | "JPY">("USD");
  const [customCredits, setCustomCredits] = React.useState(500);
  const [couponCode, setCouponCode] = React.useState("");
  const [couponStatus, setCouponStatus] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [cardNo, setCardNo] = React.useState("");
  const [cardHolder, setCardHolder] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [isCardSaved, setIsCardSaved] = React.useState(false);

  React.useEffect(() => {
    if (cardInfo) {
      setCardNo(cardInfo.cardNo || "");
      setCardHolder(cardInfo.cardHolder || "");
      setCardExpiry(cardInfo.cardExpiry || "");
      setCardCvv(cardInfo.cardCvv || "");
      setIsCardSaved(true);
    }
  }, [cardInfo]);

  return {
    currency,
    setCurrency,
    customCredits,
    setCustomCredits,
    couponCode,
    setCouponCode,
    couponStatus,
    setCouponStatus,
    discount,
    setDiscount,
    cardNo,
    setCardNo,
    cardHolder,
    setCardHolder,
    cardExpiry,
    setCardExpiry,
    cardCvv,
    setCardCvv,
    isCardSaved,
    setIsCardSaved,
  };
};
