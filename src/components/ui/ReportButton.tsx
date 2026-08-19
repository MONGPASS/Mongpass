'use client';

import { Check, Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReportTargetType, submitReport } from "@/lib/reportStore";
import { getCurrentUser } from "@/lib/userStore";

/**
 * "Мэдэгдэх" (report) affordance, reusable on any content surface.
 * Opens a bottom sheet with preset reasons + optional free text so
 * reporting takes two taps; sends to /api/reports for the admin
 * moderation queue. Signed-out users are routed to login first.
 */

const PRESET_REASONS = [
  "Спам / залилан",
  "Доромжлол, үзэн ядалт",
  "Хууль бус зүйл",
  "Буруу мэдээлэл",
];

export function ReportButton({
  targetType,
  targetId,
  /** Compact = icon-only (for dense rows like reviews). */
  compact = false,
}: {
  targetType: ReportTargetType;
  targetId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(PRESET_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function openSheet() {
    const user = await getCurrentUser();
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setOpen(true);
  }

  async function send() {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await submitReport({
        targetType,
        targetId,
        reason: detail.trim() ? `${reason} — ${detail.trim()}` : reason,
      });
      if (ok) {
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          setDone(false);
          setDetail("");
        }, 1200);
      } else {
        alert("Мэдэгдэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={openSheet}
        aria-label="Мэдэгдэх"
        className={
          compact
            ? "p-1 text-gray-300 hover:text-red-400 transition-colors"
            : "flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
        }
      >
        <Flag className={compact ? "w-3.5 h-3.5" : "w-3 h-3"} />
        {!compact && "Мэдэгдэх"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-7"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">
                  Мэдэгдэл хүлээн авлаа
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Админ шалгаад арга хэмжээ авах болно
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-base text-gray-900">Мэдэгдэх</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 -mr-1 hover:bg-gray-100 rounded-full"
                    aria-label="Хаах"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2 mb-4">
                  {PRESET_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                        reason === r
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Нэмэлт тайлбар (заавал биш)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none mb-4"
                />
                <button
                  onClick={send}
                  disabled={busy}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50"
                >
                  {busy ? "Илгээж байна..." : "Мэдэгдэл илгээх"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
