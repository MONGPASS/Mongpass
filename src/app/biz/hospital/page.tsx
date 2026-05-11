'use client';

import { ArrowLeft, Camera, Edit2, Plus, Save, Stethoscope, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Doctor,
  loadDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "@/lib/hospitalStore";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url, uploadImage } from "@/lib/images/upload";

const HOSPITAL_DEPARTMENTS = [
  "Дотор",
  "Шүд",
  "Нүд",
  "Чих хамар хоолой",
  "Хүүхэд",
  "Эмэгтэйчүүд",
  "Гэмтэл",
  "Бусад",
];

/**
 * Sentinel value for the "type my own" option in the Тасаг select.
 * Picked → the form swaps the dropdown for a free-text input.
 * Stored on the doctor row as the actual typed string, so existing
 * read code (HospitalServiceTab, booking page) doesn't have to know
 * about this distinction.
 */
const CUSTOM_DEPT = "__custom__";

const emptyForm: Omit<Doctor, "id"> = {
  name: "",
  department: HOSPITAL_DEPARTMENTS[0],
  specialty: "",
  bio: "",
  imageR2Key: undefined,
};

export default function HospitalAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Omit<Doctor, "id">>(emptyForm);
  const [savedFlash, setSavedFlash] = useState(false);
  // True when the dropdown is set to "Өөрөө бичих" — the real value
  // lives in `form.department` (free text) instead of a select option.
  const [customDept, setCustomDept] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/hospital");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "hospital") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      setDoctors(await loadDoctors(shop.id));
      if (active) setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm(emptyForm);
    setCustomDept(false);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(doc: Doctor) {
    setForm({
      name: doc.name,
      department: doc.department,
      specialty: doc.specialty ?? "",
      bio: doc.bio ?? "",
      imageR2Key: doc.imageR2Key,
    });
    // If the loaded department isn't in the canonical list, the user
    // previously typed it themselves — pre-open custom mode so the
    // text input shows up populated.
    setCustomDept(!HOSPITAL_DEPARTMENTS.includes(doc.department));
    setEditingId(doc.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
    setCustomDept(false);
  }

  function onDeptSelectChange(value: string) {
    if (value === CUSTOM_DEPT) {
      setCustomDept(true);
      // Clear the field so the text input starts empty rather than
      // carrying over whatever was last selected.
      setForm({ ...form, department: "" });
    } else {
      setCustomDept(false);
      setForm({ ...form, department: value });
    }
  }

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
      const uploaded = await uploadImage(file, "doctor");
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
    if (!form.name.trim() || !form.department.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createDoctor(shopId, form);
        if (created) {
          setDoctors((prev) => [...prev, created]);
          setIsAdding(false);
          setCustomDept(false);
          flash();
        }
      } else if (editingId) {
        // PATCH passes null (not undefined) when the user removed the
        // image so the server actively clears it.
        const updated = await updateDoctor(shopId, editingId, {
          ...form,
          imageR2Key: form.imageR2Key ?? null,
        });
        if (updated) {
          setDoctors((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
          setEditingId(null);
          setCustomDept(false);
          flash();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!shopId) return;
    if (!confirm("Энэ эмчийг устгах уу?")) return;
    const ok = await deleteDoctor(shopId, id);
    if (ok) setDoctors((prev) => prev.filter((d) => d.id !== id));
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const showForm = isAdding || editingId !== null;
  // The select shows the sentinel when in custom mode; otherwise the
  // current department value. Departments not in HOSPITAL_DEPARTMENTS
  // are surfaced as the sentinel so the dropdown stays consistent.
  const selectValue = customDept
    ? CUSTOM_DEPT
    : HOSPITAL_DEPARTMENTS.includes(form.department)
      ? form.department
      : CUSTOM_DEPT;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Эмч удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-purple-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ эмч нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">{isAdding ? "Шинэ эмч" : "Эмч засах"}</h2>

            {/* Doctor portrait — same WebP-on-upload pipeline as
                meat / banner / community. Empty slot opens the
                picker; filled slot shows preview + remove. */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Эмчийн зураг <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {form.imageR2Key ? (
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r2Url(form.imageR2Key)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageR2Key: undefined }))}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Зураг хасах"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 active:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-medium">
                    {uploadingImage ? "Ачаалж байна..." : "Зураг сонгох"}
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
                <input
                  type="text"
                  placeholder="Доктор Б. Цэцэгмаа"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Тасаг</label>
                <select
                  value={selectValue}
                  onChange={(e) => onDeptSelectChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  {HOSPITAL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value={CUSTOM_DEPT}>+ Өөрөө бичиж оруулах</option>
                </select>
                {/* Free-text Тасаг — appears when the sentinel option
                    is selected, including when editing a doctor whose
                    saved department isn't in the canonical list. */}
                {customDept && (
                  <input
                    type="text"
                    placeholder="Жнь: Зүрх судас, Мэдрэл, Сэтгэц..."
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-2"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Мэргэжил <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <input
                  type="text"
                  placeholder="Зүрх судас"
                  value={form.specialty ?? ""}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Танилцуулга <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="10 жилийн туршлагатай."
                  value={form.bio ?? ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={busy || !form.name.trim() || !form.department.trim()}
                  className="flex-1 bg-purple-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
        {doctors.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Эмч хоосон байна</p>
        )}
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex items-start gap-3">
              {/* Doctor thumbnail — falls back to the Stethoscope icon
                  tile when no portrait has been uploaded yet. */}
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 overflow-hidden">
                {doc.imageR2Key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r2Url(doc.imageR2Key)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                  {doc.department}
                </p>
                <p className="font-bold text-sm text-gray-900">{doc.name}</p>
                {doc.specialty && (
                  <p className="text-[12px] text-gray-600 mt-0.5">{doc.specialty}</p>
                )}
                {doc.bio && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{doc.bio}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => startEdit(doc)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(doc.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
