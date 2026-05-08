'use client';

import { ArrowLeft, ImageIcon, LayoutDashboard, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, isAdmin, User } from "@/lib/userStore";

const SECTIONS = [
  { href: "/admin",        label: "Тойм",    icon: LayoutDashboard },
  { href: "/admin/shops",  label: "Дэлгүүр", icon: Store },
  { href: "/admin/banner", label: "Баннер",  icon: ImageIcon },
];

function isCurrent(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Admin shell. Breaks out of the customer-facing 480px `.mobile-
 * container` wrapper via `fixed inset-0` so admins get the full
 * viewport on desktop. Two-pane layout (sidebar + content) on
 * `lg:`, single column with horizontal tab nav on smaller screens
 * — useful for the rare phone admin moment.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((u) => {
      if (!active) return;
      if (!isAdmin(u)) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUser(u);
      setAuthChecked(true);
    });
    return () => { active = false; };
  }, [router, pathname]);

  if (!authChecked) {
    return <div className="fixed inset-0 bg-gray-50 z-40" />;
  }

  const currentSection = SECTIONS.find((s) => isCurrent(s.href, pathname));

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 flex overflow-hidden">
      {/* Sidebar — desktop only.
          Lives outside the page scroll so it stays put while content
          scrolls in the right pane (matches Linear / Vercel / Stripe
          dashboard shells). */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-gray-200">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="font-black text-lg tracking-tight">mongpass</span>
          </Link>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold text-purple-600 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Минь хяналт
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {SECTIONS.map(({ href, label, icon: Icon }) => {
            const active = isCurrent(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-[12px] text-gray-500 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Профайл руу
            </Link>
          </div>
        )}
      </aside>

      {/* Right pane: scrollable content area. */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile header — back arrow + title + horizontal tab nav.
            Hidden on desktop in favour of the sidebar above. */}
        <header className="lg:hidden bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center h-14 px-4 gap-3">
            <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 flex-1">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h1 className="font-bold text-base">Минь хяналт</h1>
            </div>
          </div>
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

        {/* Desktop top bar — page title + breadcrumb. */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center px-8 shrink-0">
          <h1 className="font-bold text-lg text-gray-900">
            {currentSection?.label ?? "Минь хяналт"}
          </h1>
        </header>

        {/* Scrollable content. The inner max-w keeps wide-screen reading
            line lengths comfortable without forcing a centered narrow
            column (which would feel like the mobile site again). */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-4 lg:px-8 lg:py-8 lg:max-w-7xl lg:mx-auto w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
