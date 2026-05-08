import { Plane } from "lucide-react";

// Travel-package CRUD isn't in the migration plan yet (Phase 4 covers
// per-shop catalogs but only for transactional categories). Until then
// this tab shows an honest empty state so users / shop owners aren't
// looking at fake "Анжи арал амралт" mock entries that don't exist.

export function TravelServiceTab() {
  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-yellow-500">
        <Plane className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">
        Аяллын багцууд бэлдэгдэж байна
      </p>
      <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Дэлгүүрийн эзэн удахгүй өөрийн санал болгож буй аяллын багцуудыг энд нэмэх болно.
      </p>
    </div>
  );
}
