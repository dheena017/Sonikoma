import React from "react";

const CURRENCY_RATES = {
  USD: { symbol: "$", value: 1, suffix: "/mo" },
  KRW: { symbol: "₩", value: 1300, suffix: "/월" },
  JPY: { symbol: "¥", value: 150, suffix: "/月" },
};

const CURRENCY_RATES_NO_SUFFIX = {
  USD: { symbol: "$", value: 1 },
  KRW: { symbol: "₩", value: 1300 },
  JPY: { symbol: "¥", value: 150 },
};

export const useCurrencyFormatter = (currency: "USD" | "KRW" | "JPY", discount: number) => {
  const formatPrice = React.useCallback(
    (baseUSD: number) => {
      const curr = CURRENCY_RATES[currency];
      const converted = Math.round(baseUSD * curr.value * (1 - discount / 100));
      return `${curr.symbol}${converted.toLocaleString()}${curr.suffix}`;
    },
    [currency, discount]
  );

  const formatCustomPrice = React.useCallback(
    (customCredits: number) => {
      const baseUSD = customCredits * 0.02;
      const curr = CURRENCY_RATES_NO_SUFFIX[currency];
      const converted = Math.round(baseUSD * curr.value * (1 - discount / 100));
      return `${curr.symbol}${converted.toLocaleString()}`;
    },
    [currency, discount]
  );

  const getDiscountedPrice = React.useCallback(
    (baseUSD: number) => {
      return baseUSD * (1 - discount / 100);
    },
    [discount]
  );

  return {
    formatPrice,
    formatCustomPrice,
    getDiscountedPrice,
  };
};
