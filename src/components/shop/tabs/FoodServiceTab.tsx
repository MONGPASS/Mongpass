import { Utensils } from "lucide-react";

// Per-shop menu items land in Phase 4 (D1 table menu_items already
// exists). Until then this public tab shows an honest empty state —
// the previous version reused the global localStorage demo menu so
// every restaurant on the site looked like it sold the same items.

export function FoodServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 text-orange-500">
        <Utensils className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Цэс бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Дэлгүүрийн эзэн удахгүй өөрийн хоолны цэсийг энд нэмэх болно.
      </p>
    </div>
  );
}
