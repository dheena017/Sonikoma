import React from "react";
import ForgotPasswordForm from "./ForgotPasswordForm.js";

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function ForgotPasswordPage(props: ForgotPasswordPageProps) {
  return <ForgotPasswordForm {...props} />;
}
