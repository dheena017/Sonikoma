import React from "react";
import RegisterForm from "@/features/auth/components/RegisterForm";
import type { RegisterPageProps } from "@/features/auth/types";

export type { RegisterPageProps };

export default function RegisterPage(props: RegisterPageProps) {
  return <RegisterForm {...props} />;
}
