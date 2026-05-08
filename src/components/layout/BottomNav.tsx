'use client';

import { Home, Users, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadUnreadChatCount } from "@/lib/chatStore";

const navItems = [
  { id: "home", label: "Нүүр", icon: Home, href: "/" },
  { id: "community", label: "Чөлөөт булан", icon: Users, href: "/community" },
  { id: "chat", label: "Чат", icon: MessageCircle, href: "/chat" },
  { id: "profile", label: "Профайл", icon: User, href: "/profile" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname = usePathname() ?? "/";
  const [unread, setUnread] = useState(0);

  // Poll the unread count so a reply landing while the user is on
  // another tab lights up the red badge without a page reload.
  // 8s is comfortably faster than the user's attention span and
  // doesn't hammer the API.
  useEffect(() => {
    let active = true;
    const refresh = () => {
      loadUnreadChatCount().then((n) => {
        if (active) setUnread(n);
      });
    };
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex items-center justify-around h-[68px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          const showBadge = item.id === "chat" && unread > 0;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1
                ${active ? "text-primary" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              <span className="relative">
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white"
                    aria-label={`${unread} шинэ мессеж`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
