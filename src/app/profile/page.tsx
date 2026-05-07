'use client';

import BottomNav from "@/components/layout/BottomNav";
import { ChevronRight, Settings, Store, ShoppingBag, Heart, LogIn, LogOut, UserPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, getCurrentUser, isAdmin, logout } from "@/lib/userStore";
import { Shop, findShopByOwner } from "@/lib/shopStore";
import { CATEGORY_REGISTRY } from "@/lib/categories";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setShop(u ? findShopByOwner(u.id) : null);
    setLoaded(true);
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    setShop(null);
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-[80px]">
      <div className="bg-white p-5 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
            {user ? user.name.slice(0, 1).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            {user ? (
              <>
                <h2 className="text-[18px] font-bold text-gray-900 truncate">{user.name}</h2>
                {user.phone && <p className="text-[13px] text-gray-500">{user.phone}</p>}
              </>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-gray-900">Зочин</h2>
                <p className="text-[13px] text-gray-500">Нэвтрээгүй байна</p>
              </>
            )}
          </div>
        </div>
        {!loaded ? null : !user ? (
          <Link
            href="/login?redirect=/profile"
            className="flex items-center justify-center gap-2 mt-3 bg-gray-900 text-white font-semibold py-2.5 rounded-xl text-sm"
          >
            <LogIn className="w-4 h-4" /> Нэвтрэх
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 mt-3 w-full bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl text-sm"
          >
            <LogOut className="w-4 h-4" /> Гарах
          </button>
        )}
      </div>

      {/* Admin panel link — only visible to admin users */}
      {isAdmin(user) && (
        <div className="mt-2 bg-white border-y border-gray-100">
          <Link
            href="/admin"
            className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 text-gray-900">
              <ShieldCheck size={22} className="text-purple-600" />
              <div>
                <p className="font-bold text-[15px]">Минь хяналтын самбар</p>
                <p className="text-[11px] text-gray-500">Дэлгүүр баталгаажуулалт · Удирдлага</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>
      )}

      {/* Biz section: differs based on whether user owns a shop */}
      <div className="mt-2 bg-white border-y border-gray-100">
        {user && shop ? (
          <Link href="/biz" className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 text-gray-900">
              <Store size={22} className="text-primary" />
              <div>
                <p className="font-bold text-[15px]">{shop.name}</p>
                <p className="text-[11px] text-gray-500">
                  {CATEGORY_REGISTRY[shop.category]?.label ?? shop.category} · Удирдах
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        ) : user ? (
          <Link href="/biz/register" className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 text-gray-900">
              <UserPlus size={22} className="text-primary" />
              <span className="font-bold text-[15px]">Бизнес бүртгүүлэх</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        ) : (
          <div className="p-5 text-[13px] text-gray-400 text-center">
            Нэвтэрсний дараа дэлгүүр бүртгэх боломжтой
          </div>
        )}
        <Link href="#" className="flex items-center justify-between p-5 border-t border-gray-50 active:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 text-gray-900">
            <Heart size={22} className="text-gray-500" />
            <span className="font-medium text-[15px]">Хадгалсан дэлгүүр</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link href="/profile/orders" className="flex items-center justify-between p-5 border-t border-gray-50 active:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 text-gray-900">
            <ShoppingBag size={22} className="text-gray-500" />
            <span className="font-medium text-[15px]">Захиалгын түүх</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      </div>

      <div className="mt-2 bg-white border-y border-gray-100">
        <Link href="#" className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 text-gray-900">
            <Settings size={22} className="text-gray-500" />
            <span className="font-medium text-[15px]">Тохиргоо</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
