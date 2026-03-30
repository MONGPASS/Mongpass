import { Home, Users, MessageCircle, User } from "lucide-react";
import Link from "next/link";

const navItems = [
  { id: "home", label: "Нүүр", icon: Home, active: true, href: "/" },
  { id: "community", label: "Чөлөөт Булан", icon: Users, active: false, href: "#" },
  { id: "chat", label: "Чат", icon: MessageCircle, active: false, href: "#" },
  { id: "profile", label: "Профайл", icon: User, active: false, href: "/profile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex items-center justify-around h-[68px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 
                ${item.active ? "text-primary" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              <Icon size={24} strokeWidth={item.active ? 2.5 : 2} />
              <span className={`text-[10px] ${item.active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
