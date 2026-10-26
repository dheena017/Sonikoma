import React from "react";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import type { ForgotPasswordPageProps } from "@/features/auth/types";

export type { ForgotPasswordPageProps };

export default function ForgotPasswordPage(props: ForgotPasswordPageProps) {
  return <ForgotPasswordForm {...props} />;
}
