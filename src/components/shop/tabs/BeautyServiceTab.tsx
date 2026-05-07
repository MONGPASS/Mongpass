'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Scissors } from "lucide-react";
import { BeautyService, defaultServices, loadServices } from "@/lib/beautyStore";

export function BeautyServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "1");
  const [services, setServices] = useState<BeautyService[]>(defaultServices);
  const [activeCat, setActiveCat] = useState<string>("all");

  useEffect(() => {
    setServices(loadServices());
  }, []);

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category));
    return ["all", ...Array.from(set)];
  }, [services]);

  const visible = activeCat === "all" ? services : services.filter((s) => s.category === activeCat);

  return (
    <div className="p-5 bg-white min-h-[50vh]">
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-3 -mx-1 px-1">
          {categories.map((c) => {
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap ${active ? "bg-pink-500 border-pink-500 text-white" : "border-gray-200 bg-white text-gray-700"}`}
              >
                {c === "all" ? "Бүгд" : c}
              </button>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Үйлчилгээ байхгүй байна</p>
      ) : (
        <div className="space-y-3 mt-2">
          {visible.map((s) => (
            <div key={s.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                    {s.category}
                  </p>
                  <p className="font-bold text-sm text-gray-900">{s.name}</p>
                  <p className="text-[12px] text-gray-600 mt-0.5">
                    {s.durationMin} мин · <b className="text-gray-900">{s.price}</b>
                  </p>
                </div>
              </div>
              <Link
                href={`/category/beauty/${shopId}/book?serviceId=${s.id}`}
                className="flex items-center justify-center gap-1.5 w-full bg-pink-500 text-white font-semibold py-2.5 rounded-xl text-[13px] active:scale-[0.98] transition-transform"
              >
                Цаг захиалах
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
