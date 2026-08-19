'use client';

import { useCallback, useEffect, useRef } from "react";

/**
 * Run `callback` immediately, then every `intervalMs` — but only while
 * the tab is actually visible.
 *
 * Every live surface in the app (chat, unread badges, order counts) is
 * driven by polling against D1, which bills per request. A backgrounded
 * tab left open all day was previously still hammering the API; here we
 * pause on `visibilitychange` and fire one immediate refresh when the
 * user comes back, so returning to the tab still feels instant.
 *
 * `callback` is held in a ref, so an inline arrow function won't restart
 * the timer on every render. Pass `enabled: false` to suspend polling
 * (e.g. while a prerequisite is still loading).
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      if (timer !== null) return; // already running
      savedCallback.current();
      timer = setInterval(() => savedCallback.current(), intervalMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        start(); // fires an immediate refresh, then resumes the timer
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}

/**
 * Polling with adaptive backoff for conversation-shaped data.
 *
 * `callback` fetches and reports whether anything new arrived. While a
 * conversation is active the poll runs every `baseMs`; each quiet poll
 * doubles the delay up to `maxMs`, and any activity snaps it back to
 * `baseMs`. An idle chat left open therefore settles at maxMs instead
 * of hammering the API at chat speed all day.
 *
 * Same visibility contract as {@link usePolling}: paused while the tab
 * is hidden, immediate catch-up poll (at base pace) on return.
 *
 * Returns a `bump()` function — call it after a local action that
 * makes fresh data likely (e.g. sending a message) to refetch
 * immediately and reset the pace.
 */
export function useAdaptivePolling(
  callback: () => Promise<boolean>,
  baseMs: number,
  maxMs: number,
  enabled = true,
): () => void {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Bridge from the stable bump() identity into the current effect run.
  const kickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let delay = baseMs;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const run = async () => {
      clear();
      if (!active) return;
      let sawActivity = false;
      try {
        sawActivity = await savedCallback.current();
      } catch {
        // Poll failures are transient (network blips); keep the loop
        // alive and let the next tick retry.
      }
      if (!active) return;
      delay = sawActivity ? baseMs : Math.min(delay * 2, maxMs);
      if (document.visibilityState === "visible") {
        timer = setTimeout(run, delay);
      }
      // Hidden → don't reschedule; visibilitychange restarts us.
    };

    const kick = () => {
      delay = baseMs;
      void run();
    };
    kickRef.current = kick;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        kick(); // immediate catch-up at base pace
      } else {
        clear();
      }
    };

    if (document.visibilityState === "visible") {
      void run();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      clear();
      kickRef.current = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [baseMs, maxMs, enabled]);

  return useCallback(() => {
    kickRef.current?.();
  }, []);
}
