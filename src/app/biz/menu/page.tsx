'use client';

import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MenuItem,
  loadMenu,
  saveMenu,
  flattenItems,
  groupItems,
  newId,
} from "@/lib/menuStore";

export default function RestaurantMenuAdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>({
    category: "Гол хоол",
    name: "",
    desc: "",
    price: "",
  });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setItems(flattenItems(loadMenu()));
  }, []);

  function persist(next: MenuItem[]) {
    setItems(next);
    saveMenu(groupItems(next));
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

  function submit() {
    if (!form.name.trim() || !form.price.trim()) return;
    if (isAdding) {
      persist([...items, { id: newId(), ...form }]);
      setIsAdding(false);
    } else if (editingId) {
      persist(items.map((i) => (i.id === editingId ? { id: i.id, ...form } : i)));
      setEditingId(null);
    }
  }

  function remove(id: string) {
    if (!confirm("Энэ цэсийг устгах уу?")) return;
    persist(items.filter((i) => i.id !== id));
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
          <h1 className="font-bold text-base flex-1">Цэс удирдах (Restaurant)</h1>
          {savedFlash && (
            <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>
          )}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд нэмсэн цэс нь сүүлд хэрэглэгчийн талд{" "}
            <Link href="/category/restaurant/1" className="text-blue-600 underline">
              /category/restaurant/1
            </Link>{" "}
            хуудсан дээр харагдана.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
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
                  disabled={!form.name.trim() || !form.price.trim()}
                  className="flex-1 bg-orange-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Хадгалах
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
