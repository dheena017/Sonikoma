import React from "react";
import RegisterForm from "@/features/app_auth/components/RegisterForm";

interface RegisterPageProps {
  onRegister: (data: any) => Promise<any>;
  onNavigateToLogin: () => void;
  onNavigateHome?: () => void;
}

export default function RegisterPage(props: RegisterPageProps) {
  return <RegisterForm {...props} />;
}
