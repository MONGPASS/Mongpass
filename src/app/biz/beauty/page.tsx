'use client';

import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Scissors, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BeautyService,
  Stylist,
  BEAUTY_SERVICE_CATEGORIES,
  loadServices,
  loadStylists,
  createService,
  updateService,
  deleteService,
  createStylist,
  updateStylist,
  deleteStylist,
} from "@/lib/beautyStore";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";

type Tab = "services" | "stylists";

const emptyService: Omit<BeautyService, "id"> = {
  name: "",
  category: BEAUTY_SERVICE_CATEGORIES[0],
  durationMin: "",
  price: "",
};

const emptyStylist: Omit<Stylist, "id"> = {
  name: "",
  specialty: "",
};

export default function BeautyAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<BeautyService[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  // Service form state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState<Omit<BeautyService, "id">>(emptyService);

  // Stylist form state
  const [editingStylistId, setEditingStylistId] = useState<string | null>(null);
  const [isAddingStylist, setIsAddingStylist] = useState(false);
  const [stylistForm, setStylistForm] = useState<Omit<Stylist, "id">>(emptyStylist);

  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/beauty");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "beauty") {
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      const [svc, sty] = await Promise.all([loadServices(shop.id), loadStylists(shop.id)]);
      if (!active) return;
      setServices(svc);
      setStylists(sty);
      setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  // Services CRUD
  function startAddService() {
    setServiceForm(emptyService);
    setIsAddingService(true);
    setEditingServiceId(null);
  }
  function startEditService(s: BeautyService) {
    setServiceForm({ name: s.name, category: s.category, durationMin: s.durationMin, price: s.price });
    setEditingServiceId(s.id);
    setIsAddingService(false);
  }
  async function submitService() {
    if (!shopId || busy) return;
    if (!serviceForm.name.trim() || !serviceForm.price.trim()) return;
    setBusy(true);
    try {
      if (isAddingService) {
        const created = await createService(shopId, serviceForm);
        if (created) {
          setServices((prev) => [...prev, created]);
          setIsAddingService(false);
          flash();
        }
      } else if (editingServiceId) {
        const updated = await updateService(shopId, editingServiceId, serviceForm);
        if (updated) {
          setServices((prev) => prev.map((s) => (s.id === editingServiceId ? updated : s)));
          setEditingServiceId(null);
          flash();
        }
      }
    } finally {
      setBusy(false);
    }
  }
  async function removeService(id: string) {
    if (!shopId) return;
    if (!confirm("Энэ үйлчилгээг устгах уу?")) return;
    const ok = await deleteService(shopId, id);
    if (ok) setServices((prev) => prev.filter((s) => s.id !== id));
  }
  const showServiceForm = isAddingService || editingServiceId !== null;

  // Stylists CRUD
  function startAddStylist() {
    setStylistForm(emptyStylist);
    setIsAddingStylist(true);
    setEditingStylistId(null);
  }
  function startEditStylist(s: Stylist) {
    setStylistForm({ name: s.name, specialty: s.specialty ?? "" });
    setEditingStylistId(s.id);
    setIsAddingStylist(false);
  }
  async function submitStylist() {
    if (!shopId || busy) return;
    if (!stylistForm.name.trim()) return;
    setBusy(true);
    try {
      if (isAddingStylist) {
        const created = await createStylist(shopId, stylistForm);
        if (created) {
          setStylists((prev) => [...prev, created]);
          setIsAddingStylist(false);
          flash();
        }
      } else if (editingStylistId) {
        const updated = await updateStylist(shopId, editingStylistId, stylistForm);
        if (updated) {
          setStylists((prev) => prev.map((s) => (s.id === editingStylistId ? updated : s)));
          setEditingStylistId(null);
          flash();
        }
      }
    } finally {
      setBusy(false);
    }
  }
  async function removeStylist(id: string) {
    if (!shopId) return;
    if (!confirm("Энэ стилистийг устгах уу?")) return;
    const ok = await deleteStylist(shopId, id);
    if (ok) setStylists((prev) => prev.filter((s) => s.id !== id));
  }
  const showStylistForm = isAddingStylist || editingStylistId !== null;

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Гоо сайхан удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab("services")}
            className={`flex-1 py-3 text-sm font-bold ${tab === "services" ? "text-pink-500 border-b-2 border-pink-500" : "text-gray-400"}`}
          >
            Үйлчилгээ
          </button>
          <button
            onClick={() => setTab("stylists")}
            className={`flex-1 py-3 text-sm font-bold ${tab === "stylists" ? "text-pink-500 border-b-2 border-pink-500" : "text-gray-400"}`}
          >
            Стилист
          </button>
        </div>
      </header>

      {tab === "services" && (
        <div className="px-4 pt-4">
          {!showServiceForm && (
            <button
              onClick={startAddService}
              className="w-full bg-pink-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Plus className="w-5 h-5" /> Шинэ үйлчилгээ нэмэх
            </button>
          )}

          {showServiceForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold mb-3 text-sm">
                {isAddingService ? "Шинэ үйлчилгээ" : "Үйлчилгээ засах"}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
                  <input
                    type="text"
                    placeholder="Эмэгтэй үс засах"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Ангилал</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                  >
                    {BEAUTY_SERVICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хугацаа (мин)</label>
                    <input
                      type="text"
                      placeholder="45"
                      value={serviceForm.durationMin}
                      onChange={(e) => setServiceForm({ ...serviceForm, durationMin: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Үнэ</label>
                    <input
                      type="text"
                      placeholder="20,000₩"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={submitService}
                    disabled={busy || !serviceForm.name.trim() || !serviceForm.price.trim()}
                    className="flex-1 bg-pink-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {busy ? "..." : "Хадгалах"}
                  </button>
                  <button
                    onClick={() => { setIsAddingService(false); setEditingServiceId(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Болих
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            {services.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-12">Үйлчилгээ хоосон байна</p>
            )}
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                      {s.category}
                    </p>
                    <p className="font-bold text-sm text-gray-900">{s.name}</p>
                    <p className="text-[12px] text-gray-600 mt-0.5">
                      {s.durationMin} мин · <b className="text-gray-900">{s.price}</b>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => startEditService(s)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeService(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "stylists" && (
        <div className="px-4 pt-4">
          {!showStylistForm && (
            <button
              onClick={startAddStylist}
              className="w-full bg-pink-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Plus className="w-5 h-5" /> Шинэ стилист нэмэх
            </button>
          )}

          {showStylistForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold mb-3 text-sm">
                {isAddingStylist ? "Шинэ стилист" : "Стилист засах"}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
                  <input
                    type="text"
                    placeholder="Амараа"
                    value={stylistForm.name}
                    onChange={(e) => setStylistForm({ ...stylistForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Мэргэжил <span className="font-medium text-gray-400">(заавал биш)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Үс засалт, будах"
                    value={stylistForm.specialty ?? ""}
                    onChange={(e) => setStylistForm({ ...stylistForm, specialty: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={submitStylist}
                    disabled={busy || !stylistForm.name.trim()}
                    className="flex-1 bg-pink-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {busy ? "..." : "Хадгалах"}
                  </button>
                  <button
                    onClick={() => { setIsAddingStylist(false); setEditingStylistId(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Болих
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            {stylists.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-12">Стилист хоосон байна</p>
            )}
            {stylists.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{s.name}</p>
                    {s.specialty && (
                      <p className="text-[12px] text-gray-600 mt-0.5">{s.specialty}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => startEditStylist(s)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeStylist(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
