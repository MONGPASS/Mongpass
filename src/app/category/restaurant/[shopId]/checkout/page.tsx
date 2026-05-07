'use client';

import { ArrowLeft, Plus, Minus, Trash2, Send, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CartItem,
  loadCart,
  updateQty,
  clearCart,
  cartSubtotal,
  cartTotalCount,
} from "@/lib/cartStore";
import {
  RestaurantOrder,
  addOrder,
  formatPrice,
  newOrderId,
} from "@/lib/orderStore";
import { addMyOrderId } from "@/lib/myOrdersStore";

export default function RestaurantCheckoutPage({ params }: { params: { shopId: string } }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setCart(loadCart(params.shopId));
  }, [params.shopId]);

  function handleQty(itemId: string, qty: number) {
    setCart(updateQty(params.shopId, itemId, qty));
  }

  function submit() {
    if (cart.length === 0 || !name.trim() || !phone.trim() || !address.trim()) return;
    const order: RestaurantOrder = {
      id: newOrderId(),
      shopCategory: "restaurant",
      shopId: params.shopId,
      createdAt: new Date().toISOString(),
      status: "pending",
      items: cart.map((c) => ({
        itemId: c.itemId,
        category: c.category,
        name: c.name,
        price: c.price,
        qty: c.qty,
      })),
      subtotalAmount: cartSubtotal(cart),
      customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
      notes: notes.trim() || undefined,
    };
    addOrder(order);
    addMyOrderId(order.id);
    clearCart(params.shopId);
    setSubmitted(true);
  }

  const subtotal = cartSubtotal(cart);
  const totalCount = cartTotalCount(cart);
  const canSubmit =
    cart.length > 0 && name.trim().length > 0 && phone.trim().length > 0 && address.trim().length > 0;

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Захиалга илгээгдлээ!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Дэлгүүр таны захиалгыг хүлээн авч баталгаажуулна.
          </p>
          <Link
            href={`/category/restaurant/${params.shopId}`}
            className="block w-full bg-orange-500 text-white font-semibold py-3 rounded-xl text-sm"
          >
            Дэлгүүр рүү буцах
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={`/category/restaurant/${params.shopId}`}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Захиалга баталгаажуулах</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Cart items */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">
            1. Сонгосон зүйлс <span className="text-[11px] font-medium text-gray-400">({totalCount})</span>
          </h2>
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">Сагс хоосон байна</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.itemId} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                      {item.category}
                    </p>
                    <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQty(item.itemId, item.qty - 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                      aria-label="Хасах"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button
                      onClick={() => handleQty(item.itemId, item.qty + 1)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"
                      aria-label="Нэмэх"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleQty(item.itemId, 0)}
                      className="ml-1 p-1 text-red-400 hover:text-red-600"
                      aria-label="Устгах"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-3 flex items-baseline justify-between">
                <span className="text-xs text-gray-500">Нийт дүн</span>
                <span className="font-bold text-base text-gray-900">{formatPrice(subtotal)}</span>
              </div>
            </div>
          )}
        </section>

        {/* Customer info */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">2. Хүргэх мэдээлэл</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Сараа"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хүргэх хаяг</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="경기도 안산시 ..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Нэмэлт тэмдэглэл <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Халуун ногоо багатай / Хаалгаар авах ..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky bottom — submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[11px] font-medium text-gray-500">Нийт дүн</span>
            <span className="font-bold text-base text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" /> Захиалга илгээх
          </button>
        </div>
      </div>
    </main>
  );
}
