"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, isAdmin, type User } from "@/lib/userStore";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let active = true;
    getCurrentUser().then((current) => {
      if (!active) return;
      if (!isAdmin(current)) {
        router.replace("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }
      setUser(current);
    });
    return () => {
      active = false;
    };
  }, [pathname, router]);
  if (!user)
    return (
      <div
        className="fixed inset-0 z-40 bg-white flex items-center justify-center text-sm text-gray-500"
        role="status"
      >
        관리자 권한을 확인하고 있어요…
      </div>
    );
  return <AdminShell user={user}>{children}</AdminShell>;
}
