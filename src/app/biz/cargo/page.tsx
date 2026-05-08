'use client';

import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Plane, Zap, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CargoRoute,
  CargoType,
  CARGO_TYPE_LABEL,
  createRoute,
  deleteRoute,
  loadRoutes,
  updateRoute,
} from "@/lib/cargoStore";
import { findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";

const TYPE_ICON: Record<CargoType, typeof Plane> = {
  air: Plane,
  express: Zap,
  regular: Package,
};

const emptyForm: Omit<CargoRoute, "id"> = {
  type: "air",
  fromCity: "",
  toCity: "",
  pricePerKg: "",
  transitDays: "",
  schedule: "",
};

export default function CargoAdminPage() {
  const router = useRouter();
  const [shopId, setShopId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [routes, setRoutes] = useState<CargoRoute[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<CargoRoute, "id">>(emptyForm);
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  // Resolve which shop this owner is editing.
  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz/cargo");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      if (shop.category !== "cargo") {
        // The owner has a non-cargo shop — bounce them home.
        router.replace("/biz");
        return;
      }
      setShopId(shop.id);
      const list = await loadRoutes(shop.id);
      if (!active) return;
      setRoutes(list);
      setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm(emptyForm);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(route: CargoRoute) {
    const { id, ...rest } = route;
    void id;
    setForm({
      type: rest.type,
      fromCity: rest.fromCity,
      toCity: rest.toCity,
      pricePerKg: rest.pricePerKg,
      transitDays: rest.transitDays,
      schedule: rest.schedule ?? "",
    });
    setEditingId(route.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function submit() {
    if (!shopId || busy) return;
    if (!form.fromCity.trim() || !form.toCity.trim() || !form.pricePerKg.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await createRoute(shopId, form);
        if (created) {
          setRoutes((prev) => [...prev, created]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await updateRoute(shopId, editingId, form);
        if (updated) {
          setRoutes((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
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
    if (!confirm("Энэ чиглэлийг устгах уу?")) return;
    const ok = await deleteRoute(shopId, id);
    if (ok) setRoutes((prev) => prev.filter((r) => r.id !== id));
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
          <h1 className="font-bold text-base flex-1">Чиглэл удирдах (Cargo)</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд нэмсэн чиглэл нь зөвхөн таны дэлгүүрийн хуудсан дээр харагдана.
            Үнэ, хугацаа, хуваарийг засаж болно.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ чиглэл нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ чиглэл" : "Чиглэл засах"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Карго төрөл</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CARGO_TYPE_LABEL) as CargoType[]).map((t) => {
                    const Icon = TYPE_ICON[t];
                    const active = form.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, type: t })}
                        className={`py-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 ${active ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"}`}
                      >
                        <Icon className="w-4 h-4" />
                        {CARGO_TYPE_LABEL[t].split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хаанаас</label>
                  <input
                    type="text"
                    placeholder="Сөүл"
                    value={form.fromCity}
                    onChange={(e) => setForm({ ...form, fromCity: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хаашаа</label>
                  <input
                    type="text"
                    placeholder="УБ"
                    value={form.toCity}
                    onChange={(e) => setForm({ ...form, toCity: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">1 кг үнэ</label>
                <input
                  type="text"
                  placeholder="8,500₩"
                  value={form.pricePerKg}
                  onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Тооцоолсон үнэ = жин(кг) × энэ үнэ
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Хүргэх хугацаа</label>
                <input
                  type="text"
                  placeholder="5-7 хоног"
                  value={form.transitDays}
                  onChange={(e) => setForm({ ...form, transitDays: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Хуваарь <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <input
                  type="text"
                  placeholder="Лхагва, Бямба"
                  value={form.schedule ?? ""}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={busy || !form.fromCity.trim() || !form.toCity.trim() || !form.pricePerKg.trim()}
                  className="flex-1 bg-blue-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {busy ? "Хадгалаж буй..." : "Хадгалах"}
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
        {routes.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Чиглэл хоосон байна</p>
        )}
        {routes.map((route) => {
          const Icon = TYPE_ICON[route.type];
          return (
            <div key={route.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {CARGO_TYPE_LABEL[route.type]}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-gray-900 mb-1">
                    {route.fromCity} <span className="text-gray-400">→</span> {route.toCity}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600">
                    <span><b className="text-gray-900">{route.pricePerKg}</b>/кг</span>
                    <span>{route.transitDays}</span>
                    {route.schedule && <span>· {route.schedule}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(route)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                    aria-label="Засах"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(route.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    aria-label="Устгах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
