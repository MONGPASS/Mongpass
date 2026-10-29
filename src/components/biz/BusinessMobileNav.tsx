"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Store, MessageCircle, Grid2X2 } from "lucide-react";
import type { Shop } from "@/lib/shopStore";
import { getCategoryInfo } from "@/lib/categories";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";

export default function BusinessMobileNav({ shop, pending, unread, preview }: {
  shop: Shop;
  pending: number;
  unread: number;
  preview: boolean;
}) {
  const pathname = usePathname();
  const path = preview ? pathname.replace(/^\/preview/, "") : pathname;
  const catalog = getCategoryInfo(shop.category).adminRoute;
  const tabs = [
    { href: "/biz", label: "Нүүр", icon: Home, count: 0 },
    { href: "/biz/orders", label: "Захиалга", icon: ShoppingBag, count: pending },
    ...(catalog ? [{ href: catalog, label: "Бараа", icon: Store, count: 0 }] : []),
    { href: "/biz/chat", label: "Чат", icon: MessageCircle, count: unread },
    { href: "/biz/more", label: "Бусад", icon: Grid2X2, count: 0 },
  ];
  const primary = tabs.slice(0, -1).some((tab) => path === tab.href || (tab.href !== "/biz" && path.startsWith(tab.href + "/")));
  return (
    <nav className="mp-business-bottom-nav" aria-label="Бизнесийн үндсэн цэс">
      {tabs.map(({ href, label, icon: Icon, count }) => {
        const active = href === "/biz/more" ? !primary : path === href || (href !== "/biz" && path.startsWith(href + "/"));
        return (
          <Link key={href} href={preview ? businessPreviewHref(href) : href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <span className="mp-bottom-nav-icon"><Icon size={22} strokeWidth={active ? 2.3 : 1.7} />{count > 0 && <b aria-label={`${count} шинэ`}>{count > 99 ? "99+" : count}</b>}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
