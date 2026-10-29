import Link from "next/link";
import { ArrowUpRight, Smartphone } from "lucide-react";

export const metadata = {
  title: "Mongpass Бизнес — Гар утасны харагдац",
  robots: { index: false, follow: false },
};

export default function MobileBusinessPreview() {
  return (
    <main className="fixed inset-0 z-50 bg-[#edf0f4] flex flex-col items-center" lang="mn">
      <header className="w-full bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between gap-3 shrink-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700"><Smartphone size={18} className="text-orange-500" />Mongpass Бизнес</span>
        <Link href="/login?redirect=%2Fbiz" className="flex items-center gap-1 text-xs text-gray-500">Бизнесээр нэвтрэх <ArrowUpRight size={13} /></Link>
      </header>
      <div style={{ width: "min(100%, 430px)", flex: 1, minHeight: 0, marginTop: 16, marginBottom: 16, borderRadius: 24, overflow: "hidden", border: "1px solid #e1e5eb", boxShadow: "0 12px 45px #26344912" }}>
        <iframe title="Бизнесийн гар утасны удирдлага" src="/preview/biz" style={{ display: "block", width: "100%", height: "100%", border: 0 }} />
      </div>
    </main>
  );
}
