'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Scissors, User } from "lucide-react";
import { BeautyService, Stylist, loadServices, loadStylists } from "@/lib/beautyStore";

export function BeautyServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [services, setServices] = useState<BeautyService[] | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    Promise.all([loadServices(shopId), loadStylists(shopId)]).then(([s, st]) => {
      if (!active) return;
      setServices(s);
      setStylists(st);
    });
    return () => { active = false; };
  }, [shopId]);

  if (services === null) {
    return <div className="p-5 bg-white min-h-[50vh]" />;
  }

  if (services.length === 0) {
    return (
      <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-3 text-pink-500">
          <Scissors className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">Үйлчилгээ нэмэгдээгүй байна</p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Салон удахгүй үйлчилгээний жагсаалтаа энд нэмэх болно.
        </p>
      </div>
    );
  }

  // Group services by category for nicer display
  const grouped = new Map<string, BeautyService[]>();
  for (const s of services) {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  }

  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-5">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
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
        </div>
      ))}

      {stylists.length > 0 && (
        <div>
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
            Стилист
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {stylists.map((s) => (
              <div key={s.id} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-pink-50 flex items-center justify-center text-pink-500 mb-1.5">
                  <User className="w-5 h-5" />
                </div>
                <p className="text-[12px] font-bold text-gray-900 truncate">{s.name}</p>
                {s.specialty && (
                  <p className="text-[10px] text-gray-500 truncate">{s.specialty}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
