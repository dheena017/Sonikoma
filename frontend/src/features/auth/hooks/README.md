# Auth Hooks (`features/auth/hooks`)

## Overview
Custom React hooks managing authentication states, local storage persistence, session synchronization, and form input lifecycles.

## Hooks
- **`useAuth` / `useAppAuth`**: Manages global session authentication state, current user attributes, logout routines, and mock authentication parameters.
- **`useLoginForm`**: Encapsulates login form states (email, password, remember-me, loading state, error reporting, theme, caps-lock detection).
- **`useRegisterForm`**: Manages registration form steps, creator role selection, password strength verification, and terms acceptance.
- **`useForgotPasswordForm`**: Manages password reset request submission, success messaging, and navigation triggers.

## Usage
```tsx
import { useAuth, useLoginForm } from "@/features/auth/hooks";

function LoginScreen() {
  const { user, isAuthenticated } = useAuth();
  const form = useLoginForm({ onLogin: async (data) => { ... } });
}
```
