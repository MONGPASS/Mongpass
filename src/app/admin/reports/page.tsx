'use client';

import { Check, ExternalLink, Flag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { parseTimestamp } from "@/lib/datetime";
import { Report, loadReports, setReportStatus } from "@/lib/reportStore";

/**
 * Moderation queue — every report users file lands here. Per row the
 * admin can open the target, delete it outright, or resolve the
 * report (reviewed, no action needed). Deleting also resolves.
 */

const TYPE_LABEL: Record<Report["targetType"], string> = {
  post: "Нийтлэл",
  comment: "Сэтгэгдэл (пост)",
  review: "Сэтгэгдэл (дэлгүүр)",
  shop: "Дэлгүүр",
};

/** Where "open the reported thing" leads, when we can build a link. */
function targetHref(r: Report): string | null {
  switch (r.targetType) {
    case "post":
      return `/community/${r.targetId}`;
    case "shop":
      return `/category/other/${r.targetId}`; // slug is normalised by the page
    default:
      return null; // comments/reviews have no standalone page
  }
}

/**
 * DELETE endpoint per target type; comments need their post id, which
 * reports do not store — moderators handle those via the post page.
 */
function deleteEndpoint(r: Report): string | null {
  switch (r.targetType) {
    case "post":
      return `/api/community/posts/${encodeURIComponent(r.targetId)}`;
    case "review":
      return `/api/reviews/${encodeURIComponent(r.targetId)}`;
    case "shop":
      return `/api/shops/${encodeURIComponent(r.targetId)}`;
    default:
      return null;
  }
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [reports, setReports] = useState<Report[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async (which: "open" | "resolved") => {
    setLoaded(false);
    setReports(await loadReports(which));
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh(tab);
  }, [tab, refresh]);

  async function resolve(r: Report) {
    if (busyId) return;
    setBusyId(r.id);
    try {
      await setReportStatus(r.id, "resolved");
      await refresh(tab);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTarget(r: Report) {
    const endpoint = deleteEndpoint(r);
    if (!endpoint || busyId) return;
    const label = TYPE_LABEL[r.targetType];
    if (!window.confirm(`${label}: "${r.targetPreview.slice(0, 60)}" — бүрмөсөн устгах уу?`)) {
      return;
    }
    setBusyId(r.id);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
      });
      // 404 = already gone; either way the report is handled.
      if (res.ok || res.status === 404) {
        await setReportStatus(r.id, "resolved");
        await refresh(tab);
      } else {
        alert("Устгахад алдаа гарлаа.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Мэдэгдлүүд</h1>
      <p className="text-[13px] text-gray-500 mb-5">
        Хэрэглэгчдийн мэдэгдсэн агуулга. Шалгаад устгах эсвэл асуудалгүй
        бол шийдвэрлэсэн гэж тэмдэглэнэ.
      </p>

      <div className="flex gap-2 mb-4">
        {(["open", "resolved"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-full border text-[13px] font-semibold ${
              tab === k
                ? "bg-gray-900 border-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {k === "open" ? "Хүлээгдэж буй" : "Шийдвэрлэсэн"}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="text-sm text-gray-400 py-8 text-center">Уншиж байна...</p>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Flag className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500">
            {tab === "open" ? "Шинэ мэдэгдэл байхгүй 🎉" : "Түүх хоосон байна"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const href = targetHref(r);
            const canDelete = deleteEndpoint(r) !== null;
            return (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {TYPE_LABEL[r.targetType]}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {parseTimestamp(r.createdAt).toLocaleDateString("mn-MN")}
                  </span>
                </div>
                <p className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                  {r.targetPreview}
                </p>
                <p className="text-[12px] text-red-600 mb-1">⚑ {r.reason}</p>
                <p className="text-[11px] text-gray-400 mb-3">
                  Мэдэгдсэн: {r.reporterName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {href && (
                    <Link
                      href={href}
                      target="_blank"
                      className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Үзэх
                    </Link>
                  )}
                  {tab === "open" && canDelete && (
                    <button
                      onClick={() => deleteTarget(r)}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Устгах
                    </button>
                  )}
                  {tab === "open" && (
                    <button
                      onClick={() => resolve(r)}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Шийдвэрлэсэн
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
