'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { MenuCategory, defaultMenu, loadMenu } from "@/lib/menuStore";
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
  const shopId = String(params?.shopId ?? "1");
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(defaultMenu);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setMenuCategories(loadMenu());
    setCart(loadCart(shopId));
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

  function handleUpdateQty(itemId: string, qty: number) {
    const next = updateQty(shopId, itemId, qty);
    setCart(next);
  }

  function findQty(itemId: string): number {
    return cart.find((c) => c.itemId === itemId)?.qty ?? 0;
  }

  const totalCount = cartTotalCount(cart);
  const subtotal = cartSubtotal(cart);

  return (
    <div className="bg-white min-h-[50vh] pb-32">
      {menuCategories.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-12">Цэс хоосон байна</p>
      )}
      {menuCategories.map((cat, idx) => (
        <div key={idx} className="mb-6">
          <div className="bg-gray-50 px-5 py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wider sticky top-0 border-y border-gray-100 placeholder-opacity-95 backdrop-blur-md z-10">
            {cat.category}
          </div>
          <div className="px-5 divide-y divide-gray-100">
            {cat.items.map((item) => {
              const qty = findQty(item.id);
              return (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-[15px] mb-1">{item.name}</h4>
                    <p className="text-[12px] text-gray-500 line-clamp-2 mb-2">{item.desc}</p>
                    <p className="font-bold text-sm text-gray-900">{item.price}</p>
                  </div>
                  <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold relative overflow-hidden">
                    <span>IMG</span>
                    {qty === 0 ? (
                      <button
                        onClick={() =>
                          handleAdd({
                            id: item.id,
                            name: item.name,
                            category: cat.category,
                            price: item.price,
                          })
                        }
                        className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-primary font-bold shadow-sm shadow-black/20"
                        aria-label="Сагсанд нэмэх"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between bg-white rounded-full shadow-sm">
                        <button
                          onClick={() => handleUpdateQty(item.id, qty - 1)}
                          className="w-6 h-6 flex items-center justify-center text-primary"
                          aria-label="Хасах"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-bold text-gray-900">{qty}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, qty + 1)}
                          className="w-6 h-6 flex items-center justify-center text-primary"
                          aria-label="Нэмэх"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {totalCount > 0 && (
        <button
          onClick={() => router.push(`/category/restaurant/${shopId}/checkout`)}
          className="fixed bottom-[80px] left-1/2 -translate-x-1/2 max-w-[440px] w-[calc(100%-32px)] bg-orange-500 text-white font-bold py-3.5 rounded-2xl shadow-lg flex items-center justify-between px-5 z-30 active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Сагсанд {totalCount} зүйл
          </span>
          <span>{formatPrice(subtotal)} →</span>
        </button>
      )}
    </div>
  );
}
