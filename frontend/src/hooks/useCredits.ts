/**
 * useCredits.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lightweight hook that fetches and refreshes the current user credit balance.
 *
 * Usage:
 *   const { credits, isLoading, lowBalance, hasSufficientCredits } = useCredits(fetchWithInterceptor);
 *
 *   // Gate a button:
 *   <button disabled={!hasSufficientCredits(20)}>Generate Video</button>
 *
 * Design decisions:
 *   - Uses getUserCreditsPayload() so `low_balance` comes from the server in a
 *     single round-trip (no extra fetch).
 *   - Refreshes every POLL_INTERVAL_MS (default 30 s) matching MainHeader cadence.
 *   - A `forceRefresh` callback is exposed so callers can trigger an immediate
 *     re-fetch after a credit-consuming action resolves.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getUserCreditsPayload, type CreditsPayload } from "../api/auth";

const POLL_INTERVAL_MS = 30_000;
const LOW_BALANCE_THRESHOLD = 20; // mirrors backend db.LOW_BALANCE_THRESHOLD

interface UseCreditsResult {
  /** Current credit balance, or null while loading the first time. */
  credits: number | null;
  /** True during the initial load before the first successful fetch. */
  isLoading: boolean;
  /** True when the balance is below the LOW_BALANCE_THRESHOLD. */
  lowBalance: boolean;
  /** The threshold value used to determine low-balance state. */
  threshold: number;
  /** Returns true if the user has at least `cost` credits available. */
  hasSufficientCredits: (cost: number) => boolean;
  /** Call after a credit-consuming action to get an immediate refresh. */
  forceRefresh: () => void;
}

export function useCredits(fetchWithInterceptor: any): UseCreditsResult {
  const [payload, setPayload] = useState<CreditsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchCredits = useCallback(async () => {
    if (!fetchWithInterceptor) return;
    try {
      const data = await getUserCreditsPayload(fetchWithInterceptor);
      if (mountedRef.current && data !== null) {
        setPayload(data);
        setIsLoading(false);
      }
    } catch {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCredits();
    const id = setInterval(fetchCredits, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchCredits]);

  const credits = payload?.credits ?? null;
  const lowBalance = payload?.low_balance ?? (credits !== null && credits < LOW_BALANCE_THRESHOLD);
  const threshold = payload?.threshold ?? LOW_BALANCE_THRESHOLD;

  const hasSufficientCredits = useCallback(
    (cost: number) => credits !== null && credits >= cost,
    [credits]
  );

  return {
    credits,
    isLoading,
    lowBalance,
    threshold,
    hasSufficientCredits,
    forceRefresh: fetchCredits,
  };
}
