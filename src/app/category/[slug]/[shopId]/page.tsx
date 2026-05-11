'use client';

export const runtime = "edge";

import Link from "next/link";
import { parseTimestamp } from "@/lib/datetime";
import { ArrowLeft, Store } from "lucide-react";
import { useEffect, useState } from "react";
import ShopDetailPage from "@/components/shop/ShopDetailPage";
import { ShopCategory, ShopData } from "@/components/shop/types";
import { Shop, findShopById } from "@/lib/shopStore";
import { recordShopView } from "@/lib/recentlyViewedStore";
import { getCurrentUser } from "@/lib/userStore";

/**
 * Bridge our internal Shop record (lib/shopStore) to the richer ShopData
 * shape ShopDetailPage expects. Fields we don't yet collect get sensible
 * placeholder values; future PRs can extend Shop with ratings, hours,
 * social links, etc.
 */
function shopToShopData(shop: Shop): ShopData {
  return {
    id: shop.id,
    name: shop.name,
    images: shop.images ?? [],
    rating: shop.avgRating ?? 0,
    reviews: shop.reviewCount ?? 0,
    address: shop.address ?? "—",
    openHours: shop.openHours ?? "—",
    phone: shop.contactPhone ?? "—",
    facebook: shop.facebook,
    instagram: shop.instagram,
    description: shop.description,
    notices: (shop.notices ?? []).map((n) => ({
      id: parseInt(n.id.replace(/[^0-9]/g, "").slice(-9), 10) || 0,
      title: n.title,
      content: n.content,
      date: parseTimestamp(n.createdAt).toLocaleDateString("mn-MN"),
    })),
    isOpen: shop.isOpen,
    status: shop.status,
  };
}

export default function CategoryItemPage({
  params,
}: {
  params: { slug: string; shopId: string };
}) {
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      const found = await findShopById(params.shopId);
      if (!active) return;
      setShop(found ?? null);
      // Record view only for shops that exist (and skip the owner viewing
      // their own shop preview — they'd flood their own history).
      if (found && found.status === "approved") {
        const user = await getCurrentUser();
        if (!active) return;
        if (!user || user.id !== found.ownerId) {
          recordShopView(user?.id ?? null, found.id);
        }
      }
    })();
    return () => { active = false; };
  }, [params.shopId]);

  if (shop === undefined) {
    return <main className="w-full min-h-screen bg-white" />;
  }

  if (shop === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Дэлгүүр олдсонгүй</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Энэ дэлгүүр устгагдсан эсвэл одоогоор бүртгэлд байхгүй байна.
          </p>
          <Link
            href={`/category/${params.slug}`}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Жагсаалт руу буцах
          </Link>
        </div>
      </main>
    );
  }

  // Use the shop's actual category for tab/CTA logic, even if URL slug
  // differs (e.g. "food" vs "restaurant").
  const category: ShopCategory = shop.category;

  return <ShopDetailPage category={category} shopData={shopToShopData(shop)} />;
}
