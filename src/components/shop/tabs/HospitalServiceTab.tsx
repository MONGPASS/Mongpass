import { Stethoscope } from "lucide-react";

// Per-shop doctors land in Phase 4 (D1 table doctors already exists).
// Until then this public tab shows an honest empty state — the previous
// version reused the global localStorage demo so every hospital looked
// like it employed the same two doctors.

export function HospitalServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3 text-purple-500">
        <Stethoscope className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Эмч нарын мэдээлэл бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Эмнэлгийн ажилтан удахгүй эмч нарын мэдээлэл, цаг авах боломжийг энд нэмэх болно.
      </p>
    </div>
  );
}
