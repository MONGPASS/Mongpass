'use client';

import {
  ArrowLeft, Camera, Edit2, Map, Plus, Save, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  TravelPackage,
  TravelPackageInput,
  createTravelPackage,
  deleteTravelPackage,
  emptyTravelPackage,
  loadTravelPackages,
  updateTravelPackage,
} from "@/lib/travelPackageStore";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url, uploadImage } from "@/lib/images/upload";

const TOUR_TYPE_OPTIONS = ["Хөтөлбөртэй аялал", "Чөлөөт аялал", "Хагас хөтөлбөртэй"];

/**
 * Travel package owner form — gallery, quick facts, two checklists,
 * day-by-day itinerary. Big component but a single concern, so kept
 * in one file with internal helpers for the repeat patterns.
 */
export default function TravelAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<TravelPackageInput>(emptyTravelPackage);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/travel");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "travel") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      setPackages(await loadTravelPackages(shop.id));
      if (active) setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ ...emptyTravelPackage, included: [], excluded: [], images: [], days: [] });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(p: TravelPackage) {
    setForm({
      title: p.title,
      price: p.price ?? "",
      description: p.description ?? "",
      duration: p.duration ?? "",
      groupSize: p.groupSize ?? "",
      transport: p.transport ?? "",
      accommodation: p.accommodation ?? "",
      guide: p.guide ?? "",
      tourType: p.tourType ?? "",
      included: [...p.included],
      excluded: [...p.excluded],
      images: [...p.images],
      days: p.days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description ?? "",
      })),
    });
    setEditingId(p.id);
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
        const uploaded = await uploadImage(file, "travel");
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

  // Checklist helpers — same shape for both "included" and "excluded".
  function addChecklistItem(key: "included" | "excluded") {
    setForm((f) => ({ ...f, [key]: [...f[key], ""] }));
  }
  function setChecklistItem(key: "included" | "excluded", idx: number, val: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((s, i) => (i === idx ? val : s)),
    }));
  }
  function removeChecklistItem(key: "included" | "excluded", idx: number) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  }

  // Itinerary day helpers.
  function addDay() {
    setForm((f) => ({
      ...f,
      days: [
        ...f.days,
        { dayNumber: f.days.length + 1, title: "", description: "" },
      ],
    }));
  }
  function setDayField(idx: number, field: "title" | "description", val: string) {
    setForm((f) => ({
      ...f,
      days: f.days.map((d, i) => (i === idx ? { ...d, [field]: val } : d)),
    }));
  }
  function removeDay(idx: number) {
    setForm((f) => ({
      ...f,
      // Renumber so dayNumber stays sequential after a delete.
      days: f.days
        .filter((_, i) => i !== idx)
        .map((d, i) => ({ ...d, dayNumber: i + 1 })),
    }));
  }

  async function submit() {
    if (!shopId || busy || !form.title.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createTravelPackage(shopId, form);
        if (created) {
          setPackages((prev) => [created, ...prev]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await updateTravelPackage(shopId, editingId, form);
        if (updated) {
          setPackages((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
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
    if (!confirm("Энэ багцыг устгах уу?")) return;
    const ok = await deleteTravelPackage(shopId, id);
    if (ok) setPackages((prev) => prev.filter((p) => p.id !== id));
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const showForm = isAdding || editingId !== null;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Аяллын багц удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ багц нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">{isAdding ? "Шинэ багц" : "Багц засах"}</h2>

            {/* Gallery */}
            <Field label="Зургууд" hint="(олон сонгож болно)">
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
            </Field>

            <div className="space-y-3">
              <Field label="Гарчиг" required>
                <input
                  type="text"
                  placeholder="БАЛИ АРАЛ — Хөтөлбөртэй аялал"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label="Үнэ">
                <input
                  type="text"
                  placeholder="₩1,500,000  эсвэл  1500 USD"
                  value={form.price ?? ""}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </Field>

              {/* Quick facts grid */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 mb-2">Богино мэдээлэл</p>
                <div className="grid grid-cols-2 gap-2">
                  <SmallField label="Хугацаа" placeholder="6 өдөр, 5 шөнө" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
                  <SmallField label="Бүлгийн хүн" placeholder="10 хүн" value={form.groupSize} onChange={(v) => setForm({ ...form, groupSize: v })} />
                  <SmallField label="Тээвэр" placeholder="Нисэх онгоц, автобус" value={form.transport} onChange={(v) => setForm({ ...form, transport: v })} />
                  <SmallField label="Байр" placeholder="4 одтой ресорт" value={form.accommodation} onChange={(v) => setForm({ ...form, accommodation: v })} />
                  <SmallField label="Хөтөч" placeholder="Монгол хэлтэй хөтөч" value={form.guide} onChange={(v) => setForm({ ...form, guide: v })} />
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 mb-1 block">Төрөл</label>
                    <select
                      value={form.tourType ?? ""}
                      onChange={(e) => setForm({ ...form, tourType: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[13px] bg-white"
                    >
                      <option value="">— Сонгоно уу —</option>
                      {TOUR_TYPE_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Included checklist */}
              <ChecklistEditor
                label="Багтсан зүйлс"
                hint="Үнэд багтсан зүйлсийг нэг тус нь оруулна уу."
                tone="green"
                items={form.included}
                onAdd={() => addChecklistItem("included")}
                onChange={(i, v) => setChecklistItem("included", i, v)}
                onRemove={(i) => removeChecklistItem("included", i)}
              />

              {/* Excluded checklist */}
              <ChecklistEditor
                label="Багтаагүй зүйлс"
                hint="Тус тусд төлбөртэй зүйлсийг бичнэ үү."
                tone="red"
                items={form.excluded}
                onAdd={() => addChecklistItem("excluded")}
                onChange={(i, v) => setChecklistItem("excluded", i, v)}
                onRemove={(i) => removeChecklistItem("excluded", i)}
              />

              {/* Itinerary days */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-gray-500">Маршрут</p>
                  <button
                    type="button"
                    onClick={addDay}
                    className="text-[11px] font-semibold text-primary flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Өдөр нэмэх
                  </button>
                </div>
                {form.days.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">
                    Жнь: &ldquo;Өдөр 1: Улаанбаатар-Бали&rdquo;, &ldquo;Өдөр 2: Убуд тосгоны аялал&rdquo;...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.days.map((d, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            ӨДӨР-{d.dayNumber}
                          </span>
                          <input
                            type="text"
                            placeholder="Өдөр 1: Улаанбаатар-Бали"
                            value={d.title}
                            onChange={(e) => setDayField(idx, "title", e.target.value)}
                            className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-[13px] font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeDay(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Тухайн өдрийн хөтөлбөрийг бичнэ үү."
                          value={d.description ?? ""}
                          onChange={(e) => setDayField(idx, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-[12px] resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Field label="Дэлгэрэнгүй тайлбар" hint="(заавал биш)">
                <textarea
                  rows={3}
                  placeholder="Багцын онцлог, нэмэлт мэдээлэл..."
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </Field>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={busy || !form.title.trim()}
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
        {packages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Багц хоосон байна</p>
        )}
        {packages.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-3 mb-3 shadow-sm flex gap-3 items-center">
            <div className="w-20 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r2Url(p.images[0])} alt="" className="w-full h-full object-cover" />
              ) : (
                <Map className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-gray-900 truncate">{p.title}</p>
              {p.price && <p className="text-[13px] font-bold text-primary mt-0.5">{p.price}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">
                {p.days.length} өдөр · 📷 {p.images.length}
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
        ))}
      </div>
    </main>
  );
}

// --- Small reusable inputs to keep the JSX above flat ---

function Field({
  label, hint, required, children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {hint && <span className="font-medium text-gray-400"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SmallField({
  label, placeholder, value, onChange,
}: {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-500 mb-1 block">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[13px]"
      />
    </div>
  );
}

/**
 * Variable-length list editor — used for the "Багтсан зүйлс" and
 * "Багтаагүй зүйлс" sections. Tone tints the index pill so the
 * checklist's intent reads at a glance.
 */
function ChecklistEditor({
  label, hint, tone, items, onAdd, onChange, onRemove,
}: {
  label: string;
  hint: string;
  tone: "green" | "red";
  items: string[];
  onAdd: () => void;
  onChange: (idx: number, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const pill = tone === "green" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  return (
    <div className="pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold text-gray-500">{label}</p>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] font-semibold text-primary flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Нэмэх
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mb-2">{hint}</p>
      {items.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">Жагсаалт хоосон.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center ${pill}`}>
                {idx + 1}
              </span>
              <input
                type="text"
                value={s}
                onChange={(e) => onChange(idx, e.target.value)}
                placeholder={tone === "green" ? "Жнь: Хөтөч үйлчилгээ" : "Жнь: Нислэгийн тийз"}
                className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-[13px]"
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
