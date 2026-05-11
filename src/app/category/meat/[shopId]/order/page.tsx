'use client';

export const runtime = "edge";

import { ArrowLeft, Beef, Check, Copy, Minus, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MeatProduct,
  MEAT_PRODUCT_CATEGORIES,
  loadMeatProducts,
} from "@/lib/meatProductStore";
import {
  MeatOrder,
  MeatOrderItem,
  addOrder,
  formatPrice,
  newOrderId,
  parsePrice,
} from "@/lib/orderStore";
import { Shop, findShopById } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { useRouter } from "next/navigation";
import { CartItem, clearCart, loadCart, saveCart } from "@/lib/cartStore";
import { r2Url } from "@/lib/images/upload";

export default function MeatOrderPage({ params }: { params: { shopId: string } }) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [products, setProducts] = useState<MeatProduct[]>([]);
  const [filter, setFilter] = useState<string>(MEAT_PRODUCT_CATEGORIES[0]);
  // Cart is the source of truth for quantities; we mirror it into a
  // simple { itemId → qty } map for fast lookups in the render below.
  // Persisted via cartStore (localStorage) so that what the user
  // chose on the shop detail page carries over.
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bankCopied, setBankCopied] = useState(false);

  // Auth gate + initial load.
  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active) return;
      if (!u) {
        router.replace(
          `/login?redirect=/category/meat/${encodeURIComponent(params.shopId)}/order`,
        );
        return;
      }
      const [s, ps] = await Promise.all([
        findShopById(params.shopId),
        loadMeatProducts(params.shopId),
      ]);
      if (!active) return;
      setShop(s);
      setProducts(ps);
      setCart(loadCart(params.shopId));
    })();
    return () => { active = false; };
  }, [params.shopId, router]);

  // Quantity setter — writes through cartStore so changes persist
  // and stay in sync with the shop detail page on the next visit.
  function setQty(p: MeatProduct, qty: number) {
    const clamped = Math.max(0, Math.min(qty, 99));
    setCart((prev) => {
      let next: CartItem[];
      if (clamped === 0) {
        next = prev.filter((c) => c.itemId !== p.id);
      } else {
        const existing = prev.find((c) => c.itemId === p.id);
        if (existing) {
          next = prev.map((c) => (c.itemId === p.id ? { ...c, qty: clamped } : c));
        } else {
          next = [
            ...prev,
            {
              itemId: p.id,
              category: p.category,
              name: p.name,
              price: p.price,
              qty: clamped,
            },
          ];
        }
      }
      saveCart(params.shopId, next);
      return next;
    });
  }

  const qtyOf = (id: string) => cart.find((c) => c.itemId === id)?.qty ?? 0;

  // Derived totals — computed every render from the cart joined to
  // the latest product list (for unit / fresh price strings).
  const { subtotal, items } = useMemo(() => {
    const items: MeatOrderItem[] = [];
    let subtotal = 0;
    for (const c of cart) {
      const p = products.find((x) => x.id === c.itemId);
      // Skip cart entries whose product was deleted by the owner — we
      // could prune the cart, but that would clobber user state mid-render.
      if (!p) continue;
      const lineUnit = parsePrice(p.price);
      subtotal += lineUnit * c.qty;
      items.push({
        productId: p.id,
        category: p.category,
        name: p.name,
        price: p.price,
        unit: p.unit,
        qty: c.qty,
      });
    }
    return { subtotal, items };
  }, [products, cart]);

  const deliveryFee = shop?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const bankAccount = shop?.bankAccount?.trim() ?? "";

  const visibleProducts = products.filter((p) => p.category === filter);

  const canSubmit =
    items.length > 0 &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    bankAccount.length > 0 &&
    !busy;

  async function copyBank() {
    if (!bankAccount) return;
    try {
      await navigator.clipboard.writeText(bankAccount);
      setBankCopied(true);
      setTimeout(() => setBankCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent fallback */
    }
  }

  async function submit() {
    if (!shop || !canSubmit) return;
    setBusy(true);
    try {
      const order: MeatOrder = {
        id: newOrderId(),
        shopCategory: "meat",
        shopId: shop.id,
        createdAt: new Date().toISOString(),
        status: "pending",
        items,
        subtotalAmount: subtotal,
        deliveryFee,
        totalAmount: total,
        bankAccountSnapshot: bankAccount,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        notes: notes.trim() || undefined,
      };
      const created = await addOrder(order);
      if (created) {
        clearCart(params.shopId);
        setCart([]);
        setSubmitted(true);
      }
    } finally {
      setBusy(false);
    }
  }

  if (shop === undefined) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  if (shop === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <p className="text-sm text-gray-500 mb-4">Дэлгүүр олдсонгүй.</p>
          <Link
            href="/"
            className="inline-block bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            Нүүр рүү
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Захиалга илгээгдлээ!</h2>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            Доорх данс руу <span className="font-bold text-gray-900">{formatPrice(total)}</span>{" "}
            шилжүүлсний дараа дэлгүүр баталгаажуулна.
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6 text-sm font-bold text-gray-900 break-all">
            {bankAccount}
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/profile/orders"
              className="block w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm"
            >
              Миний захиалгууд руу
            </Link>
            <Link
              href={`/category/meat/${shop.id}`}
              className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl text-sm"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link
            href={`/category/meat/${encodeURIComponent(shop.id)}`}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">Захиалга өгөх</h1>
            <p className="text-[11px] text-gray-500 truncate">{shop.name}</p>
          </div>
        </div>
      </header>

      {/* If the owner hasn't set the bank account yet, surface a clear
          banner; we still let the user browse products but block submit. */}
      {!bankAccount && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">
          Энэ дэлгүүр одоогоор төлбөр хүлээж авах данс тохируулаагүй байна.
          Захиалга өгөхийн өмнө дэлгүүртэй чатаар холбоо барина уу.
        </div>
      )}

      {/* Category filter */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 mb-3">
          {MEAT_PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-colors ${
                filter === c
                  ? "bg-primary border-primary text-white"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product list */}
        {visibleProducts.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">
            &ldquo;{filter}&rdquo; ангилалд бараа алга байна
          </p>
        ) : (
          <div className="space-y-2">
            {visibleProducts.map((p) => {
              const qty = qtyOf(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-3 shadow-sm flex gap-3 items-center"
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
                    <h4 className="font-bold text-sm text-gray-900 truncate">{p.name}</h4>
                    <p className="text-[12px] text-gray-500 truncate mb-1">{p.description}</p>
                    <p className="text-[14px] font-bold text-primary">
                      {p.price}{" "}
                      <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                    </p>
                  </div>
                  {qty === 0 ? (
                    <button
                      onClick={() => setQty(p, 1)}
                      className="shrink-0 bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center"
                      aria-label="Сагсанд нэмэх"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="shrink-0 flex items-center gap-2 bg-gray-50 rounded-full px-1 py-1 border border-gray-100">
                      <button
                        onClick={() => setQty(p, qty - 1)}
                        className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700"
                        aria-label="Хасах"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(p, qty + 1)}
                        className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center"
                        aria-label="Нэмэх"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer info */}
      <section className="bg-white mx-4 mt-4 rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Хүлээн авагчийн мэдээлэл</h3>
        <div>
          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Бат-Эрдэнэ"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Утас</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хүргэх хаяг</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="서울시 ..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
            Тэмдэглэл <span className="font-medium text-gray-400">(заавал биш)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Хүргэлтийн цаг г.м"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
          />
        </div>
      </section>

      {/* Order summary + bank info */}
      <section className="bg-white mx-4 mt-4 rounded-2xl shadow-sm p-4">
        <h3 className="font-bold text-sm text-gray-900 mb-3">Захиалгын дүн</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between text-gray-600">
            <span>Барааны дүн ({items.length} төрөл)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {shop.deliveryFee !== undefined && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Хүргэлтийн төлбөр</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-green-600 font-semibold">Үнэгүй</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
            <span className="font-bold text-gray-900">Нийт төлөх дүн</span>
            <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </div>

        {bankAccount && items.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-blue-700 mb-1">
              Доорх данс руу нийт дүнг шилжүүлнэ үү
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-gray-900 break-all flex-1">
                {bankAccount}
              </p>
              <button
                type="button"
                onClick={copyBank}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg px-2 py-1"
              >
                {bankCopied ? (
                  <>
                    <Check className="w-3 h-3" /> Хуулагдсан
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Хуулах
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-blue-700/80 mt-2 leading-relaxed">
              Шилжүүлгийн дараа дэлгүүр төлбөрийг баталгаажуулсны дараа захиалга бэлдэж эхэлнэ.
            </p>
          </div>
        )}
      </section>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {busy
              ? "Илгээж байна..."
              : items.length === 0
              ? "Бараа сонгоно уу"
              : `${formatPrice(total)} — Захиалга өгөх`}
          </button>
        </div>
      </div>
    </main>
  );
}
