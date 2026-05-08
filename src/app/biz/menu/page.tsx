'use client';

import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MenuItem,
  loadMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  groupItems,
} from "@/lib/menuStore";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";

export default function RestaurantMenuAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>({
    category: "Гол хоол",
    name: "",
    desc: "",
    price: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/menu");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "restaurant" && shop.category !== "food") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      setItems(await loadMenuItems(shop.id));
      if (active) setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ category: "Гол хоол", name: "", desc: "", price: "" });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(item: MenuItem) {
    setForm({ category: item.category, name: item.name, desc: item.desc, price: item.price });
    setEditingId(item.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function submit() {
    if (!shopId || busy) return;
    if (!form.name.trim() || !form.price.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createMenuItem(shopId, form);
        if (created) {
          setItems((prev) => [...prev, created]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await updateMenuItem(shopId, editingId, form);
        if (updated) {
          setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
          setEditingId(null);
          flash();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!shopId) return;
    if (!confirm("Энэ цэсийг устгах уу?")) return;
    const ok = await deleteMenuItem(shopId, id);
    if (ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const grouped = groupItems(items);
  const showForm = isAdding || editingId !== null;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Цэс удирдах</h1>
          {savedFlash && (
            <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>
          )}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд нэмсэн цэс нь зөвхөн таны дэлгүүрийн хуудсан дээр харагдана.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ цэс нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ цэс" : "Цэс засах"}
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ангилал (жишээ: Гол хоол)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                placeholder="Цэсийн нэр"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <textarea
                placeholder="Тайлбар"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
              />
              <input
                type="text"
                placeholder="Үнэ (жишээ: 12,000₩)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={busy || !form.name.trim() || !form.price.trim()}
                  className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {busy ? "..." : "Хадгалах"}
                </button>
                <button
                  onClick={cancel}
                  className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Болих
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        {grouped.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Цэс хоосон байна</p>
        )}
        {grouped.map((cat) => (
          <div key={cat.category} className="mb-5">
            <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wider mb-2 px-1">
              {cat.category}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {cat.items.map((item) => (
                <div key={item.id} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-1">{item.desc}</p>
                    <p className="font-bold text-sm text-gray-900">{item.price}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      aria-label="Засах"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="Устгах"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
