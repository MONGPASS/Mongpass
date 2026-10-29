import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminShell from "@/components/admin/AdminShell";
import { createAdminPreview } from "@/lib/admin/preview";

export const metadata = {
  title: "Mongpass 관리자 미리보기",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function AdminPreviewPage() {
  const data = createAdminPreview();
  return (
    <AdminShell
      preview
      previewTotals={{
        pending: data.totals.pending,
        reports: data.totals.reports,
      }}
      user={{
        id: "preview",
        name: "관리자",
        email: "샘플 화면 · 실제 운영 데이터가 아닙니다",
        role: "admin",
        image_url: null,
      }}
    >
      <AdminDashboard previewData={data} />
    </AdminShell>
  );
}
