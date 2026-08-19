'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, getCurrentUser } from "@/lib/userStore";

/**
 * Client-side auth gate for pages that only make sense when signed in
 * (order forms, booking forms). Redirects to /login with a redirect
 * param so the customer lands back here after authenticating.
 *
 * While `checking` is true the page should render a blank shell — the
 * flag stays true through the redirect so a signed-out visitor never
 * sees the form flash before navigating away.
 *
 * Pass the *current* path as `redirectTo`; keep it stable across
 * renders (it's a useEffect dependency).
 */
export function useRequireUser(redirectTo: string): {
  checking: boolean;
  user: User | null;
} {
  const router = useRouter();
  const [state, setState] = useState<{ checking: boolean; user: User | null }>({
    checking: true,
    user: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active) return;
      if (!u) {
        router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return; // leave checking=true — the redirect is already in flight
      }
      setState({ checking: false, user: u });
    })();
    return () => {
      active = false;
    };
  }, [router, redirectTo]);

  return state;
}
