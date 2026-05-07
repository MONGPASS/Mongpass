'use client';

import { ArrowLeft, ImageIcon, LayoutDashboard, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, isAdmin } from "@/lib/userStore";

const SECTIONS = [
  { href: "/admin",        label: "Тойм",    icon: LayoutDashboard },
  { href: "/admin/shops",  label: "Дэлгүүр", icon: Store },
  { href: "/admin/banner", label: "Баннер",  icon: ImageIcon },
];

function isCurrent(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isAdmin(getCurrentUser())) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setAuthChecked(true);
  }, [router, pathname]);

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h1 className="font-bold text-base">Минь хяналт</h1>
          </div>
        </div>
        {/* Section tabs — horizontal scrollable */}
        <nav className="flex border-b border-gray-100 overflow-x-auto hide-scroll">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = isCurrent(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold whitespace-nowrap border-b-2 ${
                  active ? "text-gray-900 border-gray-900" : "text-gray-400 border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}
    </main>
  );
}
