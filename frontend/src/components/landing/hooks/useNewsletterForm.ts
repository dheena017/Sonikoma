import { useState } from "react";

export function useNewsletterForm() {
  const [email, setEmail] = useState("");
  const [newsState, setNewsState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setNewsState("error");
      return;
    }
    setNewsState("loading");
    setTimeout(() => {
      setNewsState("success");
      setEmail("");
    }, 1200);
  };

  const resetState = () => {
    setNewsState("idle");
    setEmail("");
  };

  return {
    email,
    setEmail,
    newsState,
    setNewsState,
    handleSubscribe,
    resetState,
  };
}
