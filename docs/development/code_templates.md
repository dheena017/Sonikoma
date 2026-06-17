# 📐 Standard File Structure Templates

To maintain consistency and readability across the codebase, all code files must adhere to standard block-comment section layouts. Every developer and AI assistant must follow these templates when creating or refactoring files.

---

## 1. React Component Files (`.tsx`)

### 📋 Component Checklist & Rules:
- **Interfaces**: Always export a clear interface defining the component's props (e.g. `MyComponentProps`).
- **Early Return Guards**: Always place early-return guards for loading states (`isLoading`) and error states (`isError`) before rendering the main layout.
- **JSX Root Container**: The main return statement must return a single semantic root container with appropriate styling, layout classes (Tailwind), and accessibly annotated roles and labels (e.g. `role="region"`, `aria-label="..."`).
- **Console Log Mounting**: Print clean trace logs on mount/unmount inside a `useEffect` for lifecycle debugging.

```typescript
// ============================================================================
// SECTION 1: IMPORTS & CORE DEPENDENCIES
// ============================================================================
// 1. Core React imports & standard hooks (useState, useEffect, useCallback, etc.)
import React from "react";

// 2. Third-party UI components (Lucide icons, etc.) or styling utilities
import { Sparkles } from "lucide-react";

// 3. Modular sub-components or layouts
import LocalSubComponent from "./LocalSubComponent.js";

// 4. Custom hooks or routing hooks (useAppRouter, useAppLogic)
import { useAppLogic } from "../../hooks/useAppLogic.js";

// 5. Types, interfaces, and model lists
import { GeneratedPanel } from "../../types.js";

// ============================================================================
// SECTION 2: COMPONENT DEFINITION & EXPORT
// ============================================================================
export interface MyComponentProps {
  propA: string;                  // Short description of propA
  onAction: (id: string) => void; // Standard trigger action callback
  isLoading?: boolean;            // Status flag indicating loading
  isError?: boolean;              // Status flag indicating loading error
  onRetry?: () => void;           // Callback hook to retry loading
}

export default function MyComponent({ 
  propA, 
  onAction, 
  isLoading = false, 
  isError = false, 
  onRetry 
}: MyComponentProps) {
  // --------------------------------------------------------------------------
  // SUB-SECTION 2.1: STATE & HOOK INITIALIZATION
  // --------------------------------------------------------------------------
  const [internalValue, setInternalValue] = React.useState<string>("");

  // standard lifecycle logger for debugging mounting/unmounting
  React.useEffect(() => {
    console.log("[MyComponent] Mounted with propA:", propA);
    return () => console.log("[MyComponent] Unmounted");
  }, [propA]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: EVENT HANDLERS & CALLBACKS
  // --------------------------------------------------------------------------
  const handlePerformAction = React.useCallback(() => {
    if (!internalValue) return;
    console.log("[MyComponent] Triggering action callback with value:", internalValue);
    onAction(internalValue);
  }, [internalValue, onAction]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: RENDER OUT / JSX TREE
  // --------------------------------------------------------------------------
  
  // Guard: If data is loading, show a loading placeholder instead of rendering empty layouts
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-neutral-400 font-mono text-xs">
        Loading Component Data...
      </div>
    );
  }

  // Guard: If loading failed, render a structured error UI with retry action
  if (isError) {
    return (
      <div 
        className="p-6 bg-red-950/20 border border-red-900/40 rounded-2xl flex flex-col items-center justify-center space-y-3 text-red-400 font-mono text-xs"
        role="alert"
        aria-live="polite"
      >
        <span>Failed to load component data.</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 rounded-xl transition-colors border border-red-800 text-white font-semibold cursor-pointer"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col space-y-4"
      role="region" 
      aria-label="Interactive Component Workspace"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span>{propA}</span>
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
        placeholder="Enter payload..."
      />

      <button
        onClick={handlePerformAction}
        disabled={!internalValue}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-900/30"
      >
        Submit Action
      </button>
    </div>
  );
}
```

