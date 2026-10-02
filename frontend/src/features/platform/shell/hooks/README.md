# Platform Shell Hooks (`features/platform/shell/hooks/`)

## Overview
This directory contains custom React hooks orchestrating the platform shell's router state, active path synchronization, navigation guards, and layout responsive behaviors.

## Hook Catalog
### `useAppRouter`
- **File**: `useAppRouter.ts`
- **Description**: Centralized routing controller providing imperative navigation, active path inspection, search param parsing, and route guards.
- **Signature**:
  ```ts
  export function useAppRouter(props?: UseAppRouterProps): {
    currentPath: string;
    navigateTo: (path: string) => void;
    navigateBack: () => void;
    isAnyAdmin: boolean;
    isCreativeSuitePath: boolean;
    isAICorePath: boolean;
  }
  ```
- **Dependencies**: React Router or custom navigation state composer.
