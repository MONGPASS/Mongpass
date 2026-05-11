'use client';

import { ArrowLeft, Camera, CarFront, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CarListing,
  createCarListing,
  deleteCarListing,
  emptyCarListing,
  loadCarListings,
  updateCarListing,
} from "@/lib/carListingStore";
import {
  BODY_TYPE_OPTIONS,
  CAR_BRANDS,
  DOOR_OPTIONS,
  DRIVE_OPTIONS,
  ENGINE_TYPE_OPTIONS,
  STEERING_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@/lib/carOptions";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url, uploadImage } from "@/lib/images/upload";

type FormState = Omit<CarListing, "id" | "shopId" | "createdAt" | "status" | "title">;

/**
 * Mixed field renderer driven by a small spec — dropdown options when
 * the key has them, free-text input otherwise. Keeps the JSX flat and
 * makes adding / reordering fields a one-line change.
 */
type FieldSpec = {
  key: keyof FormState;
  label: string;
  placeholder: string;
  options?: readonly string[];
};

const SPEC_FIELDS: FieldSpec[] = [
  { key: "yearManufactured", label: "Үйлдвэрлэсэн он", placeholder: "2015" },
  { key: "engineCapacity",   label: "Мотор багтаамж",  placeholder: "1.5 л" },
  { key: "transmission",     label: "Хурдны хайрцаг",  placeholder: "Сонгоно уу", options: TRANSMISSION_OPTIONS },
  { key: "steering",         label: "Хүрд",             placeholder: "Сонгоно уу", options: STEERING_OPTIONS },
  { key: "bodyType",         label: "Төрөл",            placeholder: "Сонгоно уу", options: BODY_TYPE_OPTIONS },
  { key: "engineType",       label: "Хөдөлгүүр",        placeholder: "Сонгоно уу", options: ENGINE_TYPE_OPTIONS },
  { key: "drive",            label: "Хөтлөгч",          placeholder: "Сонгоно уу", options: DRIVE_OPTIONS },
  { key: "exteriorColor",    label: "Өнгө",             placeholder: "Цагаан" },
  { key: "interiorColor",    label: "Дотор өнгө",       placeholder: "Хар" },
  { key: "mileage",          label: "Явсан",            placeholder: "120,000 км" },
  { key: "doors",            label: "Хаалга",           placeholder: "Сонгоно уу", options: DOOR_OPTIONS },
];

export default function CarAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [listings, setListings] = useState<CarListing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyCarListing);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/car");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "car") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      setListings(await loadCarListings(shop.id));
      if (active) setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ ...emptyCarListing, images: [] });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(l: CarListing) {
    setForm({
      brand: l.brand ?? "",
      model: l.model ?? "",
      price: l.price ?? "",
      description: l.description ?? "",
      location: l.location ?? "",
      engineCapacity: l.engineCapacity ?? "",
      transmission: l.transmission ?? "",
      steering: l.steering ?? "",
      bodyType: l.bodyType ?? "",
      exteriorColor: l.exteriorColor ?? "",
      yearManufactured: l.yearManufactured ?? "",
      engineType: l.engineType ?? "",
      interiorColor: l.interiorColor ?? "",
      drive: l.drive ?? "",
      mileage: l.mileage ?? "",
      doors: l.doors ?? "",
      images: [...l.images],
    });
    setEditingId(l.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (fileList.length === 0) return;
    setUploadingImage(true);
    try {
      const newKeys: string[] = [];
      for (const file of fileList) {
        if (file.size > 8 * 1024 * 1024) {
          alert(`${file.name}: 8MB-аас бага байх ёстой.`);
          continue;
        }
        const uploaded = await uploadImage(file, "car");
        if (uploaded) newKeys.push(uploaded.key);
      }
      if (newKeys.length > 0) {
        setForm((f) => ({ ...f, images: [...f.images, ...newKeys] }));
      }
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!shopId || busy) return;
    if (!form.brand?.trim() || !form.model?.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createCarListing(shopId, form);
        if (created) {
          setListings((prev) => [created, ...prev]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await updateCarListing(shopId, editingId, form);
        if (updated) {
          setListings((prev) => prev.map((l) => (l.id === editingId ? updated : l)));
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
    if (!confirm("Энэ зарыг устгах уу?")) return;
    const ok = await deleteCarListing(shopId, id);
    if (ok) setListings((prev) => prev.filter((l) => l.id !== id));
  }

  async function toggleSold(l: CarListing) {
    if (!shopId) return;
    const updated = await updateCarListing(shopId, l.id, {
      status: l.status === "sold" ? "available" : "sold",
    });
    if (updated) setListings((prev) => prev.map((x) => (x.id === l.id ? updated : x)));
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const showForm = isAdding || editingId !== null;
  const canSubmit = !!form.brand?.trim() && !!form.model?.trim() && !busy;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Машины зар удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ зар нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ машин" : "Машин засах"}
            </h2>

            {/* Photos */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Зургууд <span className="font-medium text-gray-400">(олон сонгож болно)</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((key, idx) => (
                  <div key={key + idx} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r2Url(key)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="Хасах"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-medium">
                    {uploadingImage ? "Ачаалж..." : "Нэмэх"}
                  </span>
                </button>
              </div>
            </div>

            {/* Brand + Model — replaces the old free-text title.
                Brand is a dropdown of common makes; model stays free
                text since the long-tail of model names is unwieldy
                to maintain in a list. */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Брэнд <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.brand ?? ""}
                    onChange={(e) => setField("brand", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="">— Сонгоно уу —</option>
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Загвар <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Corolla Fielder"
                    value={form.model ?? ""}
                    onChange={(e) => setField("model", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Live preview of the composed display title so the owner
                  can see exactly what the customer-facing card will say. */}
              {(form.brand || form.model) && (
                <p className="text-[11px] text-gray-500">
                  Харагдах нэр:{" "}
                  <span className="font-bold text-gray-900">
                    {`${form.brand ?? ""} ${form.model ?? ""}`.trim()}
                  </span>
                </p>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Үнэ</label>
                <input
                  type="text"
                  placeholder="18 сая ₮  эсвэл  ₩18,000,000"
                  value={form.price ?? ""}
                  onChange={(e) => setField("price", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Байршил</label>
                <input
                  type="text"
                  placeholder="Улаанбаатар — Чингэлтэй"
                  value={form.location ?? ""}
                  onChange={(e) => setField("location", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              {/* Spec table — mix of dropdowns and text inputs based
                  on whether the field has a canonical option list. */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 mb-2">Үзүүлэлт</p>
                <div className="grid grid-cols-2 gap-2">
                  {SPEC_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block">{f.label}</label>
                      {f.options ? (
                        <select
                          value={(form[f.key] as string) ?? ""}
                          onChange={(e) => setField(f.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] bg-white"
                        >
                          <option value="">{f.placeholder}</option>
                          {f.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={f.placeholder}
                          value={(form[f.key] as string) ?? ""}
                          onChange={(e) => setField(f.key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[13px]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Тайлбар</label>
                <textarea
                  rows={3}
                  placeholder="Машины онцлог, нэмэлт мэдээлэл..."
                  value={form.description ?? ""}
                  onChange={(e) => setField("description", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={!canSubmit}
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
        {listings.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Зар хоосон байна</p>
        )}
        {listings.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl p-3 mb-3 shadow-sm flex gap-3 items-center">
            <div className="w-20 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
              {l.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r2Url(l.images[0])} alt="" className="w-full h-full object-cover" />
              ) : (
                <CarFront className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-gray-900 truncate">{l.title}</p>
              {l.price && <p className="text-[13px] font-bold text-primary mt-0.5">{l.price}</p>}
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => toggleSold(l)}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    l.status === "sold"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {l.status === "sold" ? "Зарагдсан" : "Зарагдаж буй"}
                </button>
                {l.images.length > 1 && (
                  <span className="text-[10px] text-gray-400">📷 {l.images.length}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => startEdit(l)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => remove(l.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