---

## 2. Custom React Hook Files (`.ts`)

### 📋 Hook Checklist & Rules:
- **Naming**: Always prefix the hook name with `use` (e.g. `useMyHook`).
- **Interfaces**: Clearly define the input parameter interface (`UseMyHookParams`) and return output interface (`UseMyHookResult`).
- **Callback Memoization**: Wrap all returned event functions in `useCallback` to prevent unnecessary component re-renders.
- **State Boundaries**: Manage internal variables such as loading state (`isLoading`) and error status (`isError`) within the hook itself.
- **Cleanups**: Always handle observers, timers, and flag cleanups in `useEffect` returns to avoid memory leaks.

```typescript
// ============================================================================
// SECTION 1: IMPORTS
// ============================================================================
// 1. Core React hooks & hook-dependencies
import React from "react";

// 2. Custom hooks, utility libraries, or state managers
import { useAppLogic } from "./useAppLogic.js";

// 3. Types, data models, or endpoint interfaces
import { GeneratedPanel } from "../types.js";

// ============================================================================
// SECTION 2: HOOK IMPLEMENTATION
// ============================================================================
export interface UseMyHookParams {
  sourceId: string;               // Parameter description
  onError: (msg: string) => void; // Callback hook error handler
}

export interface UseMyHookResult {
  data: string | null;            // Fetched/processed string output
  isLoading: boolean;             // Busy loading state status
  isError: boolean;               // Hook execution error state
  triggerFetch: (param: string) => Promise<void>; // Event caller action
}

export function useMyHook({ sourceId, onError }: UseMyHookParams): UseMyHookResult {
  // --------------------------------------------------------------------------
  // SUB-SECTION 2.1: STATE DEFINITIONS
  // --------------------------------------------------------------------------
  const [data, setData] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: SIDE EFFECTS & LIFECYCLE
  // --------------------------------------------------------------------------
  React.useEffect(() => {
    let isMounted = true;
    console.log("[useMyHook] Initializing hook context for sourceId:", sourceId);

    // cleanup hook references
    return () => {
      isMounted = false;
      console.log("[useMyHook] Cleaning up hook context for sourceId:", sourceId);
    };
  }, [sourceId]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: EVENT ACTIONS & ASYNC OPERATIONS
  // --------------------------------------------------------------------------
  const triggerFetch = React.useCallback(async (param: string) => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Execute operation or remote fetch
      const result = `Processed ${param} for source ${sourceId}`;
      setData(result);
    } catch (err: any) {
      console.error("[useMyHook] Operation execution failed:", err);
      setIsError(true);
      onError(err.message || "Unknown error inside useMyHook");
    } finally {
      setIsLoading(false);
    }
  }, [sourceId, onError]);

  // Return formatted state & handler package
  return {
    data,
    isLoading,
    isError,
    triggerFetch
  };
}
```

---

## 3. Backend FastAPI Route Files (`.py`)

### 📋 Route Checklist & Rules:
- **Type Annotations**: Always declare type hints for route function parameters and specify `JSONResponse` (or appropriate response models) as the return type.
- **Validation**: Use Pydantic `BaseModel` and field parameters (e.g. `Field(ge=0)`) to strictly validate and cast request inputs.
- **Timing Logs**: Calculate request processing times using `time.perf_counter()` to ensure visibility of bottlenecks.
- **Return / Response Format**: Always return standard JSON responses using FastAPI's `JSONResponse` with a consistent shape: `{"success": bool, "data": dict, "error": str}`.
- **Error Handling & Safe Returns**: Wrap all handlers in a try/except block. On error, log the context with `logger.error(..., exc_info=True)` and return a safe `500` status `JSONResponse` without leaking server traces.

