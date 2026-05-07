'use client';

import { ChevronRight, ImageIcon, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadShops } from "@/lib/shopStore";
import { loadBanners } from "@/lib/bannerStore";

interface Stats {
  shops: { total: number; pending: number; approved: number; rejected: number; featured: number };
  banners: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const shops = loadShops();
    setStats({
      shops: {
        total: shops.length,
        pending: shops.filter((s) => s.status === "pending").length,
        approved: shops.filter((s) => s.status === "approved").length,
        rejected: shops.filter((s) => s.status === "rejected").length,
        featured: shops.filter((s) => s.featured === true).length,
      },
      banners: loadBanners().length,
    });
  }, []);

  if (!stats) return <div className="px-4 pt-6" />;

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Hero stat — pending approvals (most actionable) */}
      <Link
        href="/admin/shops"
        className="block bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-white shadow-sm active:scale-[0.99] transition-transform"
      >
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-90 mb-1">
          Шалгах хүлээж буй
        </p>
        <div className="flex items-end justify-between">
          <p className="text-4xl font-black">{stats.shops.pending}</p>
          <p className="text-[12px] font-medium opacity-90">дэлгүүр →</p>
        </div>
      </Link>

      {/* 2-column stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Store className="w-5 h-5" />}
          tone="green"
          label="Баталгаажсан"
          value={stats.shops.approved}
          sub={`Нийт: ${stats.shops.total} · Татгалзсан: ${stats.shops.rejected}`}
          href="/admin/shops"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          tone="amber"
          label="Онцлох"
          value={stats.shops.featured}
          sub="нүүрэнд харагдаж буй"
          href="/admin/shops"
        />
        <StatCard
          icon={<ImageIcon className="w-5 h-5" />}
          tone="purple"
          label="Баннер"
          value={stats.banners}
          sub="нүүр хуудсанд"
          href="/admin/banner"
        />
      </div>
    </div>
  );
}

const TONE_STYLES = {
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
} as const;

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONE_STYLES;
  label: string;
  value: string | number;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform block"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${TONE_STYLES[tone]}`}>
          {icon}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
      <p className="text-[12px] font-bold text-gray-700 mt-0.5">{label}</p>
      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{sub}</p>
    </Link>
  );
}
