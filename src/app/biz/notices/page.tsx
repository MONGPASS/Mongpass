'use client';

import { ArrowLeft, Edit2, Megaphone, Plus, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Shop,
  ShopNotice,
  findShopByOwner,
  newNoticeId,
  updateShop,
} from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";

const empty = { title: "", content: "" };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ShopNoticesPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login?redirect=/biz/notices");
      return;
    }
    const s = findShopByOwner(user.id);
    if (!s) {
      router.replace("/biz/register");
      return;
    }
    setShop(s);
    setAuthChecked(true);
  }, [router]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function persist(notices: ShopNotice[]) {
    if (!shop) return;
    const next = updateShop(shop.id, { notices });
    if (next) {
      setShop(next);
      flash();
    }
  }

  function startAdd() {
    setForm(empty);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(n: ShopNotice) {
    setForm({ title: n.title, content: n.content });
    setEditingId(n.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  function submit() {
    if (!shop) return;
    if (!form.title.trim() || !form.content.trim()) return;
    const list = shop.notices ?? [];
    let next: ShopNotice[];
    if (isAdding) {
      next = [
        {
          id: newNoticeId(),
          title: form.title.trim(),
          content: form.content.trim(),
          createdAt: new Date().toISOString(),
        },
        ...list,
      ];
    } else if (editingId) {
      next = list.map((n) =>
        n.id === editingId
          ? { ...n, title: form.title.trim(), content: form.content.trim() }
          : n,
      );
    } else {
      return;
    }
    persist(next);
    setIsAdding(false);
    setEditingId(null);
  }

  function remove(id: string) {
    if (!shop) return;
    if (!confirm("Энэ мэдээллийг устгах уу?")) return;
    persist((shop.notices ?? []).filter((n) => n.id !== id));
  }

  if (!authChecked || !shop) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const showForm = isAdding || editingId !== null;
  const notices = shop.notices ?? [];

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/biz" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Мэдээ удирдах</h1>
          {savedFlash && <span className="text-xs text-green-600 font-semibold">Хадгалагдлаа</span>}
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-500 leading-relaxed">
            Энд бичсэн мэдээ нь сүүлд хэрэглэгчийн талд "Мэдээлэл" таб дээр
            харагдана. Жишээ нь: урамшуулал, цагийн өөрчлөлт, шинэ үйлчилгээ.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={startAdd}
            className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <Plus className="w-5 h-5" /> Шинэ мэдээ нэмэх
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3 text-sm">
              {isAdding ? "Шинэ мэдээ" : "Мэдээ засах"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Гарчиг</label>
                <input
                  type="text"
                  placeholder="ж: Шинэ жилийн урамшуулал эхэллээ!"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Агуулга</label>
                <textarea
                  rows={4}
                  placeholder="Дэлгэрэнгүй..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submit}
                  disabled={!form.title.trim() || !form.content.trim()}
                  className="flex-1 bg-blue-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">Одоогоор мэдээ оруулаагүй байна</p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {fmtDate(n.createdAt)}
                  </p>
                  <h3 className="font-bold text-sm text-gray-900 mb-1.5">{n.title}</h3>
                  <p className="text-[12px] text-gray-600 line-clamp-3 leading-relaxed">
                    {n.content}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(n)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                    aria-label="Засах"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    aria-label="Устгах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
