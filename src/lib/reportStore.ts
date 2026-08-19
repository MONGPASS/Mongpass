/** Client for /api/reports — flagging content + the admin queue. */

export type ReportTargetType = "post" | "comment" | "review" | "shop";

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetPreview: string;
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
}

/** Returns false only on hard failure (signed out / server error). */
export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/reports", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Admin: fetch the moderation queue. */
export async function loadReports(
  status: "open" | "resolved" = "open",
): Promise<Report[]> {
  try {
    const res = await fetch(`/api/reports?status=${status}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { reports: Report[] };
    return data.reports ?? [];
  } catch {
    return [];
  }
}

/** Admin: mark a report handled (or reopen it). */
export async function setReportStatus(
  id: string,
  status: "open" | "resolved",
): Promise<boolean> {
  try {
    const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
