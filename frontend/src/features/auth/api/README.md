# Auth API (`features/auth/api`)

## Overview
Provides communication interfaces with backend authentication, session verification, user profile management, credit balance tracking, and daily reward claims.

## Exports
- `login(fetchClient, credentials)`: Authenticate with email/password.
- `register(fetchClient, userData)`: Register a new studio user.
- `getCurrentUser(fetchClient, force?)`: Retrieve authenticated session data with short-term memoization.
- `logout(fetchClient)`: Terminate current session.
- `forgotPassword(fetchClient, email)`: Trigger password recovery email.
- `getUserCredits(fetchClient)`: Fetch current user's available compute credits.
- `claimDailyCredits(fetchClient)`: Claim daily creator reward streak credits.
- `updateProfile(fetchClient, payload)`: Update user display profile.

## Usage
```ts
import { login, getCurrentUser, getUserCreditsPayload } from "@/features/auth/api";
```
