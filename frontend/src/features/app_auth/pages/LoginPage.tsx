import React from "react";
import LoginForm from "@/features/app_auth/components/LoginForm";

interface LoginPageProps {
  onLogin: (data: any) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export default function LoginPage(props: LoginPageProps) {
  return <LoginForm {...props} />;
}
