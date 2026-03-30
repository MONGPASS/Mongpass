import BottomNav from "@/components/layout/BottomNav";
import { ChevronRight, Settings, Store, ShoppingBag, Heart } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 pb-[80px]">
      <div className="bg-white p-5 border-b border-gray-100">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-gray-200"></div>
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Хэрэглэгч</h2>
            <p className="text-[13px] text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-white border-y border-gray-100">
        <Link href="/biz" className="flex items-center justify-between p-5 active:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 text-gray-900">
            <Store size={22} className="text-primary" />
            <span className="font-bold text-[15px]">Biz Профайл</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link href="#" className="flex items-center justify-between p-5 border-t border-gray-50 active:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3 text-gray-900">
            <Heart size={22} className="text-gray-500" />
            <span className="font-medium text-[15px]">Хадгалсан дэлгүүр</span>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>
        <Link href="#" className="flex items-center justify-between p-5 border-t border-gray-50 active:bg-gray-50 transition-colors">
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
