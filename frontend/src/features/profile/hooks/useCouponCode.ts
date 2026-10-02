import React from "react";

const VALID_COUPONS: Record<string, number> = {
  COMIC50: 50,
  WEBTOON25: 25,
  CREATOR40: 40,
};

export const useCouponCode = () => {
  const [couponCode, setCouponCode] = React.useState("");
  const [couponStatus, setCouponStatus] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState(0);

  const handleApplyCoupon = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setCouponStatus(null);

      const code = couponCode.trim().toUpperCase();

      if (code in VALID_COUPONS) {
        const discountPercent = VALID_COUPONS[code];
        setDiscount(discountPercent);
        setCouponStatus(
          `Promo Code Applied: ${discountPercent}% discount locked!`
        );
      } else {
        setDiscount(0);
        setCouponStatus(
          `Invalid promo code. Try: ${Object.keys(VALID_COUPONS).join(", ")}`
        );
      }
    },
    [couponCode]
  );

  const clearCoupon = React.useCallback(() => {
    setCouponCode("");
    setCouponStatus(null);
    setDiscount(0);
  }, []);

  return {
    couponCode,
    setCouponCode,
    couponStatus,
    setCouponStatus,
    discount,
    setDiscount,
    handleApplyCoupon,
    clearCoupon,
  };
};
