"use client";

import {
  Search,
  Edit2,
  Megaphone,
  Plus,
  Save,
  Trash2,
  Check,
} from "lucide-react";
import { parseTimestamp } from "@/lib/datetime";
import { EmptyState, ErrorNotice, Modal, PageHeading } from "@/components/admin/AdminUI";
import { useBusiness } from "@/components/biz/BizContext";
import { adminFetch } from "@/lib/admin/types";
import { useEffect, useState } from "react";
import { Shop, ShopNotice } from "@/lib/shopStore";

const empty = { title: "", content: "" };

function fmtDate(iso: string): string {
  const d = parseTimestamp(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ShopNoticesPage() {
  const { shop: ownedShop, request: customRequest } = useBusiness();
  const request = customRequest ?? adminFetch;
  const [shop, setShop] = useState<Shop | null>(ownedShop);
  const [authChecked, setAuthChecked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [savedFlash, setSavedFlash] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function refreshNotices(shopId: string) {
    const data = await request<{ notices: ShopNotice[] }>(
      `/api/shops/${encodeURIComponent(shopId)}/notices`,
    );
    setShop((previous) =>
      previous ? { ...previous, notices: data.notices } : previous,
    );
  }
  useEffect(() => {
    let active = true;
    request<{ notices: ShopNotice[] }>(
      `/api/shops/${encodeURIComponent(ownedShop.id)}/notices`,
    )
      .then((data) => {
        if (active) setShop({ ...ownedShop, notices: data.notices });
      })
      .catch(() => {
        if (active) setError("Бизнесийн мэдээг ачаалж чадсангүй.");
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, [request, ownedShop]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setError("");
    setForm(empty);
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(n: ShopNotice) {
    setError("");
    setForm({ title: n.title, content: n.content });
    setEditingId(n.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function submit() {
    if (!shop || busy) return;
    if (!form.title.trim() || !form.content.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        await request(`/api/shops/${encodeURIComponent(shop.id)}/notices`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
          }),
        });
      } else if (editingId) {
        await request(
          `/api/shops/${encodeURIComponent(shop.id)}/notices/${encodeURIComponent(editingId)}`,
          {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.title.trim(),
              content: form.content.trim(),
            }),
          },
        );
      } else {
        return;
      }
      await refreshNotices(shop.id);
      setIsAdding(false);
      setEditingId(null);
      flash();
    } catch {
      setError("Бизнесийн мэдээг хадгалж чадсангүй.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!shop) return;
    if (!confirm("Энэ мэдээг устгах уу?")) return;
    try {
      await request(`/api/shops/${encodeURIComponent(shop.id)}/notices/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refreshNotices(shop.id);
      flash();
    } catch {
      setError("Мэдээг устгаж чадсангүй. Дахин оролдоно уу.");
    }
  }
  const notices = (shop?.notices ?? []).filter((notice) => `${notice.title} ${notice.content}`.toLowerCase().includes(search.toLowerCase()));
  const showForm = isAdding || editingId !== null;
  return (
    <>
      <PageHeading title={"Бизнесийн мэдээ"} description={"Шинэ цэс, урамшууллынхаа мэдээг харилцагчдадаа хүргээрэй."}>
        {savedFlash && <span className="mp-save-message" role="status"><Check size={14} /> Хадгаллаа</span>}
        <button className="mp-btn mp-btn-primary" onClick={startAdd}><Plus size={16} /> Мэдээ бичих</button>
      </PageHeading>
      {error && <ErrorNotice message={error} />}
      <div className="mp-catalog-help"><Megaphone size={16} /><span>Бизнесийнхээ шинэ мэдээг хуваалцаарай. Нийтэлсэн мэдээ таны бизнесийн дэлгэрэнгүй хуудсанд харагдана.</span></div>
      <section className="mp-panel" aria-busy={!authChecked}>
        <div className="mp-catalog-bar">
          <span>Нийт мэдээ <b>{shop?.notices?.length ?? 0}</b></span>
          <label className="mp-catalog-search"><Search size={15} /><input aria-label={"Мэдээ хайх"} placeholder={"Гарчиг, агуулгаар хайх"} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        {!authChecked ? <div className="mp-skeleton" /> : notices.length === 0 ? <EmptyState title={search ? "Хайлтад тохирох мэдээ алга" : "Анхны мэдээгээ нийтлээрэй"} description={search ? "Өөр түлхүүр үг оруулна уу." : "Шинэ цэс, урамшуулал, ажиллах цагийнхаа талаар мэдээлээрэй."} /> : notices.map((notice) => (
          <article className="mp-catalog-row" key={notice.id}>
            <div className="mp-catalog-symbol"><Megaphone size={22} strokeWidth={1.5} /></div>
            <div className="mp-catalog-copy"><time className="mp-catalog-date">{fmtDate(notice.createdAt)}</time><h3>{notice.title}</h3><p className="line-clamp-2">{notice.content}</p></div>
            <div className="mp-catalog-actions"><button className="mp-btn mp-btn-small" aria-label={`${notice.title} Засах`} onClick={() => startEdit(notice)}><Edit2 size={12} /> Засах</button><button className="mp-icon-button" aria-label={`${notice.title} Устгах`} onClick={() => remove(notice.id)}><Trash2 size={15} /></button></div>
          </article>
        ))}
      </section>
      {showForm && <Modal title={isAdding ? "Шинэ мэдээ бичих" : "Мэдээ засах"} onClose={() => { if (!busy) cancel(); }}>
        {error && <ErrorNotice message={error} />}
        <p className="mp-form-help">Харилцагчдадаа хүргэх бизнесийн мэдээгээ бичнэ үү.</p>
        <form className="mp-catalog-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <label>Гарчиг <small>Заавал</small><input required maxLength={200} placeholder={"Мэдээний гарчгийг оруулна уу"} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Агуулга <small>Заавал</small><textarea required rows={7} maxLength={10000} placeholder={"Шинэ цэс, урамшуулал, ажиллах цагийн талаарх дэлгэрэнгүйг бичнэ үү"} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
          <div className="mp-catalog-form-actions"><button type="button" className="mp-btn" onClick={cancel} disabled={busy}>Цуцлах</button><button className="mp-btn mp-btn-primary" disabled={busy || !form.title.trim() || !form.content.trim()}><Save size={14} />{busy ? "Хадгалж байна…" : "Мэдээ хадгалах"}</button></div>
        </form>
      </Modal>}
    </>
  );
}
