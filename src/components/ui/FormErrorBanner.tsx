'use client';

import { AlertCircle } from "lucide-react";

/**
 * Inline failure message for submit flows. Rendered directly above the
 * sticky submit button on every order/booking form so a rejected
 * submission is impossible to miss — previously these failures were
 * swallowed and the form just sat there looking unchanged.
 *
 * Renders nothing when `message` is null, so callers can drop it in
 * unconditionally.
 */
export function FormErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <p className="text-[12px] font-semibold leading-snug text-red-700">
        {message}
      </p>
    </div>
  );
}
