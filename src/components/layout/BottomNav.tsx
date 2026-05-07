'use client';

import { Home, Users, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex items-center justify-around h-[68px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1
                ${active ? "text-primary" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
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
