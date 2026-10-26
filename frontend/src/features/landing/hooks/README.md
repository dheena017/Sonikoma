# Landing Hooks (`features/landing/hooks/`)

## 1. Overview
Encapsulates reactive state management and controller logic for landing page interactions.

## 2. Hook Inventory
- `useLandingPage.ts`: Manages active demo tabs (`slicing`, `bubbles`, `translation`, `render`), comic link input URL, billing cycle toggle (`monthly` / `yearly`), and open FAQ accordion indices.
- `useNewsletterForm.ts`: Handles newsletter email validation, submission states, and feedback messages.

## 3. Export Boundary
Exported publicly through `hooks/index.ts`.
