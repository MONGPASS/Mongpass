'use client';

import { ChevronRight, ImageIcon, Sparkles, Store, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadShopsByStatus } from "@/lib/shopStore";
import { loadBanners } from "@/lib/bannerStore";

interface Stats {
  shops: { total: number; pending: number; approved: number; rejected: number; featured: number };
  banners: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadShopsByStatus("pending"),
      loadShopsByStatus("approved"),
      loadShopsByStatus("rejected"),
      loadBanners(),
    ]).then(([pending, approved, rejected, banners]) => {
      if (!active) return;
      setStats({
        shops: {
          total: pending.length + approved.length + rejected.length,
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          featured: approved.filter((s) => s.featured === true).length,
        },
        banners: banners.length,
      });
    });
    return () => { active = false; };
  }, []);

  if (!stats) return <div className="px-4 pt-6" />;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Hero stat — pending approvals (most actionable item).
          On desktop we let it stretch full-width because the
          alternative (squeezed half) would feel arbitrary. */}
      <Link
        href="/admin/shops"
        className="block bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 lg:p-8 text-white shadow-sm active:scale-[0.99] transition-transform"
      >
        <p className="text-[11px] lg:text-xs font-bold uppercase tracking-wider opacity-90 mb-1">
          Шалгах хүлээж буй
        </p>
        <div className="flex items-end justify-between">
          <p className="text-4xl lg:text-6xl font-black">{stats.shops.pending}</p>
          <p className="text-[12px] lg:text-sm font-medium opacity-90">дэлгүүр →</p>
        </div>
      </Link>

      {/* Stat grid — denser on bigger screens.
          2 cols on phone (matches the existing mobile look).
          3 cols on lg so all the cards fit one row at typical
          desktop widths without feeling sparse. */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard
          icon={<Store className="w-5 h-5 lg:w-6 lg:h-6" />}
          tone="green"
          label="Баталгаажсан дэлгүүр"
          value={stats.shops.approved}
          sub={`Нийт: ${stats.shops.total} · Татгалзсан: ${stats.shops.rejected}`}
          href="/admin/shops"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />}
          tone="amber"
          label="Онцлох"
          value={stats.shops.featured}
          sub="нүүрэнд харагдаж буй"
          href="/admin/shops"
        />
        <StatCard
          icon={<ImageIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
          tone="purple"
          label="Баннер"
          value={stats.banners}
          sub="нүүр хуудсанд"
          href="/admin/banner"
        />
      </div>

      {/* Quick links — desktop-only convenience row. The phone view
          already has the tab nav, so duplicating these there would
          just be noise. */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Хурдан үйлдэл</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Зөвхөн админ эрхтэн дараах удирдлагуудтай.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <Link
            href="/admin/shops"
            className="flex items-center gap-3 p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">Дэлгүүр баталгаажуулах</p>
              <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
                Шинэ бүртгэл шалгаж зөвшөөрөх
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <Link
            href="/admin/banner"
            className="flex items-center gap-3 p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">Баннер удирдлага</p>
              <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
                Нүүр хуудасны баннер засах
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        </div>
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
      className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 active:scale-[0.98] lg:active:scale-100 block"
    >
      <div className="flex items-start justify-between mb-2 lg:mb-4">
        <div className={`w-9 h-9 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center ${TONE_STYLES[tone]}`}>
          {icon}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-2xl lg:text-4xl font-black text-gray-900 leading-tight">{value}</p>
      <p className="text-[12px] lg:text-sm font-bold text-gray-700 mt-0.5 lg:mt-1">{label}</p>
      <p className="text-[10px] lg:text-[12px] text-gray-500 mt-1 line-clamp-1">{sub}</p>
    </Link>
  );
}
