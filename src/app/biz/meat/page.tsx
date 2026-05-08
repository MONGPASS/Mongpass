'use client';

import { ArrowLeft, Camera, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MeatProduct,
  MEAT_PRODUCT_CATEGORIES,
  loadMeatProducts,
  createMeatProduct,
  updateMeatProduct,
  deleteMeatProduct,
} from "@/lib/meatProductStore";
import { Shop, findShopByOwner, updateShop } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url, uploadImage } from "@/lib/images/upload";

const empty: Omit<MeatProduct, "id"> = {
  category: MEAT_PRODUCT_CATEGORIES[0],
  name: "",
  description: "",
  price: "",
  unit: "1кг",
  imageR2Key: undefined,
};

export default function MeatAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [products, setProducts] = useState<MeatProduct[]>([]);
  const [filter, setFilter] = useState<string>(MEAT_PRODUCT_CATEGORIES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Omit<MeatProduct, "id">>(empty);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Payment settings — saved on the Shop itself (one row per shop) so
  // we don't need a separate table just for two scalars.
  const [bankAccount, setBankAccount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentFlash, setPaymentFlash] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/meat");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "meat") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      setBankAccount(shop.bankAccount ?? "");
      setDeliveryFee(
        shop.deliveryFee !== undefined ? String(shop.deliveryFee) : "",
      );
      setProducts(await loadMeatProducts(shop.id));
      if (active) setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  async function savePayment() {
    if (!shopId || paymentBusy) return;
    // Empty delivery fee → null (uses store-default behaviour, hides line).
    // Otherwise must parse to a non-negative integer.
    let fee: number | null = null;
    const trimmed = deliveryFee.trim();
    if (trimmed) {
      // Allow "5,000" / "5000원" by stripping non-digits before parsing.
      const cleaned = trimmed.replace(/[^\d]/g, "");
      if (!cleaned) {
        alert("Хүргэлтийн төлбөр буруу байна");
        return;
      }
      fee = Number(cleaned);
    }
    setPaymentBusy(true);
    try {
      const updated: Shop | null = await updateShop(shopId, {
        bankAccount: bankAccount.trim(),
        deliveryFee: fee,
      });
      if (updated) {
        setBankAccount(updated.bankAccount ?? "");
        setDeliveryFee(
          updated.deliveryFee !== undefined ? String(updated.deliveryFee) : "",
        );
        setPaymentFlash(true);
        setTimeout(() => setPaymentFlash(false), 1500);
      }
    } catch {
      alert("Хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setPaymentBusy(false);
    }
  }

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ ...empty, category: filter });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(p: MeatProduct) {
    setForm({
      category: p.category,
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      imageR2Key: p.imageR2Key,
    });
    setEditingId(p.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  // Image upload — same WebP pipeline as the cargo / community forms.
  // Done client-side so we can drop the result key into the form
  // BEFORE the user clicks "Хадгалах". The R2 object is uploaded
  // immediately though, so an aborted form leaves an orphan blob —
  // not great, but acceptable for an MVP and consistent with the rest
  // of the app.
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Зургийн хэмжээ 8MB-аас бага байх ёстой.");
      return;
    }
    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(file, "meat");
      if (!uploaded) {
        alert("Зураг ачаалж чадсангүй. Дахин оролдоно уу.");
        return;
      }
      setForm((f) => ({ ...f, imageR2Key: uploaded.key }));
    } finally {
      setUploadingImage(false);
    }
  }

  async function submit() {
    if (!shopId || busy) return;
    if (!form.name.trim() || !form.price.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createMeatProduct(shopId, form);
        if (created) {
          setProducts((prev) => [...prev, created]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        // PATCH expects null (not undefined) to actively clear the image.
        const updated = await updateMeatProduct(shopId, editingId, {
          ...form,
          imageR2Key: form.imageR2Key ?? null,
        });
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
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
    if (!confirm("Энэ бүтээгдэхүүнийг устгах уу?")) return;
    const ok = await deleteMeatProduct(shopId, id);
    if (ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
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
          <h1 className="font-bold text-base flex-1">Бараа удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Payment settings — bank account + delivery fee.
            Empty values → user-facing order page hides the relevant
            line. Owner can still take orders by chat without these. */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-900">Төлбөр &amp; хүргэлт</h2>
            {paymentFlash && (
              <span className="text-[11px] text-green-600 font-semibold">Хадгалагдлаа</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
            Үйлчлүүлэгч захиалга өгөх үед нийт үнэ дээр хүргэлтийн төлбөр нэмэгдэн харагдаж,
            доорх данс руу шилжүүлэх зааварчилгаа гарна.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Хүлээн авах данс
              </label>
              <input
                type="text"
                placeholder="Шинхан 110-000-000000 / Холбогдох нэр"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Хүргэлтийн төлбөр (₩)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0 = үнэгүй хүргэлт"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={savePayment}
              disabled={paymentBusy}
              className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {paymentBusy ? "Хадгалж байна..." : "Төлбөрийн тохиргоо хадгалах"}
            </button>
          </div>
        </div>

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

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ бүтээгдэхүүн нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ бүтээгдэхүүн" : "Бүтээгдэхүүн засах"}
            </h2>

            {/* Image picker — same WebP-on-upload pipeline as the rest of
                the app. Empty slot opens the file picker; filled slot
                shows preview + remove (X) overlay. */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Бүтээгдэхүүний зураг{" "}
                <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {form.imageR2Key ? (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r2Url(form.imageR2Key)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageR2Key: undefined }))}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Зураг хасах"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">
                    {uploadingImage ? "Ачаалж байна..." : "Зураг хавсаргах"}
                  </span>
                </button>
              )}
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
        {visible.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">
            &ldquo;{filter}&rdquo; ангилалд бараа алга байна
          </p>
        ) : (
          visible.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-3 mb-3 shadow-sm flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 shrink-0 overflow-hidden flex items-center justify-center text-primary/40">
                {p.imageR2Key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r2Url(p.imageR2Key)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-gray-900 truncate mb-0.5">{p.name}</h4>
                <p className="text-[12px] text-gray-500 truncate mb-1">{p.description}</p>
                <p className="text-[14px] font-bold text-primary">
                  {p.price} <span className="text-[11px] text-gray-500 font-normal">/ {p.unit}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => startEdit(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
