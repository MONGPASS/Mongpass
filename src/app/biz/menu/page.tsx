"use client";
import { Plus, Edit2, Trash2, Save, Search, Utensils, Info, Check } from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type MenuItem, groupItems } from "@/lib/menuStore";
import { useBusiness } from "@/components/biz/BizContext";
import { adminFetch } from "@/lib/admin/types";
import { EmptyState, ErrorNotice, Modal, PageHeading } from "@/components/admin/AdminUI";

export default function RestaurantMenuAdminPage() {
  const { shop, request: customRequest, preview } = useBusiness();
  const request = customRequest ?? adminFetch;
  const shopId = shop.id;
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>({
    category: "Гол хоол",
    name: "",
    desc: "",
    price: "",
  });
  useEffect(() => {
    if (!["restaurant", "food"].includes(shop.category)) {
      router.replace(preview ? "/preview/biz" : "/biz");
      return;
    }
    let active = true;
    request<{ items: MenuItem[] }>(
      "/api/shops/" + encodeURIComponent(shopId) + "/menu",
    )
      .then((data) => {
        if (active) setItems(data.items);
      })
      .catch(() => {
        if (active) setError("Цэсийг ачаалж чадсангүй.");
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, [request, shopId, shop.category, router, preview]);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setError("");
    setForm({ category: "Гол хоол", name: "", desc: "", price: "" });
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(item: MenuItem) {
    setError("");
    setForm({
      category: item.category,
      name: item.name,
      desc: item.desc,
      price: item.price,
    });
    setEditingId(item.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
  }

  async function submit() {
    if (!shopId || busy) return;
    if (!form.category.trim() || !form.name.trim() || !form.price.trim()) return;
    setBusy(true);
    try {
      if (isAdding) {
        const created = await request<{ item: MenuItem }>(
          `/api/shops/${encodeURIComponent(shopId)}/menu`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        ).then((data) => data.item);
        if (created) {
          setItems((prev) => [...prev, created]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await request<{ item: MenuItem }>(
          `/api/shops/${encodeURIComponent(shopId)}/menu/${encodeURIComponent(editingId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        ).then((data) => data.item);
        if (updated) {
          setItems((prev) =>
            prev.map((i) => (i.id === editingId ? updated : i)),
          );
          setEditingId(null);
          flash();
        }
      }
    } catch {
      setError("Цэсийг хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!shopId) return;
    if (!confirm("Энэ цэсийг устгах уу?")) return;
    try {
      await request(
        `/api/shops/${encodeURIComponent(shopId)}/menu/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Цэсийг устгаж чадсангүй. Дахин оролдоно уу.");
    }
  }

  const categories = Array.from(new Set(items.map((item) => item.category)));
  const visible = items.filter((item) =>
    (!category || item.category === category) &&
    `${item.name} ${item.desc}`.toLowerCase().includes(search.toLowerCase()),
  );
  const grouped = groupItems(visible);
  const showForm = isAdding || editingId !== null;

  return (
    <>
      <PageHeading title={"Бараа, цэсийн удирдлага"} description={"Бизнесийнхээ цэсийг бүртгэж, харилцагчдадаа танилцуулаарай."}>
        {savedFlash && <span className="mp-save-message" role="status"><Check size={14} /> Хадгаллаа</span>}
        <button className="mp-btn mp-btn-primary" onClick={startAdd}><Plus size={16} /> Цэс нэмэх</button>
      </PageHeading>
      {error && <ErrorNotice message={error} />}
      <div className="mp-catalog-help"><Info size={15} /><span>Бүртгэсэн хоол харилцагчид харагдах цэсийн хэсэгт орно. Нэр, үнийг зөв оруулна уу.</span></div>
      <section className="mp-panel" aria-busy={!authChecked}>
        <div className="mp-catalog-bar">
          <span>Нийт цэс <b>{items.length}</b></span>
          <select aria-label={"Цэсийн ангилал"} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Бүх ангилал</option>
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="mp-catalog-search"><Search size={15} /><input aria-label={"Цэс хайх"} placeholder={"Цэсийн нэрээр хайх"} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        </div>
        {!authChecked ? <div className="mp-skeleton" /> : grouped.length === 0 ? <EmptyState title={items.length ? "Хайлтад тохирох цэс алга" : "Анхны цэсээ нэмээрэй"} description={items.length ? "Өөр үг эсвэл ангилал сонгоно уу." : "Өөрийн онцлог хоолоо харилцагчдадаа танилцуулаарай."} /> : grouped.map((group) => (
          <div key={group.category}>
            <h2 className="mp-catalog-category">{group.category}<span>{group.items.length} ш</span></h2>
            {group.items.map((item) => (
              <article className="mp-catalog-row" key={item.id}>
                <div className="mp-catalog-symbol"><Utensils size={22} strokeWidth={1.5} /></div>
                <div className="mp-catalog-copy"><h3>{item.name}</h3><p>{item.desc}</p><strong>{item.price}</strong></div>
                <div className="mp-catalog-actions">
                  <button className="mp-btn mp-btn-small" aria-label={`${item.name} Засах`} onClick={() => startEdit(item)}><Edit2 size={12} /> Засах</button>
                  <button className="mp-icon-button" aria-label={`${item.name} Устгах`} onClick={() => remove(item.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>
      {showForm && <Modal title={isAdding ? "Шинэ цэс нэмэх" : "Цэс засах"} onClose={() => { if (!busy) cancel(); }}>
        {error && <ErrorNotice message={error} />}
        <p className="mp-form-help">Харилцагчид ойлгомжтой байхаар цэсээ танилцуулна уу.</p>
        <form className="mp-catalog-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <label>Ангилал <small>Заавал</small><input required maxLength={100} placeholder={"Жишээ: Гол хоол"} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <label>Цэсийн нэр <small>Заавал</small><input required maxLength={200} placeholder={"Цэсийн нэрийг оруулна уу"} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Цэсийн тайлбар<textarea rows={3} maxLength={2000} placeholder={"Орц, порц зэрэг хоолны онцлогийг тайлбарлана уу"} value={form.desc} onChange={(event) => setForm({ ...form, desc: event.target.value })} /></label>
          <label>Үнэ <small>Заавал</small><input required maxLength={50} placeholder={"Жишээ: 12,000₩"} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <div className="mp-catalog-form-actions"><button type="button" className="mp-btn" onClick={cancel} disabled={busy}>Цуцлах</button><button className="mp-btn mp-btn-primary" disabled={busy || !form.category.trim() || !form.name.trim() || !form.price.trim()}><Save size={14} />{busy ? "Хадгалж байна…" : "Хадгалах"}</button></div>
        </form>
      </Modal>}
    </>
  );
}
