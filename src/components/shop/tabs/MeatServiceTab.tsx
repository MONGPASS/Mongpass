'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Beef, Minus, Plus, ShoppingCart } from "lucide-react";
import { MeatProduct, loadMeatProducts } from "@/lib/meatProductStore";
import {
  CartItem,
  addToCart,
  cartSubtotal,
  cartTotalCount,
  loadCart,
  updateQty,
} from "@/lib/cartStore";
import { formatPrice } from "@/lib/orderStore";
import { r2Url } from "@/lib/images/upload";

/**
 * Customer-facing meat product list. Each row has a "+ Сагсанд" button
 * that adds one to a per-shop cart (localStorage), and once anything's
 * in the cart a sticky bar at the bottom links to the order page where
 * the customer fills in their address and sees the bank-transfer
 * instructions. The order page reads the same cart on mount, so
 * quantities chosen here carry over.
 */
export function MeatServiceTab() {
  const params = useParams();
  const router = useRouter();
  const shopId = String(params?.shopId ?? "");
  const [products, setProducts] = useState<MeatProduct[] | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadMeatProducts(shopId).then((p) => {
      if (active) setProducts(p);
    });
    setCart(loadCart(shopId));
    return () => { active = false; };
  }, [shopId]);

  function handleAdd(p: MeatProduct) {
    const next = addToCart(shopId, {
      itemId: p.id,
      category: p.category,
      name: p.name,
      price: p.price,
    });
    setCart(next);
  }

  function handleQty(itemId: string, qty: number) {
    setCart(updateQty(shopId, itemId, qty));
  }

  if (products === null) {
    return <div className="p-5 bg-white min-h-[50vh]" />;
  }

  if (products.length === 0) {
    return (
      <div className="p-5 bg-white min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
          <Beef className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">Бараа нэмэгдээгүй байна</p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Махны дэлгүүрийн эзэн удахгүй өөрийн бүтээгдэхүүнүүдийг энд нэмэх болно.
        </p>
      </div>
    );
  }

  // Group by category for nicer scanning.
  const grouped = new Map<string, MeatProduct[]>();
  for (const p of products) {
    const list = grouped.get(p.category) ?? [];
    list.push(p);
    grouped.set(p.category, list);
  }

  const cartCount = cartTotalCount(cart);
  const cartTotal = cartSubtotal(cart);
  const qtyOf = (id: string) => cart.find((c) => c.itemId === id)?.qty ?? 0;

  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-5 pb-32">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((p) => {
              const q = qtyOf(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex gap-3 items-center"
                >
                  <div className="w-16 h-16 rounded-lg bg-primary/10 shrink-0 overflow-hidden flex items-center justify-center text-primary/60">
                    {p.imageR2Key ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r2Url(p.imageR2Key)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Beef className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 mb-0.5">
                        {p.description}
                      </p>
                    )}
                    <p className="text-[14px] font-bold text-primary">
                      {p.price}{" "}
                      <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                    </p>
                  </div>
                  {q > 0 ? (
                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        onClick={() => handleQty(p.id, q - 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                        aria-label="Хасах"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{q}</span>
                      <button
                        onClick={() => handleQty(p.id, q + 1)}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center"
                        aria-label="Нэмэх"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAdd(p)}
                      className="shrink-0 px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Сагсанд
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {cartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30 pointer-events-none">
          <button
            onClick={() => router.push(`/category/meat/${encodeURIComponent(shopId)}/order`)}
            className="pointer-events-auto w-full bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-transform max-w-[480px] mx-auto"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Сагс ({cartCount})
            </span>
            <span>{formatPrice(cartTotal)} →</span>
          </button>
        </div>
      )}
    </div>
  );
}
