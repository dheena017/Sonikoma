# Auth Utilities (`features/auth/utils`)

## Overview
Shared helper functions, validation routines, design system tokens, and internationalized copywriting strings for the authentication domain.

## Modules
- **`constants.ts`**:
  - `THEMES`: Theme token configuration for Blue, Purple, Emerald, and Amber color palettes.
  - `SHOWCASE_SLIDES`: Metadata and icons for the studio feature carousel.
  - `TOUR_STEPS`: Multi-step walkthrough guide for first-time creators.
  - `TRANSLATIONS`: Multi-language dictionary (English, Korean, Japanese) for auth forms.
- **`authValidation.ts`**:
  - `validateEmail(email)`: RFC-compliant email string checker.
  - `evaluatePasswordStrength(password)`: Heuristic strength evaluator returning score, level, and corrective feedback.
  - `validateUsername(username)`: Alphanumeric and length validation.
  - `formatAuthError(error)`: User-friendly error message extractor.
  - `sanitizeAuthInput(input)`: Strips HTML tags and extraneous whitespace.

## Usage
```ts
import {
  THEMES,
  validateEmail,
  evaluatePasswordStrength
} from "@/features/auth/utils";
```
