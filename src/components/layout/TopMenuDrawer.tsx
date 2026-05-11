'use client';

import {
  Beef, Briefcase, CarFront, ImageIcon, LogIn, LogOut, MessageCircle, Newspaper,
  Phone, Pizza, Scissors, Search, Settings, ShieldCheck, ShoppingBag, Stethoscope,
  Store, Truck, User as UserIcon, Users, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, getCurrentUser, isAdmin, logout } from "@/lib/userStore";

/**
 * Slide-in side drawer triggered by the hamburger icon in TopBar.
 * Centralises navigation to every platform surface so a new user
 * can discover what exists without spelunking the bottom nav.
 *
 * Sections:
 *  - User identity card (avatar + name OR "Нэвтрэх" prompt)
 *  - Main pages (Нүүр, Мэдээ мэдээлэл, Чөлөөт булан, Чат, Хайх)
 *  - Services (every shop category — same set as the home grid)
 *  - Personal (Профайл, Миний захиалгууд, Биз гарц, Минь хяналт if admin)
 *  - Sign out
 */
export default function TopMenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Refresh identity each time the drawer opens — cheap and means
  // logging in/out from another tab is reflected without remount.
  useEffect(() => {
    if (!open) return;
    let active = true;
    getCurrentUser().then((u) => {
      if (active) setUser(u);
    });
    return () => { active = false; };
  }, [open]);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSignOut() {
    await logout();
    setUser(null);
    onClose();
    router.push("/");
  }

  return (
    <>
      {/* Backdrop — fades in, click closes. */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Drawer panel — slides from the right. max-w bounds it on
          tablet/desktop so it never feels like a full takeover. */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[85%] max-w-sm bg-white shadow-xl flex flex-col transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Цэс
          </span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full"
            aria-label="Хаах"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User identity card at the top of the drawer. Switches to a
            "Нэвтрэх" CTA when signed out. */}
        <div className="px-5 py-4 border-b border-gray-100">
          {user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              <LogIn className="w-4 h-4" /> Нэвтрэх
            </Link>
          )}
        </div>

        {/* Scrollable nav body */}
        <nav className="flex-1 overflow-y-auto">
          <Group title="Үндсэн">
            <NavItem icon={Store}      label="Нүүр хуудас"    href="/" onClick={onClose} />
            <NavItem icon={Newspaper}  label="Мэдээ мэдээлэл" href="/news" onClick={onClose} />
            <NavItem icon={Users}      label="Чөлөөт булан"   href="/community" onClick={onClose} />
            <NavItem icon={MessageCircle} label="Чат"         href="/chat" onClick={onClose} />
            <NavItem icon={Search}     label="Хайх"           href="/search" onClick={onClose} />
          </Group>

          <Group title="Үйлчилгээ">
            <NavItem icon={Beef}        label="Махны дэлгүүр" href="/category/meat" onClick={onClose} />
            <NavItem icon={Pizza}       label="Хоолны газар"  href="/category/restaurant" onClick={onClose} />
            <NavItem icon={Truck}       label="Карго"          href="/category/cargo" onClick={onClose} />
            <NavItem icon={Stethoscope} label="Эмнэлэг"       href="/category/hospital" onClick={onClose} />
            <NavItem icon={Scissors}    label="Гоо сайхан"    href="/category/beauty" onClick={onClose} />
            <NavItem icon={CarFront}    label="Хуучин машин"  href="/category/car" onClick={onClose} />
            <NavItem icon={Phone}       label="Утас дугаар"   href="/category/phone" onClick={onClose} />
            <NavItem icon={Briefcase}   label="Аялал"          href="/category/travel" onClick={onClose} />
            <NavItem icon={ImageIcon}   label="Бусад"          href="/category/other" onClick={onClose} />
          </Group>

          <Group title="Минийх">
            {user && (
              <>
                <NavItem icon={UserIcon}    label="Профайл"             href="/profile" onClick={onClose} />
                <NavItem icon={ShoppingBag} label="Миний захиалгууд"    href="/profile/orders" onClick={onClose} />
                <NavItem icon={Settings}    label="Бизнес гарц"         href="/biz" onClick={onClose} />
              </>
            )}
            {isAdmin(user) && (
              <NavItem icon={ShieldCheck} label="Минь хяналт" href="/admin" onClick={onClose} />
            )}
          </Group>

          {user && (
            <div className="px-3 py-3 border-t border-gray-100 mt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Гарах
              </button>
            </div>
          )}
        </nav>

        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            MongPass · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="px-5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="px-3 space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
    >
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
