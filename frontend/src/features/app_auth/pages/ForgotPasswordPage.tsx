import React from "react";
import ForgotPasswordForm from "@/features/app_auth/components/ForgotPasswordForm";

interface ForgotPasswordPageProps {
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function ForgotPasswordPage(props: ForgotPasswordPageProps) {
  return <ForgotPasswordForm {...props} />;
}
