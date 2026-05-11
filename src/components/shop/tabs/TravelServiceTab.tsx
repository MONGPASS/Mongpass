'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Plane, Clock, Users } from "lucide-react";
import { TravelPackage, loadTravelPackages } from "@/lib/travelPackageStore";
import { r2Url } from "@/lib/images/upload";

export function TravelServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [packages, setPackages] = useState<TravelPackage[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadTravelPackages(shopId).then((p) => {
      if (active) setPackages(p);
    });
    return () => { active = false; };
  }, [shopId]);

  if (packages === null) {
    return <div className="p-5 bg-gray-50 min-h-[50vh]" />;
  }

  if (packages.length === 0) {
    return (
      <div className="p-5 bg-gray-50 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-yellow-500">
          <Plane className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">
          Аяллын багц нэмэгдээгүй байна
        </p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Дэлгүүрийн эзэн удахгүй өөрийн санал болгож буй аяллын багцуудыг энд нэмэх болно.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[50vh] p-4 space-y-3">
      {packages.map((p) => (
        <Link
          key={p.id}
          href={`/category/travel/${encodeURIComponent(shopId)}/package/${encodeURIComponent(p.id)}`}
          className="bg-white rounded-2xl shadow-sm overflow-hidden block active:scale-[0.99] transition-transform"
        >
          <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center text-gray-400 relative">
            {p.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r2Url(p.images[0])} alt="" className="w-full h-full object-cover" />
            ) : (
              <Plane className="w-10 h-10" />
            )}
            {p.status === "sold_out" && (
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-md">
                Дууссан
              </span>
            )}
          </div>
          <div className="p-3.5">
            <p className="font-bold text-[15px] text-gray-900 line-clamp-2 mb-1.5">
              {p.title}
            </p>
            {p.price && (
              <p className={`text-[15px] font-black mb-2 ${p.status === "sold_out" ? "text-gray-400 line-through" : "text-primary"}`}>
                {p.price}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-3">
              {p.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {p.duration}
                </span>
              )}
              {p.groupSize && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {p.groupSize}
                </span>
              )}
            </div>
            {/* "Дэлгэрэнгүй үзэх" affordance — makes the whole card
                read as a navigable item rather than passive content. */}
            <div className="flex items-center justify-end gap-1 text-[12px] font-bold text-primary">
              Дэлгэрэнгүй үзэх
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
