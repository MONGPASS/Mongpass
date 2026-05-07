'use client';

import { ArrowLeft, Camera, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MeatProduct,
  MEAT_PRODUCT_CATEGORIES,
  loadMeatProducts,
  newMeatProductId,
  saveMeatProducts,
} from "@/lib/meatProductStore";

const empty: Omit<MeatProduct, "id"> = {
  category: MEAT_PRODUCT_CATEGORIES[0],
  name: "",
  description: "",
  price: "",
  unit: "1кг",
  imageDataUrl: undefined,
};

export default function MeatAdminPage() {
  const [products, setProducts] = useState<MeatProduct[]>([]);
  const [filter, setFilter] = useState<string>(MEAT_PRODUCT_CATEGORIES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<MeatProduct, "id">>(empty);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setProducts(loadMeatProducts());
  }, []);

  function persist(next: MeatProduct[]) {
    setProducts(next);
    saveMeatProducts(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ ...empty, category: filter });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(p: MeatProduct) {
    const { id, ...rest } = p;
    void id;
    setForm(rest);
    setEditingId(p.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  function submit() {
    if (!form.name.trim() || !form.price.trim()) return;
    if (isAdding) {
      persist([...products, { id: newMeatProductId(), ...form }]);
      setIsAdding(false);
    } else if (editingId) {
      persist(products.map((p) => (p.id === editingId ? { id: p.id, ...form } : p)));
      setEditingId(null);
    }
  }

  function remove(id: string) {
    if (!confirm("Энэ бүтээгдэхүүнийг устгах уу?")) return;
    persist(products.filter((p) => p.id !== id));
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setForm((f) => ({ ...f, imageDataUrl: ev.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const visible = products.filter((p) => p.category === filter);
  const showForm = isAdding || editingId !== null;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Бараа удирдах (Meat)</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд нэмсэн бараа нь сүүлд хэрэглэгчийн талд{" "}
            <Link href="/category/meat/1" className="text-blue-600 underline">
              /category/meat/1
            </Link>{" "}
            хуудсан дээр харагдана.
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 mb-3">
          {MEAT_PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold border transition-colors ${
                filter === c
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ бүтээгдэхүүн нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ бүтээгдэхүүн" : "Бүтээгдэхүүн засах"}
            </h2>

            {/* Image upload */}
            <div className="mb-3 flex justify-center">
              <input
                type="file"
                accept="image/*"
                id="meatProductImage"
                className="hidden"
                onChange={handleImage}
              />
              <label
                htmlFor="meatProductImage"
                className="w-24 h-24 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden"
              >
                {form.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageDataUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-medium">Зураг</span>
                  </>
                )}
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Ангилал</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  {MEAT_PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
                <input
                  type="text"
                  placeholder="Үхрийн цул мах"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Тайлбар</label>
                <input
                  type="text"
                  placeholder="Шинэ, ясгүй цул мах"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Үнэ</label>
                  <input
                    type="text"
                    placeholder="22,000₩"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэгж</label>
                  <input
                    type="text"
                    placeholder="1кг"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
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
        {visible.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">
            &ldquo;{filter}&rdquo; ангилалд бараа алга байна
          </p>
        ) : (
          visible.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-3 mb-3 shadow-sm flex gap-3">
              <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                {p.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageDataUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    Зураг
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-gray-900 truncate mb-0.5">{p.name}</h4>
                <p className="text-[12px] text-gray-500 truncate mb-1">{p.description}</p>
                <p className="text-[14px] font-bold text-orange-600">
                  {p.price} <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => startEdit(p)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
