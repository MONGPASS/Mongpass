"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { ErrorNotice } from "@/components/admin/AdminUI";
import { BizContext } from "@/components/biz/BizContext";
import { getCurrentUser, type User } from "@/lib/userStore";
import type { BusinessOverview } from "@/lib/admin/business";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<BusinessOverview | null>(null);
  const [error, setError] = useState("");
  const register = pathname === "/biz/register";
  const refresh = useCallback(async () => {
    if (register) return;
    const response = await fetch("/api/biz/overview?days=7", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 401) {
      router.replace("/login?redirect=" + encodeURIComponent(pathname));
      return;
    }
    if (response.status === 404) {
      router.replace("/biz/register");
      return;
    }
    if (!response.ok) throw new Error("Бизнесийн мэдээллийг ачаалж чадсангүй.");
    setData(await response.json());
  }, [pathname, register, router]);
  useEffect(() => {
    if (register) return;
    let active = true;
    (async () => {
      const current = await getCurrentUser();
      if (!active) return;
      if (!current) {
        router.replace("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }
      setUser(current);
      try {
        await refresh();
      } catch {
        if (active)
          setError("Бизнесийн мэдээллийг ачаалж чадсангүй. Хуудсаа шинэчилнэ үү.");
      }
    })();
    const changed = () => {
      refresh().catch(() => {});
    };
    window.addEventListener("biz-data-changed", changed);
    const timer = setInterval(() => {
      if (!document.hidden) changed();
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("biz-data-changed", changed);
    };
  }, [pathname, refresh, register, router]);
  if (register) return children;
  if (error)
    return (
      <div className="fixed inset-0 z-40 bg-white p-10">
        <ErrorNotice message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  if (!user || !data)
    return (
      <div
        className="fixed inset-0 z-40 bg-white flex items-center justify-center text-sm text-gray-500"
        role="status"
      >
        Бизнесийн удирдлагын мэдээллийг шалгаж байна…
      </div>
    );
  return (
    <BizContext.Provider value={{ shop: data.shop, user, refresh }}>
      <AdminShell
        user={user}
        business={{
          shop: data.shop,
          pending: data.totals.pending,
          unread: data.totals.unread,
        }}
      >
        <div className="mp-biz-content">{children}</div>
      </AdminShell>
    </BizContext.Provider>
  );
}
