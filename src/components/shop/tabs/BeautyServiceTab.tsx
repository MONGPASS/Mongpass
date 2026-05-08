import { Scissors } from "lucide-react";

// Per-shop beauty services + stylists land in Phase 4 (D1 tables
// beauty_services / beauty_stylists already exist). Until then this
// public tab shows an honest empty state — the previous version reused
// the global localStorage demo so every salon looked identical.

export function BeautyServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-3 text-pink-500">
        <Scissors className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Үйлчилгээний жагсаалт бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Гоо сайхны салон удахгүй өөрийн үйлчилгээ, стилистүүдийг энд нэмэх болно.
      </p>
    </div>
  );
}
