'use client';

import { Search, Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { countUnread } from "@/lib/notificationStore";
import { getCurrentUser } from "@/lib/userStore";

export default function TopBar() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const u = await getCurrentUser();
      if (active) setUnread(countUnread(u));
    };
    refresh();
    const handler = () => { void refresh(); };
    window.addEventListener("focus", handler);
    return () => {
      active = false;
      window.removeEventListener("focus", handler);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
          M
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">MongPass</span>
      </Link>
      <div className="flex items-center gap-3 text-foreground">
        <Link
          href="/search"
          aria-label="Хайх"
          className="p-2 hover:bg-surfaceAlt rounded-full transition-colors"
        >
          <Search size={22} className="text-gray-700" />
        </Link>
        <Link
          href="/notifications"
          aria-label="Мэдэгдэл"
          className="p-2 hover:bg-surfaceAlt rounded-full transition-colors relative"
        >
          <Bell size={22} className="text-gray-700" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-background flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
