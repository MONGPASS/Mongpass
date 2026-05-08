'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart, Utensils } from "lucide-react";
import { MenuCategory, loadMenu } from "@/lib/menuStore";
import {
  CartItem,
  loadCart,
  addToCart,
  updateQty,
  cartTotalCount,
  cartSubtotal,
} from "@/lib/cartStore";
import { formatPrice } from "@/lib/orderStore";

export function FoodServiceTab() {
  const params = useParams();
  const router = useRouter();
  const shopId = String(params?.shopId ?? "");
  const [menuCategories, setMenuCategories] = useState<MenuCategory[] | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    if (!shopId) return;
    loadMenu(shopId).then((m) => {
      if (active) setMenuCategories(m);
    });
    setCart(loadCart(shopId));
    return () => { active = false; };
  }, [shopId]);

  function handleAdd(item: { id: string; name: string; category: string; price: string }) {
    const next = addToCart(shopId, {
      itemId: item.id,
      category: item.category,
      name: item.name,
      price: item.price,
    });
    setCart(next);
  }

  function handleQty(itemId: string, qty: number) {
    setCart(updateQty(shopId, itemId, qty));
  }

  if (menuCategories === null) {
    return <div className="p-5 bg-gray-50 min-h-[50vh]" />;
  }

  if (menuCategories.length === 0) {
    return (
      <div className="p-5 bg-gray-50 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 text-orange-500">
          <Utensils className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-700 mb-1">Цэс нэмэгдээгүй байна</p>
        <p className="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
          Дэлгүүрийн эзэн удахгүй өөрийн хоолны цэсийг энд нэмэх болно.
        </p>
      </div>
    );
  }

  const cartCount = cartTotalCount(cart);
  const cartTotal = cartSubtotal(cart);
  const qtyOf = (id: string) => cart.find((c) => c.itemId === id)?.qty ?? 0;

  return (
    <div className="bg-gray-50 min-h-[50vh] pb-24">
      <div className="px-5 py-4 space-y-5">
        {menuCategories.map((cat) => (
          <div key={cat.category}>
            <h3 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">
              {cat.category}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {cat.items.map((item) => {
                const q = qtyOf(item.id);
                return (
                  <div key={item.id} className="p-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      {item.desc && (
                        <p className="text-[11px] text-gray-500 line-clamp-1">{item.desc}</p>
                      )}
                      <p className="text-[13px] font-bold text-gray-900 mt-1">{item.price}</p>
                    </div>
                    {q > 0 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleQty(item.id, q - 1)}
                          className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                          aria-label="Хасах"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{q}</span>
                        <button
                          onClick={() => handleQty(item.id, q + 1)}
                          className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center"
                          aria-label="Нэмэх"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd({ ...item })}
                        className="shrink-0 px-3 py-1.5 bg-orange-500 text-white text-[12px] font-bold rounded-lg flex items-center gap-1"
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
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
          <button
            onClick={() => router.push(`/category/restaurant/${shopId}/checkout`)}
            className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-transform max-w-[480px] mx-auto"
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
