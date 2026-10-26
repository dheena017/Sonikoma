import React from "react";
import LoginForm from "@/features/auth/components/LoginForm";
import type { LoginPageProps } from "@/features/auth/types";

export type { LoginPageProps };

export default function LoginPage(props: LoginPageProps) {
  return <LoginForm {...props} />;
}
