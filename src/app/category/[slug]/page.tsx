'use client';

export const runtime = "edge";

import Link from "next/link";
import { ArrowLeft, ArrowDownUp, Check, MapPin, Search, SlidersHorizontal, Star, Store, X } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useEffect, useMemo, useState } from "react";
import { Shop, isShopOpen, loadApprovedShops } from "@/lib/shopStore";
import { r2Url } from "@/lib/images/upload";
import { ShopCategory } from "@/components/shop/types";
import { CATEGORY_REGISTRY } from "@/lib/categories";
import { getCurrentUser } from "@/lib/userStore";
import { HOSPITAL_SPECIALTIES } from "@/lib/hospitalSpecialties";

type SortKey = "newest" | "rating" | "reviews";

const SORT_LABEL: Record<SortKey, string> = {
  newest: "Шинээр",
  rating: "Үнэлгээгээр",
  reviews: "Сэтгэгдлээр",
};

/**
 * The slug from the URL doesn't always map 1:1 to a `ShopCategory`:
 *  - "restaurant" and "food" are both valid restaurant categories
 *  - "phone" exists on the home grid but isn't yet a shop category
 * This helper returns every category a shop could live under for the slug.
 */
function shopMatchesSlug(shop: Shop, slug: string): boolean {
  if (shop.category === slug) return true;
  if ((slug === "restaurant" || slug === "food") &&
      (shop.category === "restaurant" || shop.category === "food")) {
    return true;
  }
  return false;
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = params.slug as ShopCategory;
  const title = CATEGORY_REGISTRY[slug]?.label ?? "Үйлчилгээ";

  const [shops, setShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");
  const [hasUser, setHasUser] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Hospital sub-category filter — only used when slug === "hospital".
  // "" = "Бүгд" (show all). When set, the visible list is restricted
  // to shops whose `specialty` matches.
  const [specialty, setSpecialty] = useState<string>("");
  // Filter sheet state — currently just "show only open shops". The
  // sheet is structured to grow as more filters land (price range,
  // rating threshold, etc.) without rebuilding the modal.
  const [showFilters, setShowFilters] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  // Sort sheet state — three options today; default is newest first
  // because customers expect to see what's new on top of a list.
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  useEffect(() => {
    let active = true;
    (async () => {
      const [all, u] = await Promise.all([loadApprovedShops(), getCurrentUser()]);
      if (!active) return;
      setShops(all.filter((s) => shopMatchesSlug(s, params.slug)));
      setHasUser(u !== null);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [params.slug]);

  const visible = useMemo(() => {
    let list = shops;
    // Hospital specialty filter — applied first because it cuts the
    // candidate pool faster than text search.
    if (slug === "hospital" && specialty) {
      list = list.filter((s) => s.specialty === specialty);
    }
    if (openOnly) {
      list = list.filter((s) => isShopOpen(s));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q),
      );
    }
    // Sort last so filters narrow the pool before we order it. Make
    // a copy first — Array#sort mutates, and `shops` is React state.
    const sorted = [...list];
    if (sortBy === "rating") {
      sorted.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    } else if (sortBy === "reviews") {
      sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else {
      // newest — string ISO comparison works because of fixed width
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [shops, query, slug, specialty, openOnly, sortBy]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      {/* Header.
          Map icon removed — used to be a non-functional <button>. The
          search input below covers the discovery use case; revisit when
          the maps integration lands. */}
      <header className="sticky top-0 z-50 bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-[18px] font-bold text-gray-900">{title}</h1>
        <Link href="/search" className="p-1 hover:text-primary transition" aria-label="Хайх">
          <Search size={22} className="text-gray-700" />
        </Link>
      </header>

      {/* Search & Filters */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бизнесийн нэрээр хайх..."
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 mb-1">
          {/* Filter button — opens a small bottom sheet. Active state
              (filter currently applied) gets a primary-tinted border so
              the customer can see at a glance the list is narrowed. */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-xl text-[14px] font-semibold transition ${
              openOnly
                ? "bg-primary/10 border-primary text-primary"
                : "border-gray-200 text-gray-800 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={16} /> Шүүх{openOnly ? " · 1" : ""}
          </button>
          {/* Sort button — label includes the current sort key so the
              customer doesn't have to open it just to check what's
              applied. */}
          <button
            onClick={() => setShowSort(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition"
          >
            <ArrowDownUp size={16} /> {SORT_LABEL[sortBy]}
          </button>
        </div>
      </div>

      {/* Filter sheet — bottom-anchored on mobile, centered on tablet+. */}
      {showFilters && (
        <FilterSheet
          openOnly={openOnly}
          onChangeOpenOnly={setOpenOnly}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Sort sheet — picking an option auto-applies + closes. */}
      {showSort && (
        <SortSheet
          value={sortBy}
          onChange={(next) => {
            setSortBy(next);
            setShowSort(false);
          }}
          onClose={() => setShowSort(false)}
        />
      )}

      {/* Hospital specialty filter — horizontal scroll of all 19
          specialty types plus "Бүгд". Renders only on the hospital
          listing; other categories would just clutter their list. */}
      {slug === "hospital" && (
        <div className="bg-white border-b border-gray-100 px-5 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scroll">
            <button
              onClick={() => setSpecialty("")}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                specialty === ""
                  ? "bg-primary border-primary text-white"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              Бүгд
            </button>
            {HOSPITAL_SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border whitespace-nowrap transition-colors ${
                  specialty === s
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {loaded && visible.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 text-gray-400">
            <Store size={22} />
          </div>
          {shops.length === 0 ? (
            <>
              <p className="text-[14px] font-bold text-gray-700 mb-1">
                {title} ангилалд дэлгүүр бүртгэгдээгүй байна
              </p>
              <p className="text-[12px] text-gray-500 mb-5 leading-relaxed max-w-[280px]">
                Та эхний дэлгүүр болж бүртгүүлэх боломжтой. Бүртгэх нь үнэгүй.
              </p>
              <Link
                href={hasUser ? "/biz/register" : "/login?redirect=/biz/register"}
                className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-[13px]"
              >
                Дэлгүүр бүртгэх
              </Link>
            </>
          ) : (
            <p className="text-[13px] text-gray-500">
              &ldquo;{query}&rdquo; гэсэн нэртэй дэлгүүр олдсонгүй
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-4">
          {visible.map((shop) => (
            <Link
              href={`/category/${params.slug}/${shop.id}`}
              key={shop.id}
              className="bg-white p-3.5 rounded-2xl flex gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform"
            >
              <div className="relative w-[90px] h-[90px] rounded-xl shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden shadow-sm flex items-center justify-center">
                {shop.images && shop.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r2Url(shop.images[0])} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold opacity-50 text-2xl drop-shadow-md">
                    {shop.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div
                  className={`absolute top-1 left-1 px-1.5 py-[2px] rounded uppercase font-bold text-[9px] text-white shadow-sm ${
                    isShopOpen(shop) ? "bg-emerald-500" : "bg-red-500"
                  }`}
                >
                  {isShopOpen(shop) ? "Нээлттэй" : "Хаалттай"}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-[15px] text-gray-900 truncate">{shop.name}</h3>
                </div>
                {/* Hospital specialty badge — only when set, only for
                    hospital category. Helps the customer scan a long
                    list at a glance. */}
                {slug === "hospital" && shop.specialty && (
                  <span className="inline-block bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5">
                    {shop.specialty}
                  </span>
                )}
                {(() => {
                  // Counts arrive on the Shop record itself via a SQL
                  // aggregate in hydrateShops — no per-row fetch.
                  const count = shop.reviewCount ?? 0;
                  const avg = shop.avgRating ?? 0;
                  return (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[12px] font-bold text-gray-900">
                        {count > 0 ? avg.toFixed(1) : "—"}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium">
                        {count > 0 ? `(${count} сэтгэгдэл)` : "(сэтгэгдэл алга)"}
                      </span>
                    </div>
                  );
                })()}
                {shop.description ? (
                  <p className="text-[12px] leading-snug text-gray-600 line-clamp-2 mb-2">
                    {shop.description}
                  </p>
                ) : (
                  <p className="text-[12px] leading-snug text-gray-400 italic line-clamp-2 mb-2">
                    Танилцуулга оруулаагүй байна
                  </p>
                )}
                {shop.address && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <BottomNav />
    </main>
  );
}

/**
 * Filter sheet — bottom-anchored modal. Today the only filter is
 * "open only", but the layout (toggle row + Reset / Apply footer) is
 * the standard for any future toggle so adding more is a one-liner.
 */
function FilterSheet({
  openOnly,
  onChangeOpenOnly,
  onClose,
}: {
  openOnly: boolean;
  onChangeOpenOnly: (v: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base text-gray-900">Шүүх</h2>
          <button onClick={onClose} className="p-1 -mr-1 hover:bg-gray-100 rounded-full" aria-label="Хаах">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Toggle row — clicks anywhere on the row flip it. */}
        <button
          onClick={() => onChangeOpenOnly(!openOnly)}
          className="w-full flex items-center justify-between py-3 border-b border-gray-100"
        >
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">Зөвхөн нээлттэй газар</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Одоо ажиллаж буй гэжүүгийг харуулна</p>
          </div>
          <span
            className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
              openOnly ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                openOnly ? "translate-x-4" : ""
              }`}
            />
          </span>
        </button>

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => onChangeOpenOnly(false)}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg text-sm"
          >
            Дахин тохируулах
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg text-sm"
          >
            Үзэх
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sort sheet — radio-style list. Clicking an option auto-applies and
 * dismisses the sheet (faster than asking for an extra "Apply" tap).
 */
function SortSheet({
  value,
  onChange,
  onClose,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  onClose: () => void;
}) {
  const options: Array<{ key: SortKey; label: string; sub: string }> = [
    { key: "newest", label: "Шинээр", sub: "Шинэ бүртгэгдсэн дэлгүүр эхэндээ" },
    { key: "rating", label: "Үнэлгээгээр", sub: "Өндөр оноотой дэлгүүр эхэндээ" },
    { key: "reviews", label: "Сэтгэгдлээр", sub: "Олон сэтгэгдэлтэй дэлгүүр эхэндээ" },
  ];
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base text-gray-900">Эрэмбэлэх</h2>
          <button onClick={onClose} className="p-1 -mr-1 hover:bg-gray-100 rounded-full" aria-label="Хаах">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {options.map((opt) => {
            const active = value === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onChange(opt.key)}
                className="w-full flex items-center justify-between py-3 text-left"
              >
                <div>
                  <p className={`text-sm ${active ? "font-bold text-primary" : "font-semibold text-gray-900"}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{opt.sub}</p>
                </div>
                {active && <Check className="w-5 h-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
