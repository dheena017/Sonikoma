import React from "react";
import RegisterForm from "@/features/auth/components/RegisterForm";

interface RegisterPageProps {
  onRegister: (data: any) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function RegisterPage(props: RegisterPageProps) {
  return <RegisterForm {...props} />;
}
