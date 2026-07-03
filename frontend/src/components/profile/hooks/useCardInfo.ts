import React from "react";

export const useCardInfo = (cardInfo?: any) => {
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

  const formatCardNumber = React.useCallback((value: string) => {
    const val = value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
    setCardNo(val);
  }, []);

  const formatCardExpiry = React.useCallback((value: string) => {
    const val = value.replace(/\D/g, "");
    if (val.length >= 2) {
      setCardExpiry(val.substring(0, 2) + "/" + val.substring(2, 4));
    } else {
      setCardExpiry(val);
    }
  }, []);

  const formatCardCvv = React.useCallback((value: string) => {
    setCardCvv(value.replace(/\D/g, ""));
  }, []);

  const isCardComplete = (): boolean => {
    return !!(cardNo && cardHolder && cardExpiry && cardCvv);
  };

  const clearCard = React.useCallback(() => {
    setCardNo("");
    setCardHolder("");
    setCardExpiry("");
    setCardCvv("");
    setIsCardSaved(false);
  }, []);

  return {
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
    formatCardNumber,
    formatCardExpiry,
    formatCardCvv,
    isCardComplete,
    clearCard,
  };
};
