'use client';

import { ChevronDown, ChevronUp, ImageIcon, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  BANNER_GRADIENTS,
  Banner,
  BannerGradient,
  loadBanners,
  newBannerId,
  saveBanners,
} from "@/lib/bannerStore";

const empty: Omit<Banner, "id"> = {
  badge: "",
  title: "",
  desc: "",
  gradient: "blue",
};

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Banner, "id">>(empty);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setBanners(loadBanners());
  }, []);

  function persist(next: Banner[]) {
    setBanners(next);
    saveBanners(next);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm(empty);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(b: Banner) {
    const { id, ...rest } = b;
    void id;
    setForm(rest);
    setEditingId(b.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  function submit() {
    if (!form.title.trim() || !form.badge.trim()) return;
    if (isAdding) {
      persist([...banners, { id: newBannerId(), ...form }]);
      setIsAdding(false);
    } else if (editingId) {
      persist(banners.map((b) => (b.id === editingId ? { id: b.id, ...form } : b)));
      setEditingId(null);
    }
  }

  function remove(id: string) {
    if (!confirm("Энэ баннерыг устгах уу?")) return;
    persist(banners.filter((b) => b.id !== id));
  }

  function move(id: string, direction: -1 | 1) {
    const idx = banners.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const next = [...banners];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    persist(next);
  }

  const showForm = isAdding || editingId !== null;

  return (
    <>
      {savedFlash && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-[12px] font-bold text-green-700">
          ✓ Хадгалагдлаа
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Эдгээр баннер нь нүүр хуудасны дээд хэсэгт гүйх формоор харагдана. Дарааллыг сум дээр дарж өөрчилнө.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm mb-4"
          >
            <Plus className="w-5 h-5" /> Шинэ баннер нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ баннер" : "Баннер засах"}
            </h2>

            {/* Live preview */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-500 mb-1.5">Урьдчилан харах</p>
              <div className={`relative h-32 bg-gradient-to-r ${BANNER_GRADIENTS[form.gradient].from} ${BANNER_GRADIENTS[form.gradient].to} rounded-2xl overflow-hidden shadow-md`}>
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
                </div>
                <div className="relative h-full flex flex-col justify-center p-5 text-white text-left">
                  <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-md w-max mb-2">
                    {form.badge || "Бэйдж"}
                  </span>
                  <h2 className="text-base font-bold leading-tight mb-1">
                    {form.title || "Гарчиг"}
                  </h2>
                  <p className="text-white/80 text-[11px]">{form.desc || "Тайлбар"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Бэйдж</label>
                <input
                  type="text"
                  placeholder="20% Хямдрал"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Гарчиг</label>
                <input
                  type="text"
                  placeholder="Улаанбаатар руу ачаа тээвэр"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Тайлбар</label>
                <input
                  type="text"
                  placeholder="Баталгаат карго үйлчилгээ"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Өнгө</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(BANNER_GRADIENTS) as BannerGradient[]).map((g) => {
                    const palette = BANNER_GRADIENTS[g];
                    const active = form.gradient === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm({ ...form, gradient: g })}
                        className={`h-12 rounded-lg bg-gradient-to-r ${palette.from} ${palette.to} text-white text-[11px] font-bold ${active ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                      >
                        {palette.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={!form.title.trim() || !form.badge.trim()}
                  className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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

        {banners.length === 0 ? (
          <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">Баннер байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((b, i) => {
              const grad = BANNER_GRADIENTS[b.gradient];
              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className={`h-24 bg-gradient-to-r ${grad.from} ${grad.to} relative`}>
                    <div className="absolute inset-0 p-4 flex flex-col justify-center text-white">
                      <span className="inline-block px-2 py-0.5 bg-white/20 text-[10px] font-bold rounded-md w-max mb-1">
                        {b.badge}
                      </span>
                      <p className="text-sm font-bold leading-tight">{b.title}</p>
                      <p className="text-[11px] text-white/80">{b.desc}</p>
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => move(b.id, -1)}
                        disabled={i === 0}
                        className="w-7 h-5 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
                        aria-label="Дээш"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => move(b.id, 1)}
                        disabled={i === banners.length - 1}
                        className="w-7 h-5 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
                        aria-label="Доош"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 mr-auto">#{i + 1}</span>
                    <button
                      onClick={() => startEdit(b)}
                      className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Засах
                    </button>
                    <button
                      onClick={() => remove(b.id)}
                      className="bg-red-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
