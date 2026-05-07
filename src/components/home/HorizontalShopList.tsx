'use client';

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Shop, isShopOpen } from "@/lib/shopStore";
import { CATEGORY_REGISTRY } from "@/lib/categories";

interface Props {
  /** Section heading. */
  title: string;
  /** Shops to render. Caller is responsible for filtering/sorting. */
  shops: Shop[];
  /** Optional "see all" link target. */
  seeAllHref?: string;
  /** Show "Шинэ" or "Онцлох" badge style. */
  badge?: "new" | "featured";
}

export function HorizontalShopList({ title, shops, seeAllHref, badge }: Props) {
  if (shops.length === 0) return null;

  return (
    <section className="bg-white pt-5 pb-2">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="font-bold text-[15px] text-gray-900">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-[12px] font-bold text-primary">
            Бүгд
          </Link>
        )}
      </div>
      <div className="flex overflow-x-auto hide-scroll px-5 gap-3 snap-x">
        {shops.map((shop) => (
          <ShopMiniCard key={shop.id} shop={shop} badge={badge} />
        ))}
      </div>
    </section>
  );
}

function ShopMiniCard({ shop, badge }: { shop: Shop; badge?: "new" | "featured" }) {
  const categoryLabel = CATEGORY_REGISTRY[shop.category]?.label ?? shop.category;
  const cover = shop.images?.[0];
  const closed = !isShopOpen(shop);

  return (
    <Link
      href={`/category/${shop.category}/${shop.id}`}
      className="snap-start shrink-0 w-[150px] active:scale-[0.98] transition-transform"
    >
      <div className="relative w-[150px] h-[150px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 mb-2">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={shop.name}
            className={`w-full h-full object-cover ${closed ? "opacity-60" : ""}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white text-3xl font-bold opacity-50 ${closed ? "grayscale" : ""}`}>
            {shop.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {badge === "featured" && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3" /> Онцлох
          </span>
        )}
        {badge === "new" && (
          <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            Шинэ
          </span>
        )}
        {/* Closed state — subtle but unmistakable. We don't show a
            "Нээлттэй" badge for open shops to keep cards uncluttered. */}
        {closed && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            Хаалттай
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
        {categoryLabel}
      </p>
      <p className="font-bold text-[13px] text-gray-900 truncate leading-snug">{shop.name}</p>
    </Link>
  );
}
