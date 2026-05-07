'use client';

import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Doctor,
  HOSPITAL_DEPARTMENTS,
  loadDoctors,
  saveDoctors,
  newDoctorId,
} from "@/lib/hospitalStore";

const emptyForm: Omit<Doctor, "id"> = {
  name: "",
  department: HOSPITAL_DEPARTMENTS[0],
  specialty: "",
  bio: "",
};

export default function HospitalAdminPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Doctor, "id">>(emptyForm);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDoctors(loadDoctors());
  }, []);

  function persist(next: Doctor[]) {
    setDoctors(next);
    saveDoctors(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm(emptyForm);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(doc: Doctor) {
    const { id, ...rest } = doc;
    void id;
    setForm(rest);
    setEditingId(doc.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  function submit() {
    if (!form.name.trim() || !form.department.trim()) return;
    if (isAdding) {
      persist([...doctors, { id: newDoctorId(), ...form }]);
      setIsAdding(false);
    } else if (editingId) {
      persist(doctors.map((d) => (d.id === editingId ? { id: d.id, ...form } : d)));
      setEditingId(null);
    }
  }

  function remove(id: string) {
    if (!confirm("Энэ эмчийг устгах уу?")) return;
    persist(doctors.filter((d) => d.id !== id));
  }

  const showForm = isAdding || editingId !== null;

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
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд нэмсэн эмч нар нь сүүлд хэрэглэгчийн талд{" "}
            <Link href="/category/hospital/1" className="text-blue-600 underline">
              /category/hospital/1
            </Link>{" "}
            хуудсан дээр харагдана.
          </p>
        </div>

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
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ эмч" : "Эмч засах"}
            </h2>
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
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                >
                  {HOSPITAL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Мэргэжил <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <input
                  type="text"
                  placeholder="Зүрх судас"
                  value={form.specialty}
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
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={!form.name.trim() || !form.department.trim()}
                  className="flex-1 bg-purple-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
        {doctors.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Эмч хоосон байна</p>
        )}
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
                <Stethoscope className="w-5 h-5" />
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
