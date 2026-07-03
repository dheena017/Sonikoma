import React, { useState } from "react";

export function useLandingPage() {
  const [demoTab, setDemoTab] = useState<
    "slicing" | "bubbles" | "translation" | "render"
  >("slicing");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [landingUrl, setLandingUrl] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return {
    demoTab,
    setDemoTab,
    sliderPos,
    setSliderPos,
    landingUrl,
    setLandingUrl,
    billingCycle,
    setBillingCycle,
    openFaq,
    toggleFaq,
  };
}
