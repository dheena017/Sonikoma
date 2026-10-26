# Auth Pages (`features/auth/pages`)

## Overview
Full-page route components integrated with the Sonikoma routing system (`AppRouter` and `useAppRouter`).

## Pages
- **`LoginPage`**: Route page rendered at `/login`.
- **`RegisterPage`**: Route page rendered at `/register`.
- **`ForgotPasswordPage`**: Route page rendered at `/forgot-password`.
- **`AuthSuccessPage`**: Callback verification page rendered for OAuth redirects, verification links, and callback handlers (`/auth-success`, `/auth/callback`, `/auth/redirect`, `/auth/launch`).

## Usage
```tsx
import { LoginPage, RegisterPage, ForgotPasswordPage, AuthSuccessPage } from "@/features/auth/pages";
```
