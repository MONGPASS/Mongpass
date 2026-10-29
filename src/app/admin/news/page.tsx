"use client";

import { ErrorNotice, PageHeading } from "@/components/admin/AdminUI";
import { adminFetch } from "@/lib/admin/types";

import { Camera, Edit2, Newspaper, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  NewsArticle,
  NewsArticleInput,
  createNewsArticle,
  deleteNewsArticle,
  updateNewsArticle,
} from "@/lib/newsStore";
import { NEWS_CATEGORIES, newsCategoryBadge } from "@/lib/newsCategories";
import { r2Url, uploadImage } from "@/lib/images/upload";

type FormState = NewsArticleInput;

const emptyForm: FormState = {
  title: "",
  content: "",
  coverR2Key: undefined,
  category: undefined,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminFetch<{ articles: NewsArticle[] }>(
        "/api/news?status=all",
      );
      setArticles(data.articles);
    } catch {
      setError("소식을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function flash() {
    setSavedFlash(true);
    window.dispatchEvent(new Event("admin-data-changed"));
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
      category: a.category,
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
      alert("이미지는 8MB 이하로 등록해 주세요.");
      return;
    }
    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(file, "news");
      if (!uploaded) {
        alert("이미지를 업로드하지 못했습니다.");
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
    setError("");
    setSavedFlash(false);
    try {
      const payload: NewsArticleInput = {
        ...form,
        tags: tagsFromText(),
        coverR2Key: form.coverR2Key ?? null,
        category: form.category ?? null,
      };
      if (isAdding) {
        const created = await createNewsArticle(payload);
        if (created) {
          setArticles((prev) => [created, ...prev]);
          setIsAdding(false);
          flash();
        } else
          setError(
            "소식을 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.",
          );
      } else if (editingId) {
        const updated = await updateNewsArticle(editingId, payload);
        if (updated) {
          setArticles((prev) =>
            prev.map((a) => (a.id === editingId ? updated : a)),
          );
          setEditingId(null);
          flash();
        } else setError("소식을 수정하지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("저장하지 못했습니다. 연결 상태를 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 소식을 영구 삭제할까요?")) return;
    setBusy(true);
    setError("");
    try {
      const ok = await deleteNewsArticle(id);
      if (!ok) throw new Error();
      setArticles((prev) => prev.filter((a) => a.id !== id));
      window.dispatchEvent(new Event("admin-data-changed"));
    } catch {
      setError("소식을 삭제하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const showForm = isAdding || editingId !== null;

  // Filter the saved list by selected category. "" = all.
  const [listFilter, setListFilter] = useState<string>("");
  const filteredArticles = useMemo(() => {
    if (!listFilter) return articles;
    return articles.filter((a) => a.category === listFilter);
  }, [articles, listFilter]);

  return (
    <div className="mp-editor">
      <PageHeading
        title="소식·공지"
        description="이웃에게 필요한 생활 정보와 새로운 소식을 전해 주세요."
      />
      {error && <ErrorNotice message={error} />}
      <fieldset
        disabled={busy || loading || uploadingImage}
        style={{ minWidth: 0 }}
      >
        {savedFlash && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-[12px] font-bold text-green-700 mb-4 rounded-md">
            ✓ 저장했습니다
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
                <Plus className="w-5 h-5" /> 새 소식 작성하기
              </button>
            )}

            {showForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="font-bold mb-3 text-sm">
                  {isAdding ? "새 소식" : "소식 수정"}
                </h2>

                {/* Cover image */}
                <div className="mb-3">
                  <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                    대표 이미지{" "}
                    <span className="font-medium text-gray-400">(선택)</span>
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
                        onClick={() =>
                          setForm({ ...form, coverR2Key: undefined })
                        }
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
                        {uploadingImage ? "업로드 중…" : "대표 이미지 선택"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="이웃에게 전할 소식의 제목을 입력해 주세요"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      카테고리
                    </label>
                    <select
                      value={form.category ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value || undefined,
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="">카테고리 선택</option>
                      {NEWS_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      태그{" "}
                      <span className="font-medium text-gray-400">
                        (쉼표로 구분 · 선택)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="이벤트, 추천"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={10}
                      placeholder="소식 내용을 입력해 주세요. 서비스 이용자를 위한 몽골어 콘텐츠를 권장합니다."
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      게시 상태
                    </label>
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
                          {s === "published" ? "게시됨" : "임시 저장"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={submit}
                      disabled={
                        busy || !form.title.trim() || !form.content.trim()
                      }
                      className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {busy ? "..." : "저장하기"}
                    </button>
                    <button
                      onClick={cancel}
                      className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> 취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Saved articles list */}
          <div className="space-y-3 mt-4 lg:mt-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                등록된 소식 ({filteredArticles.length}/{articles.length})
              </p>
              {/* Category filter chips so admin can scope the list when
                the article count grows. */}
              <div className="flex gap-1.5 overflow-x-auto hide-scroll">
                <button
                  onClick={() => setListFilter("")}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border ${
                    listFilter === ""
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  전체
                </button>
                {NEWS_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setListFilter(c)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                      listFilter === c
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-white border-gray-200 text-gray-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Newspaper className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">등록된 소식이 없어요</p>
              </div>
            ) : (
              filteredArticles.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-3"
                >
                  <div className="w-24 aspect-[4/3] bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
                    {a.coverR2Key ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r2Url(a.coverR2Key)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Newspaper className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-2.5 pr-3">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          a.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {a.status === "published" ? "게시됨" : "임시 저장"}
                      </span>
                      {a.category && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${newsCategoryBadge(a.category)}`}
                        >
                          {a.category}
                        </span>
                      )}
                      {a.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-gray-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <p className="font-bold text-[13px] text-gray-900 line-clamp-2">
                      {a.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      ♥ {a.likeCount}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 py-2 pr-2">
                    <button
                      onClick={() => startEdit(a)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
