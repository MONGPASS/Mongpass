import BusinessDemo from "@/components/biz/BusinessDemo";
import { createBusinessPreviewOverview } from "@/lib/admin/businessPreviewSeed";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mongpass бизнесийн удирдлага — туршилт",
  robots: { index: false, follow: false },
};

export default function BusinessPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BusinessDemo initial={createBusinessPreviewOverview()}>
      {children}
    </BusinessDemo>
  );
}
