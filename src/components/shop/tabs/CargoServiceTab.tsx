'use client';

import { useEffect, useMemo, useState } from "react";
import { Plane, Zap, Package, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CargoRoute,
  CargoType,
  CARGO_TYPE_LABEL,
  defaultRoutes,
  loadRoutes,
} from "@/lib/cargoStore";

const TYPE_ICON: Record<CargoType, typeof Plane> = {
  air: Plane,
  express: Zap,
  regular: Package,
};

export function CargoServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "1");
  const [routes, setRoutes] = useState<CargoRoute[]>(defaultRoutes);
  const [activeType, setActiveType] = useState<CargoType>("air");

  useEffect(() => {
    setRoutes(loadRoutes());
  }, []);

  const availableTypes = useMemo(() => {
    const set = new Set(routes.map((r) => r.type));
    return (Object.keys(CARGO_TYPE_LABEL) as CargoType[]).filter((t) => set.has(t));
  }, [routes]);

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(activeType)) {
      setActiveType(availableTypes[0]);
    }
  }, [availableTypes, activeType]);

  const visibleRoutes = routes.filter((r) => r.type === activeType);

  return (
    <div className="p-5 bg-white min-h-[50vh]">
      {availableTypes.length > 0 && (
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

      {visibleRoutes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Чиглэл байхгүй байна</p>
      ) : (
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
      )}
    </div>
  );
}
