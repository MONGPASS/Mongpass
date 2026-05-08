import { CarFront } from "lucide-react";

// Used-car listings CRUD will land in a future phase. Until then this
// shows an honest empty state so visitors don't see fake "Hyundai
// Sonata 9,500,000₩" mock entries that don't exist.

export function CarServiceTab() {
  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-gray-500">
        <CarFront className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Зарагдаж буй машин одоогоор алга
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Дэлгүүрийн эзэн удахгүй өөрийн зарж буй машинуудыг энд нэмэх болно.
      </p>
    </div>
  );
}
