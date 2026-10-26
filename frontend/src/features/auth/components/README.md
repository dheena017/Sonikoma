# Auth Components (`features/auth/components`)

## Overview
Presentation components and interactive form views implementing the Sonikoma Studio design language (glassmorphism, radial glow accents, theme selection, and animated slides).

## Components
- **`AuthPageShell`**: Reusable split-screen layout with an interactive left showcase panel and a scrollable form container on the right.
- **`AuthShowcase`**: Animated slideshow displaying Sonikoma core capabilities (AI Webtoon Parser, Motion Dynamics, Audio Mixer, Compiler) and interactive walkthrough tour.
- **`LoginForm`**: Credential input form supporting caps-lock warnings, password visibility toggling, network offline alerts, and multi-language support.
- **`RegisterForm`**: Multi-step onboarding form including role selection (Director, Webtoon Artist, Motion Animator, Sound Designer, Producer).
- **`ForgotPasswordForm`**: Recovery email submission form with feedback animations and countdown timers.
- **`ThemeSwitcher`**: Micro-pill theme switcher allowing users to customize accent colors across Blue, Purple, Emerald, and Amber.
- **`constants.ts`**: Re-exports UI tokens, translations, and slide metadata from `features/auth/utils/constants`.

## Usage
```tsx
import { AuthPageShell, LoginForm, ThemeSwitcher } from "@/features/auth/components";
```