```python
# =============================================================================
# SECTION 1: IMPORTS & ROUTER SETUP
# =============================================================================
import time
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Setup modular namespace logging
logger = logging.getLogger("anivox.routes.my_feature")
router = APIRouter()

# =============================================================================
# SECTION 2: REQUEST & RESPONSE SCHEMAS
# =============================================================================
class MyFeatureRequest(BaseModel):
    image_url: str = Field(..., description="Source panel image URL to process")
    strength: float = Field(default=50.0, ge=0.0, le=100.0, description="Adjustment strength")

# =============================================================================
# SECTION 3: ROUTE HANDLERS
# =============================================================================
@router.post("/action", summary="Apply structural adjustment on target image")
async def execute_feature_action(body: MyFeatureRequest) -> JSONResponse:
    start_time = time.perf_counter()
    logger.info(f"Incoming POST action request for URL: {body.image_url}")

    try:
        # 1. Processing Logic / Service Calls
        # mock resolving buffer size
        mock_size_bytes = 204857
        
        duration = round((time.perf_counter() - start_time) * 1000, 1)
        logger.info(f"Completed action processing in {duration}ms")

        # 2. Return standard structured success response
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "processed": True,
                    "sizeBytes": mock_size_bytes,
                    "appliedStrength": body.strength
                }
            }
        )
    except Exception as err:
        logger.error(f"Execution error: {err}", exc_info=True)
        # Avoid leaking internal trace details to client, return safe 500 JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(err) or "Failed to execute feature action internally"
            }
        )
```

---

## 4. Python Service Files (`.py`)

### 📋 Python Service Checklist & Rules:
- **Type Hints**: Always add type hints to parameters and returns using the `typing` module.
- **Exception Logs**: Log failing blocks using `logger.error(..., exc_info=True)` to track root exceptions.
- **OS Path Safety**: Avoid using string concats for folder directories; always use cross-platform safe functions (e.g. `os.path.join`).
- **CLI Outputs**: Print `STATUS=SUCCESS` or `STATUS=ERROR` explicitly so Node.js `exec()` wrappers can easily capture exit codes.

```python
# =============================================================================
# SECTION 1: IMPORTS & CORE CONFIGURATION
# =============================================================================
import os
import sys
import argparse
import logging
from typing import Dict, Any, List, Optional

# Setup standard formatting for backend logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("webtoon_engine.services.myservice")

# =============================================================================
# SECTION 2: CORE LOGIC FUNCTIONS
# =============================================================================
def process_data(input_path: str, output_path: str, parameters: Dict[str, Any]) -> List[str]:
    """
    Processes the given comic files or panel boundaries.
    
    Args:
        input_path: Absolute directory to the source file.
        output_path: Destination directory path for final output.
        parameters: Configuration dictionary.
        
    Returns:
        List of generated file output names.
    """
    logger.info(f"Initiating process_data on: {input_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Source file not found: {input_path}")
        
    try:
        results = []
        # Main execution block (e.g. OpenCV / Pillow manipulation)
        results.append(f"Output saved at {output_path}")
        return results
    except Exception as e:
        logger.error(f"Failed to execute process_data block: {e}", exc_info=True)
        raise

# =============================================================================
# SECTION 3: CLI ENTRY POINT (IF RUN VIA SHELL)
# =============================================================================
if __name__ == "__main__":
    # Standard argparse setup
    parser = argparse.ArgumentParser(description="Standard CLI wrapper for Python backend operations")
    parser.add_argument("--input_path", required=True, help="Source image or text file path")
    parser.add_argument("--output_path", required=True, help="Destination folder output path")
    parser.add_argument("--sensitivity", type=float, default=0.5, help="Algorithm sensitivity threshold")

    args = parser.parse_args()

    try:
        config_params = {"sensitivity": args.sensitivity}
        generated_files = process_data(args.input_path, args.output_path, config_params)
        
        # Output markers for Node.js sub-process capture
        print("STATUS=SUCCESS")
        print(f"OUTPUTS={','.join(generated_files)}")
    except Exception as err:
        print(f"STATUS=ERROR", file=sys.stderr)
        print(f"ERROR_DETAILS={str(err)}", file=sys.stderr)
        sys.exit(1)
```
