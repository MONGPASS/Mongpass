'use client';

import { Camera, Edit2, Newspaper, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  NewsArticle,
  NewsArticleInput,
  createNewsArticle,
  deleteNewsArticle,
  loadNews,
  updateNewsArticle,
} from "@/lib/newsStore";
import { r2Url, uploadImage } from "@/lib/images/upload";

type FormState = NewsArticleInput;

const emptyForm: FormState = {
  title: "",
  content: "",
  coverR2Key: undefined,
  tags: [],
  status: "published",
};

/**
 * Admin CRUD for editorial news articles. List on the right side
 * (desktop) / below the form (mobile); form pops above with a hero
 * image picker, title, free-form tags input, body textarea, and a
 * draft/published toggle.
 */
export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  // Tags as a comma-separated string in the input; we split on the
  // way in and join on the way out so the array stays canonical
  // in storage but the UX stays single-input.
  const [tagsText, setTagsText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setArticles(await loadNews({ status: "all" }));
  }

  useEffect(() => {
    refresh();
  }, []);

  function flash() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function startAdd() {
    setForm({ ...emptyForm });
    setTagsText("");
    setIsAdding(true);
    setEditingId(null);
  }

  function startEdit(a: NewsArticle) {
    setForm({
      title: a.title,
      content: a.content,
      coverR2Key: a.coverR2Key,
      tags: a.tags,
      status: a.status,
    });
    setTagsText(a.tags.join(", "));
    setEditingId(a.id);
    setIsAdding(false);
  }

  function cancel() {
    setEditingId(null);
    setIsAdding(false);
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
      const uploaded = await uploadImage(file, "news");
      if (!uploaded) {
        alert("Зураг ачаалж чадсангүй.");
        return;
      }
      setForm((f) => ({ ...f, coverR2Key: uploaded.key }));
    } finally {
      setUploadingImage(false);
    }
  }

  function tagsFromText(): string[] {
    return tagsText
      .split(/[,，]/)
      .map((s) => s.trim().replace(/^#/, ""))
      .filter((s) => s.length > 0);
  }

  async function submit() {
    if (busy) return;
    if (!form.title.trim() || !form.content.trim()) return;
    setBusy(true);
    try {
      const payload: NewsArticleInput = {
        ...form,
        tags: tagsFromText(),
        coverR2Key: form.coverR2Key ?? null,
      };
      if (isAdding) {
        const created = await createNewsArticle(payload);
        if (created) {
          setArticles((prev) => [created, ...prev]);
          setIsAdding(false);
          flash();
        }
      } else if (editingId) {
        const updated = await updateNewsArticle(editingId, payload);
        if (updated) {
          setArticles((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
          setEditingId(null);
          flash();
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Энэ мэдээг устгах уу?")) return;
    const ok = await deleteNewsArticle(id);
    if (ok) setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  const showForm = isAdding || editingId !== null;

  return (
    <>
      {savedFlash && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-[12px] font-bold text-green-700 mb-4 rounded-md">
          ✓ Хадгалагдлаа
        </div>
      )}

      {/* Two-pane layout on lg+: form left, saved list right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-4">
          {!showForm && (
            <button
              onClick={startAdd}
              className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
            >
              <Plus className="w-5 h-5" /> Шинэ мэдээ нэмэх
            </button>
          )}

          {showForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-bold mb-3 text-sm">
                {isAdding ? "Шинэ мэдээ" : "Мэдээ засах"}
              </h2>

              {/* Cover image */}
              <div className="mb-3">
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Нүүр зураг <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {form.coverR2Key ? (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r2Url(form.coverR2Key)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, coverR2Key: undefined })}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50 disabled:opacity-50"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">
                      {uploadingImage ? "Ачаалж байна..." : "Нүүр зураг сонгох"}
                    </span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Гарчиг <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Жнь: Korean Air компани 5 одтой агаарын тээврийн компаниар шалгарлаа"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Тэг <span className="font-medium text-gray-400">(таслалаар тусгаарла)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Онцгой, Санал болгох"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    Агуулга <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={10}
                    placeholder="Мэдээний бүрэн агуулга..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Төлөв</label>
                  <div className="flex gap-2">
                    {(["published", "draft"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-bold border ${
                          form.status === s
                            ? "bg-gray-900 border-gray-900 text-white"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        {s === "published" ? "Нийтэлсэн" : "Ноорог"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={submit}
                    disabled={busy || !form.title.trim() || !form.content.trim()}
                    className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* Saved articles list */}
        <div className="space-y-3 mt-4 lg:mt-0">
          <div className="hidden lg:block bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Хадгалагдсан мэдээ ({articles.length})
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-500">Мэдээ алга байна</p>
            </div>
          ) : (
            articles.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3">
                <div className="w-24 aspect-[4/3] bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
                  {a.coverR2Key ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r2Url(a.coverR2Key)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Newspaper className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-2.5 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        a.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {a.status === "published" ? "Нийтэлсэн" : "Ноорог"}
                    </span>
                    {a.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-gray-500">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <p className="font-bold text-[13px] text-gray-900 line-clamp-2">{a.title}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    ♥ {a.likeCount}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0 py-2 pr-2">
                  <button onClick={() => startEdit(a)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
