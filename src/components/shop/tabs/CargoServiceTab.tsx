'use client';

import { useEffect, useMemo, useState } from "react";
import { Plane, Zap, Package, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CargoRoute,
  CargoType,
  CARGO_TYPE_LABEL,
  loadRoutes,
} from "@/lib/cargoStore";

const TYPE_ICON: Record<CargoType, typeof Plane> = {
  air: Plane,
  express: Zap,
  regular: Package,
};

export function CargoServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [routes, setRoutes] = useState<CargoRoute[] | null>(null);
  const [activeType, setActiveType] = useState<CargoType>("air");

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadRoutes(shopId).then((r) => {
      if (active) setRoutes(r);
    });
    return () => { active = false; };
  }, [shopId]);

  const availableTypes = useMemo(() => {
    if (!routes) return [];
    const set = new Set(routes.map((r) => r.type));
    return (Object.keys(CARGO_TYPE_LABEL) as CargoType[]).filter((t) => set.has(t));
  }, [routes]);

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(activeType)) {
      setActiveType(availableTypes[0]);
    }
  }, [availableTypes, activeType]);

  const visibleRoutes = (routes ?? []).filter((r) => r.type === activeType);

  // Loading state — keep the layout from jumping
  if (routes === null) {
    return <div className="p-5 bg-white min-h-[50vh]" />;
  }

  // Empty state — owner hasn't added any routes yet
  if (routes.length === 0) {
    return (
      <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-500">
          <Plane className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">
          Чиглэл одоогоор нэмэгдээгүй байна
        </p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Дэлгүүрийн эзэн удахгүй карго чиглэлүүдээ энд нэмэх болно.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white min-h-[50vh]">
      {availableTypes.length > 1 && (
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          {availableTypes.map((t) => {
            const active = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`flex-1 font-bold py-2 rounded-lg text-sm transition-colors ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 font-medium"}`}
              >
                {CARGO_TYPE_LABEL[t]}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {visibleRoutes.map((route) => {
          const Icon = TYPE_ICON[route.type];
          return (
            <div
              key={route.id}
              className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 mb-1.5">
                    {route.fromCity} <span className="text-gray-400">→</span> {route.toCity}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-gray-600">
                    <span>
                      <b className="text-gray-900">{route.pricePerKg}</b> / кг
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 mt-1">
                    <span>⏱ {route.transitDays}</span>
                    {route.schedule && <span>📅 {route.schedule}</span>}
                  </div>
                </div>
              </div>
              <Link
                href={`/category/cargo/${shopId}/order?routeId=${route.id}`}
                className="flex items-center justify-center gap-1.5 w-full bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-[13px] active:scale-[0.98] transition-transform"
              >
                Энэ чиглэлээр захиалах
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
