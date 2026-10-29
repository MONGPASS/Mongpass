"use client";

import { ErrorNotice, PageHeading } from "@/components/admin/AdminUI";
import { adminFetch } from "@/lib/admin/types";

import {
  Camera,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { r2Url, uploadImage } from "@/lib/images/upload";
import { useEffect, useState } from "react";
import {
  BANNER_GRADIENTS,
  Banner,
  BannerGradient,
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
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminFetch<{ banners: Banner[] }>("/api/banners")
      .then(({ banners: list }) => {
        if (active) setBanners(list);
      })
      .catch(() => {
        if (active)
          setError("배너를 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function persist(next: Banner[]) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setSavedFlash(false);
    const saved = await saveBanners(next);
    setBusy(false);
    if (!saved) {
      setError("저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.");
      return false;
    }
    setBanners(saved);
    setSavedFlash(true);
    window.dispatchEvent(new Event("admin-data-changed"));
    return true;
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

  async function submit() {
    // A banner is valid as long as it has *something* to show — either
    // an image or text. This lets admins post designed banners with
    // the copy already baked into the artwork.
    const hasText =
      form.title.trim().length > 0 || form.badge.trim().length > 0;
    if (!form.imageR2Key && !hasText) return;
    if (isAdding) {
      if (await persist([...banners, { id: newBannerId(), ...form }]))
        setIsAdding(false);
    } else if (editingId) {
      if (
        await persist(
          banners.map((b) => (b.id === editingId ? { id: b.id, ...form } : b)),
        )
      )
        setEditingId(null);
    }
  }

  function remove(id: string) {
    if (!confirm("이 배너를 영구 삭제할까요?")) return;
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
    <div className="mp-editor">
      <PageHeading
        title="배너 관리"
        description="Mongpass의 첫인상을 만들어요. 홈 배너와 노출 순서를 관리해 주세요."
      />
      {error && <ErrorNotice message={error} />}
      <fieldset disabled={busy || loading || uploading} style={{ minWidth: 0 }}>
        {savedFlash && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-[12px] font-bold text-green-700">
            ✓ 저장했습니다
          </div>
        )}

        {/* Layout: stacked on phone (existing UX), two-pane on lg+ where
          the editor sits on the left and the list of saved banners on
          the right — admin can edit one banner without losing visual
          context of the others. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                홈 화면 상단에 표시되는 배너입니다. 화살표로 노출 순서를 변경할
                수 있어요.
              </p>
            </div>

            {!showForm && (
              <button
                onClick={startAdd}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
              >
                <Plus className="w-5 h-5" /> 새 배너 만들기
              </button>
            )}

            {showForm && (
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <h2 className="font-bold mb-3 text-sm">
                  {isAdding ? "새 배너" : "배너 수정"}
                </h2>

                {/* Live preview — image takes precedence over gradient */}
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-gray-500 mb-1.5">
                    미리보기
                  </p>
                  <div
                    className={`relative h-32 bg-gradient-to-r ${BANNER_GRADIENTS[form.gradient].from} ${BANNER_GRADIENTS[form.gradient].to} rounded-2xl overflow-hidden shadow-md`}
                  >
                    {form.imageR2Key ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r2Url(form.imageR2Key)}
                          alt="banner"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Dark overlay so the white text stays legible on bright photos */}
                        <div className="absolute inset-0 bg-black/35" />
                      </>
                    ) : (
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
                      </div>
                    )}
                    <div className="relative h-full flex flex-col justify-center p-5 text-white text-left">
                      <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-md w-max mb-2 backdrop-blur-sm">
                        {form.badge || "배지"}
                      </span>
                      <h2 className="text-base font-bold leading-tight mb-1 drop-shadow-sm">
                        {form.title || "제목"}
                      </h2>
                      <p className="text-white/90 text-[11px] drop-shadow-sm">
                        {form.desc || "설명"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Hint that clarifies the new image-only flow without
                  cluttering every label. */}
                  <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 leading-relaxed">
                    이미지를 등록하면 배지와 제목을 생략할 수 있어요. 이미지가
                    없다면 배지 또는 제목을 입력해 주세요.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      배지{" "}
                      <span className="font-medium text-gray-400">(선택)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="20% 할인"
                      value={form.badge}
                      onChange={(e) =>
                        setForm({ ...form, badge: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      제목{" "}
                      <span className="font-medium text-gray-400">(선택)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="배너 제목을 입력해 주세요"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      설명
                    </label>
                    <input
                      type="text"
                      placeholder="배너 설명을 입력해 주세요"
                      value={form.desc}
                      onChange={(e) =>
                        setForm({ ...form, desc: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                      maxLength={80}
                    />
                  </div>
                  {/* Click target — internal app routes start with /, external
                  with http(s)://. Empty value = non-clickable banner.
                  The server rejects anything else (javascript:, data:, …). */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      연결 링크{" "}
                      <span className="font-medium text-gray-400">(선택)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="/category/cargo  또는  https://example.com"
                      value={form.linkUrl ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          linkUrl: e.target.value || undefined,
                        })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      서비스 내 페이지: <code>/category/cargo</code> / 외부
                      페이지: <code>https://...</code>
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      이미지{" "}
                      <span className="font-medium text-gray-400">(선택)</span>
                    </label>
                    {form.imageR2Key ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r2Url(form.imageR2Key)}
                          alt="upload preview"
                          className="w-full max-h-40 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, imageR2Key: undefined })
                          }
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center"
                          aria-label="이미지 제거"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          id="bannerImageUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            // R2-backed upload: client converts to WebP +
                            // resizes to ≤1600px, server stores in R2 and
                            // returns a key we embed via /api/r2/<key>.
                            setUploading(true);
                            const uploaded = await uploadImage(
                              file,
                              "banner",
                            ).catch(() => null);
                            setUploading(false);
                            if (uploaded) {
                              // Persist the raw R2 key (not the proxy URL) so
                              // PUT /api/banners stores it canonically. r2Url()
                              // converts it for <img> rendering everywhere.
                              setForm((prev) => ({
                                ...prev,
                                imageR2Key: uploaded.key,
                              }));
                            } else {
                              alert(
                                "이미지를 업로드하지 못했습니다. 다시 시도해 주세요.",
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor="bannerImageUpload"
                          className="flex flex-col items-center justify-center gap-1.5 w-full py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 cursor-pointer hover:bg-gray-50"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-xs font-medium">
                            이미지 선택
                          </span>
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1">
                          선택한 이미지는 배너 배경에 표시됩니다. 가로형
                          이미지를 권장해요.
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                      배경 색상{" "}
                      <span className="font-medium text-gray-400">
                        (이미지가 없을 때 표시)
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(BANNER_GRADIENTS) as BannerGradient[]).map(
                        (g) => {
                          const palette = BANNER_GRADIENTS[g];
                          const active = form.gradient === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setForm({ ...form, gradient: g })}
                              className={`h-12 rounded-lg bg-gradient-to-r ${palette.from} ${palette.to} text-white text-[11px] font-bold ${active ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                            >
                              {
                                {
                                  blue: "블루",
                                  purple: "퍼플",
                                  orange: "오렌지",
                                  emerald: "그린",
                                  pink: "핑크",
                                  slate: "다크",
                                }[g]
                              }
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={submit}
                      disabled={
                        !form.imageR2Key &&
                        !form.title.trim() &&
                        !form.badge.trim()
                      }
                      className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> 저장하기
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
          {/* Right pane on lg+: the saved banner list. On phone this just
            stacks below the form, matching the original behaviour. */}
          <div className="space-y-4 mt-4 lg:mt-0">
            <div className="hidden lg:block bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                등록된 배너 ({banners.length})
              </p>
            </div>

            {banners.length === 0 ? (
              <div className="bg-white rounded-2xl py-12 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">등록된 배너가 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((b, i) => {
                  const grad = BANNER_GRADIENTS[b.gradient];
                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden"
                    >
                      <div
                        className={`h-24 bg-gradient-to-r ${grad.from} ${grad.to} relative`}
                      >
                        {b.imageR2Key && (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r2Url(b.imageR2Key)}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/35" />
                          </>
                        )}
                        {(b.badge || b.title || b.desc) && (
                          <div className="absolute inset-0 p-4 flex flex-col justify-center text-white">
                            {b.badge && (
                              <span className="inline-block px-2 py-0.5 bg-white/20 text-[10px] font-bold rounded-md w-max mb-1 backdrop-blur-sm">
                                {b.badge}
                              </span>
                            )}
                            {b.title && (
                              <p className="text-sm font-bold leading-tight drop-shadow-sm">
                                {b.title}
                              </p>
                            )}
                            {b.desc && (
                              <p className="text-[11px] text-white/90 drop-shadow-sm">
                                {b.desc}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex items-center gap-2">
                        <div className="flex flex-col">
                          <button
                            onClick={() => move(b.id, -1)}
                            disabled={i === 0}
                            className="w-7 h-5 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
                            aria-label="위로 이동"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => move(b.id, 1)}
                            disabled={i === banners.length - 1}
                            className="w-7 h-5 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 rounded"
                            aria-label="아래로 이동"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 mr-auto">
                          #{i + 1}
                        </span>
                        <button
                          onClick={() => startEdit(b)}
                          className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                        >
                          수정
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
        </div>
      </fieldset>
    </div>
  );
}
