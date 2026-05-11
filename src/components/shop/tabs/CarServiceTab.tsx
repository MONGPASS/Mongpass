'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CarFront } from "lucide-react";
import { CarListing, loadCarListings } from "@/lib/carListingStore";
import { r2Url } from "@/lib/images/upload";

export function CarServiceTab() {
  const params = useParams();
  const shopId = String(params?.shopId ?? "");
  const [listings, setListings] = useState<CarListing[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadCarListings(shopId).then((l) => {
      if (active) setListings(l);
    });
    return () => { active = false; };
  }, [shopId]);

  if (listings === null) {
    return <div className="p-5 bg-gray-50 min-h-[50vh]" />;
  }

  if (listings.length === 0) {
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

  return (
    <div className="bg-gray-50 min-h-[50vh] p-4 space-y-3">
      {listings.map((l) => (
        <Link
          key={l.id}
          href={`/category/car/${encodeURIComponent(shopId)}/listing/${encodeURIComponent(l.id)}`}
          className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3 active:scale-[0.99] transition-transform"
        >
          <div className="w-32 aspect-[4/3] bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
            {l.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r2Url(l.images[0])}
                alt={l.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <CarFront className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-center">
            {/* Sold pill takes priority — when set the price is muted
                too so the customer doesn't get false hopes. */}
            {l.status === "sold" && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-gray-900 text-white px-1.5 py-0.5 rounded-md mb-1 w-max">
                Зарагдсан
              </span>
            )}
            <p className="font-bold text-[14px] text-gray-900 line-clamp-2 mb-1">
              {l.title}
            </p>
            {l.price && (
              <p className={`text-[15px] font-black mb-1 ${l.status === "sold" ? "text-gray-400 line-through" : "text-primary"}`}>
                {l.price}
              </p>
            )}
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              {l.yearManufactured && <span>{l.yearManufactured}</span>}
              {l.mileage && <span>· {l.mileage}</span>}
              {l.transmission && <span>· {l.transmission}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
