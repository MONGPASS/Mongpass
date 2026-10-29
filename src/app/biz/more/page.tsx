"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, Settings, Newspaper, Star, Store, LogOut, ShoppingBag, MessageCircle } from "lucide-react";
import { useBusiness } from "@/components/biz/BizContext";
import { PageHeading, ErrorNotice } from "@/components/admin/AdminUI";
import { CATEGORY_MN, STATUS_MN } from "@/lib/admin/businessMessages";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";
import { getCategoryInfo } from "@/lib/categories";
import { logout } from "@/lib/userStore";
import { useState } from "react";

export default function BusinessMorePage() {
  const { shop, user, preview } = useBusiness();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const href = (value: string) => preview ? businessPreviewHref(value) : value;
  const catalog = getCategoryInfo(shop.category).adminRoute;
  const links = [
    { href: "/biz/profile", title: "Мэдээлэл, тохиргоо", description: "Зураг, хаяг, ажиллах цаг", icon: Settings },
    ...(catalog ? [{ href: catalog, title: "Бараа, үйлчилгээ", description: "Цэс, үнэ, үйлчилгээ удирдах", icon: Store }] : []),
    { href: "/biz/notices", title: "Бизнесийн мэдээ", description: "Шинэ мэдээ, урамшуулал нийтлэх", icon: Newspaper },
    { href: "/biz/reviews", title: "Харилцагчийн үнэлгээ", description: "Сэтгэгдэлд хариу бичих", icon: Star },
    { href: "/biz/orders", title: "Захиалга", description: "Захиалгын явцыг удирдах", icon: ShoppingBag },
    { href: "/biz/chat", title: "Харилцагчийн чат", description: "Мессежид хариулах", icon: MessageCircle },
  ];
  return (
    <>
      <PageHeading title="Миний бизнес" description="Бизнесийнхээ бүх боломжийг нэг дороос удирдаарай." />
      <section className="mp-business-account mp-panel mp-panel-pad">
        <span className="mp-business-account-icon"><Store size={27} /></span>
        <div><h2>{shop.name}</h2><p>{CATEGORY_MN[shop.category]} · {user.name}</p><span className={`mp-status ${shop.status}`}>{STATUS_MN[shop.status]}</span></div>
      </section>
      <section className="mp-business-more-list mp-panel" aria-label="Бизнесийн бүх хэрэгсэл">
        {links.map(({ href: route, title, description, icon: Icon }) => <Link key={route} href={href(route)}><span className="mp-more-icon"><Icon size={21} /></span><span><b>{title}</b><small>{description}</small></span><ChevronRight size={18} /></Link>)}
      </section>
      <Link className="mp-business-store-link" href={href(`/category/${shop.category}/${shop.id}`)}><Store size={18} /> Харилцагчид харагдах бизнесээ үзэх <ArrowUpRight size={17} /></Link>
      {error && <ErrorNotice message={error} />}
      {!preview && <button className="mp-business-logout" disabled={busy} onClick={async () => {
        setBusy(true);
        try { await logout(); router.replace("/login?redirect=%2Fbiz"); }
        catch { setError("Гарч чадсангүй. Дахин оролдоно уу."); setBusy(false); }
      }}><LogOut size={18} />{busy ? "Гарч байна…" : "Бүртгэлээс гарах"}</button>}
    </>
  );
}
