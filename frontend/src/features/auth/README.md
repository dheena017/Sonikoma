# Authentication Domain (`features/auth`)

## Overview
The `auth` feature domain encapsulates all authentication, registration, password recovery, session lifecycle management, onboarding showcases, and creator role assignment for the Sonikoma Studio application.

## Directory Structure
```
features/auth/
├── api/             # API client functions for auth, profiles, and credits
│   ├── auth.ts      # Auth endpoints (login, register, session, credits)
│   ├── index.ts     # API barrel export
│   └── README.md
├── components/      # Authentication UI components and forms
│   ├── AuthPageShell.tsx      # Split-screen responsive authentication shell
│   ├── AuthShowcase.tsx      # Product showcase carousel with tour/preview
│   ├── LoginForm.tsx         # Sign-in form with validation and theme support
│   ├── RegisterForm.tsx      # Creator onboarding and sign-up form
│   ├── ForgotPasswordForm.tsx # Password reset request interface
│   ├── ThemeSwitcher.tsx     # Accent color picker (Blue/Purple/Emerald/Amber)
│   ├── constants.ts          # Backward-compatible re-export of utils/constants
│   ├── index.ts              # Components barrel export
│   └── README.md
├── hooks/           # State management and form controllers
│   ├── useAuth.ts            # Global session hook (useAuth & useAppAuth)
│   ├── useLoginForm.ts       # Login form state, validation, and submission
│   ├── useRegisterForm.ts    # Multi-step registration and role selection
│   ├── useForgotPasswordForm.ts # Recovery flow state controller
│   ├── index.ts              # Hooks barrel export
│   └── README.md
├── pages/           # High-level route pages
│   ├── LoginPage.tsx         # Route page for /login
│   ├── RegisterPage.tsx      # Route page for /register
│   ├── ForgotPasswordPage.tsx # Route page for /forgot-password
│   ├── AuthSuccessPage.tsx   # OAuth & verification callback landing page
│   ├── index.ts              # Pages barrel export
│   └── README.md
├── types/           # Domain TypeScript type definitions
│   └── index.ts              # User, Theme, Role, and Page prop contracts
├── utils/           # Helper functions, validation heuristics, and constants
│   ├── authValidation.ts     # Email, password strength, username validation
│   ├── constants.ts          # Showcase slides, tour steps, i18n translations
│   ├── index.ts              # Utils barrel export
│   └── README.md
└── index.ts         # Central feature barrel export
```

## Public API & Barrel Export
External consumers and app routers can import clean contracts directly from `@/features/auth` or its submodules:
```tsx
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  AuthSuccessPage,
  useAuth,
  useLoginForm,
  validateEmail,
  evaluatePasswordStrength
} from "@/features/auth";
```
