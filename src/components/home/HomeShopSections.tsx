'use client';

import { useEffect, useState } from "react";
import { Shop, loadFeaturedShops, loadNewestApprovedShops } from "@/lib/shopStore";
import { loadFavoriteShops } from "@/lib/favoriteStore";
import { loadRecentlyViewedShops } from "@/lib/recentlyViewedStore";
import { getCurrentUser } from "@/lib/userStore";
import { HorizontalShopList } from "./HorizontalShopList";

/**
 * The three "discovery" sections rendered on the home page below the
 * banner. Each component is self-contained — it loads its own data and
 * returns null when there's nothing to show, so the home page composes
 * them without conditional logic.
 */

export function FeaturedShopsSection() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    let active = true;
    loadFeaturedShops().then((s) => {
      if (active) setShops(s);
    });
    return () => { active = false; };
  }, []);

  return <HorizontalShopList title="Онцлох дэлгүүр" shops={shops} badge="featured" />;
}

export function NewShopsSection() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    let active = true;
    loadNewestApprovedShops(8).then((s) => {
      if (active) setShops(s);
    });
    return () => { active = false; };
  }, []);

  return <HorizontalShopList title="Шинээр нэмэгдсэн" shops={shops} badge="new" />;
}

export function FavoritesSection() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      const list = await loadFavoriteShops(user?.id ?? null);
      if (active) setShops(list);
    })();
    return () => { active = false; };
  }, []);

  return <HorizontalShopList title="Хадгалсан дэлгүүр" shops={shops} />;
}

export function RecentlyViewedSection() {
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      const list = await loadRecentlyViewedShops(user?.id ?? null);
      if (active) setShops(list);
    })();
    return () => { active = false; };
  }, []);

  return <HorizontalShopList title="Сүүлд үзсэн" shops={shops} />;
}
