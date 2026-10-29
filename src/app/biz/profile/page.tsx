"use client";
import { CATEGORY_MN, STATUS_MN } from "@/lib/admin/businessMessages";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, Check, Save, Store, X } from "lucide-react";
import PushOptInCard from "@/components/biz/PushOptInCard";
import { useBusiness } from "@/components/biz/BizContext";
import { ErrorNotice, PageHeading } from "@/components/admin/AdminUI";

import { adminFetch } from "@/lib/admin/types";
import { businessPreviewHref } from "@/lib/admin/previewNavigation";
import { r2Url, uploadImage } from "@/lib/images/upload";
import { HOSPITAL_SPECIALTIES } from "@/lib/hospitalSpecialties";

export default function BusinessProfilePage() {
  const {
    shop,
    refresh,
    request: customRequest,
    upload: customUpload,
    preview,
  } = useBusiness();
  const request = customRequest ?? adminFetch;
  const [form, setForm] = useState({
    name: shop.name,
    description: shop.description ?? "",
    contactPhone: shop.contactPhone ?? "",
    address: shop.address ?? "",
    openHours: shop.openHours ?? "",
    facebook: shop.facebook ?? "",
    instagram: shop.instagram ?? "",
    bankAccount: shop.bankAccount ?? "",
    deliveryFee: shop.deliveryFee === undefined ? "" : String(shop.deliveryFee),
    specialty: shop.specialty ?? "",
  });
  const [images, setImages] = useState(shop.images ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setImages(shop.images ?? []);
  }, [shop.images]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !form.name.trim()) return;
    const fee = form.deliveryFee === "" ? null : Number(form.deliveryFee);
    if (
      fee !== null &&
      (!Number.isFinite(fee) || fee < 0 || !Number.isInteger(fee))
    ) {
      setError("Хүргэлтийн төлбөрийг 0 эсвэл түүнээс их бүхэл тоогоор оруулна уу.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const next = await request("/api/shops/" + encodeURIComponent(shop.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryFee: fee,
          ...(shop.category === "hospital"
            ? { specialty: form.specialty || null }
            : { specialty: undefined }),
        }),
      });
      if (!next) throw new Error();
      await refresh();
      window.dispatchEvent(new Event("biz-data-changed"));
      setSaved(true);
    } catch {
      setError(
        "Бизнесийн мэдээллийг хадгалж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (files.length + images.length > 10) {
      setError("Хамгийн ихдээ 10 зураг оруулах боломжтой.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const file of files) {
        const result = await (customUpload ?? uploadImage)(file, "shop");
        if (!result) throw new Error();
        await request(`/api/shops/${encodeURIComponent(shop.id)}/images`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ r2Key: result.key }),
        });
        setImages((previous) => [...previous, result.key]);
      }
      await refresh();
    } catch {
      setError(
        "Зарим зургийг оруулж чадсангүй. Оруулсан зургуудаа шалгаад дахин оролдоно уу.",
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function remove(key: string) {
    if (busy || !confirm("Энэ зургийг устгах уу?")) return;
    setBusy(true);
    setError("");
    try {
      await request(
        `/api/shops/${encodeURIComponent(shop.id)}/images/${encodeURIComponent(key)}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      setImages((previous) => previous.filter((image) => image !== key));
      await refresh();
    } catch {
      setError("Зургийг устгаж чадсангүй.");
    } finally {
      setBusy(false);
    }
  }
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((previous) => ({ ...previous, [key]: event.target.value }));
      setSaved(false);
    },
  });
  return (
    <>
      <PageHeading
        title={"Мэдээлэл, тохиргоо"}
        description={"Харилцагчид харагдах бизнесийнхээ мэдээллийг бөглөөрэй."}
      >
        <Link
          href={
            preview
              ? businessPreviewHref(`/category/${shop.category}/${shop.id}`)
              : `/category/${shop.category}/${shop.id}`
          }
          target="_blank"
          className="mp-btn"
        >
          Бизнесээ харах <ArrowUpRight size={13} />
        </Link>
      </PageHeading>
      {error && <ErrorNotice message={error} />}
      {saved && (
        <div className="mp-success" role="status">
          <Check size={14} style={{ display: "inline", marginRight: 5 }} />
          Бизнесийн мэдээллийг хадгаллаа.
        </div>
      )}
      <div className="mp-biz-profile-grid">
        <form className="mp-panel mp-panel-pad" onSubmit={save}>
          <fieldset disabled={busy}>
            <h2 style={{ fontWeight: 700, marginBottom: 18 }}>Бизнесийн зураг</h2>
            <div className="mp-biz-photo-list">
              {images.map((image, index) => (
                <div key={image} className="mp-biz-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r2Url(image)} alt={`Бизнесийн зураг ${index + 1}`} />
                  <button
                    type="button"
                    aria-label={`Бизнесийн зураг ${index + 1} Устгах`}
                    onClick={() => remove(image)}
                  >
                    <X size={13} />
                  </button>
                  {index === 0 && <span>Нүүр зураг</span>}
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  className="mp-biz-photo-add"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera size={23} />
                  <span>Зураг нэмэх {images.length}/10</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={upload}
            />
            <p className="mp-form-help">
              Эхний зураг нүүр зураг болно. Хамгийн ихдээ 10 зураг оруулж болно.
            </p>
            <div className="mp-biz-form-grid">
              <label>
                Бизнесийн нэр <span>*</span>
                <input
                  aria-label={"Бизнесийн нэр"}
                  required
                  maxLength={100}
                  {...field("name")}
                />
              </label>
              <label>
                Холбоо барих утас
                <input
                  aria-label={"Холбоо барих утас"}
                  type="tel"
                  {...field("contactPhone")}
                  placeholder="010-0000-0000"
                />
              </label>
              <label className="mp-form-full">
                Бизнесийн танилцуулга
                <textarea
                  aria-label={"Бизнесийн танилцуулга"}
                  rows={4}
                  maxLength={3000}
                  {...field("description")}
                  placeholder={"Бизнесээ харилцагчдадаа танилцуулна уу."}
                />
              </label>
              <label className="mp-form-full">
                Хаяг
                <input aria-label={"Хаяг"} {...field("address")} />
              </label>
              <label className="mp-form-full">
                Ажиллах цаг
                <input
                  aria-label={"Ажиллах цаг"}
                  {...field("openHours")}
                  placeholder={"Жишээ: Даваа–Баасан 09:00–18:00"}
                />
              </label>
              <label>
                Facebook
                <input
                  aria-label="Facebook"
                  {...field("facebook")}
                  placeholder="https://facebook.com/..."
                />
              </label>
              <label>
                Instagram
                <input
                  aria-label="Instagram"
                  {...field("instagram")}
                  placeholder="https://instagram.com/..."
                />
              </label>
              {shop.category === "hospital" && (
                <label className="mp-form-full">
                  Эмнэлгийн төрөл
                  <select aria-label={"Эмнэлгийн төрөл"} {...field("specialty")}>
                    <option value="">Сонгоно уу</option>
                    {HOSPITAL_SPECIALTIES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="mp-form-full">
                Төлбөр хүлээн авах данс
                <input
                  aria-label={"Төлбөр хүлээн авах данс"}
                  {...field("bankAccount")}
                  placeholder={"Банк · Дансны дугаар · Данс эзэмшигч"}
                />
              </label>
              {["meat", "restaurant", "food"].includes(shop.category) && (
                <label>
                  Хүргэлтийн төлбөр (₩)
                  <input
                    aria-label={"Хүргэлтийн төлбөр"}
                    type="number"
                    min={0}
                    step={1}
                    {...field("deliveryFee")}
                    placeholder={"Оруулаагүй бол үндсэн утга"}
                  />
                </label>
              )}
            </div>
            <div className="mp-modal-actions mp-business-save-bar">
              <button
                className="mp-btn mp-btn-primary"
                type="submit"
                disabled={busy || !form.name.trim()}
              >
                <Save size={14} />
                {busy ? "Хадгалж байна…" : "Өөрчлөлт хадгалах"}
              </button>
            </div>
          </fieldset>
        </form>
        <aside className="mp-panel mp-panel-pad">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Store size={21} color="#ff8b3e" />
            <b>Миний бизнес профайл</b>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>{form.name}</h3>
          <p className="mp-form-help">{CATEGORY_MN[shop.category]}</p>
          <span
            className={`mp-status ${shop.status}`}
            style={{ marginTop: 15 }}
          >
            {STATUS_MN[shop.status]}
          </span>
          <p className="mp-form-help" style={{ marginTop: 20 }}>
            Энэ мэдээлэл бизнесийн тань хуудсанд харагдана. Татгалзсан хүсэлтийн мэдээллийг засвал дахин хянуулна.
          </p>
          {shop.rejectionReason && (
            <div className="mp-error" style={{ marginTop: 16 }}>
              {shop.rejectionReason}
            </div>
          )}
          <div style={{ marginTop: 20 }}>{!preview && <PushOptInCard />}</div>
        </aside>
      </div>
    </>
  );
}
