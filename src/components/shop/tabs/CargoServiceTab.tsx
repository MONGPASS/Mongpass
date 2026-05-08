import { Plane } from "lucide-react";

// Per-shop cargo routes land in Phase 4 (D1 table cargo_routes already
// exists). Until then this public tab shows an honest empty state — the
// previous version reused the global localStorage demo seed which made
// every cargo shop look like it ran the same Сөүл↔Улаанбаатар lane.

export function CargoServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-500">
        <Plane className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Чиглэлүүд бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Дэлгүүрийн эзэн удахгүй өөрийн карго чиглэлүүдийг (үнэ, хугацаа) энд нэмэх болно.
      </p>
    </div>
  );
}
