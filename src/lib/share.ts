'use client';

/**
 * Share a URL through the platform share sheet (Web Share API), with a
 * copy-to-clipboard fallback for desktop browsers that lack it.
 *
 * Facebook shares are the community's main distribution channel, so
 * every share affordance in the app funnels through here rather than
 * each surface hand-rolling (or, as before, silently doing nothing).
 *
 * Returns what happened so the caller can show the right feedback:
 *  - "shared": the native sheet handled it (or the user dismissed it —
 *    the sheet itself was the feedback, no toast needed)
 *  - "copied": URL is on the clipboard; show a "холбоос хуулагдлаа" hint
 *  - "failed": neither path worked (very old browser, blocked clipboard)
 */
export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareUrl(opts: {
  title: string;
  text?: string;
  /** App-relative path; defaults to the current page. */
  path?: string;
}): Promise<ShareOutcome> {
  const url = opts.path
    ? new URL(opts.path, window.location.origin).toString()
    : window.location.href;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return "shared";
    } catch (err) {
      // AbortError = the user closed the sheet; that's a completed
      // interaction, not a failure — don't surprise them with a
      // clipboard fallback they didn't ask for.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
      // Any other error (NotAllowedError etc.) → try the clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
