import React from "react";
import LoginForm from "./LoginForm.js";

interface LoginPageProps {
  onLogin: (data: any) => Promise<void>;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateHome?: () => void;
}

export default function LoginPage(props: LoginPageProps) {
  return <LoginForm {...props} />;
}

