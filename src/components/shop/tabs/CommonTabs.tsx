'use client';

import { MapPin, Clock, Phone, Facebook, Instagram, Star, MessageSquare } from "lucide-react";
import { parseTimestamp } from "@/lib/datetime";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShopData } from "../types";
import {
  Review,
  addReview,
  loadReviewsForShop,
  summarizeReviews,
  userHasReviewed,
} from "@/lib/reviewStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url } from "@/lib/images/upload";

export function HomeTab({ shop }: { shop: ShopData }) {
  return (
    <div className="bg-white min-h-[50vh]">
      <div className="flex flex-col">
        <div className="flex items-start gap-3 py-4 px-5 border-b border-gray-100">
          <Clock size={20} className="text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="text-[15px] text-gray-900 leading-snug">{shop.openHours}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 py-4 px-5 border-b border-gray-100">
          <Phone size={20} className="text-gray-400 shrink-0" strokeWidth={1.5} />
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-gray-900 underline underline-offset-4 decoration-gray-300">{shop.phone}</span>
            <button className="flex items-center gap-1 text-[13px] text-blue-600 font-medium">
              <span className="opacity-80">⧉</span> Хуулах
            </button>
          </div>
        </div>

        {shop.facebook && (
          <div className="flex items-center gap-3 py-4 px-5 border-b border-gray-100">
            <Facebook size={20} className="text-gray-400 shrink-0" strokeWidth={1.5} />
            <a href={shop.facebook} target="_blank" rel="noreferrer" className="text-[15px] text-gray-900 underline underline-offset-4 decoration-gray-300">Facebook</a>
          </div>
        )}

        {shop.instagram && (
          <div className="flex items-center gap-3 py-4 px-5 border-b border-gray-100">
            <Instagram size={20} className="text-gray-400 shrink-0" strokeWidth={1.5} />
            <a href={shop.instagram} target="_blank" rel="noreferrer" className="text-[15px] text-gray-900 underline underline-offset-4 decoration-gray-300">Instagram</a>
          </div>
        )}

        <div className="flex items-start gap-3 py-4 px-5 border-b border-gray-100">
          <MapPin size={20} className="text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
          <span className="text-[15px] text-gray-900 leading-snug pr-4">{shop.address}</span>
        </div>

        {shop.description && (
          <div className="py-5 px-5 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
            {shop.description}
          </div>
        )}
      </div>
    </div>
  );
}

export function InfoTab({ shop }: { shop: ShopData }) {
  const pathname = usePathname();
  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">Шинэ мэдээ, урамшуулал</h3>
      
      {shop.notices && shop.notices.length > 0 ? (
        <div className="space-y-3">
          {shop.notices.map(notice => (
            <Link href={`${pathname}/notice/${notice.id}`} key={notice.id} className="block mt-3 first:mt-0">
              <div className="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded">Шинэ</span>
                  <span className="text-[11px] text-gray-400 font-medium">{notice.date}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-[14px] mb-1.5">{notice.title}</h4>
                <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">{notice.content}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <span className="text-gray-400 text-xl">📢</span>
          </div>
          <p className="text-sm text-gray-500">Одоогоор шинэ мэдээлэл байхгүй байна.</p>
        </div>
      )}
    </div>
  );
}

export function ReviewTab({ shop }: { shop: ShopData }) {
  const shopId = String(shop.id);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [list, u] = await Promise.all([
        loadReviewsForShop(shopId),
        getCurrentUser(),
      ]);
      if (!active) return;
      setReviews(list);
      setUser(u);
    })();
    return () => { active = false; };
  }, [shopId]);

  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const alreadyReviewed = userHasReviewed(reviews, user?.id ?? null);

  async function submit() {
    if (!comment.trim() || rating < 1 || rating > 5 || submitting) return;
    setSubmitting(true);
    try {
      const created = await addReview({
        shopId,
        rating,
        comment: comment.trim(),
      });
      if (!created) {
        // 401 (logged out) / 409 (already reviewed) / 404 (shop not approved)
        alert("Сэтгэгдэл нэмэхэд алдаа гарлаа. Та нэвтэрсэн эсэхээ шалгана уу.");
        return;
      }
      setReviews(await loadReviewsForShop(shopId));
      setShowForm(false);
      setComment("");
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white min-h-[40vh] border-t border-gray-100">
      {/* Summary header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-xl text-gray-900">
                {summary.count > 0 ? summary.average.toFixed(1) : "—"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{summary.count} сэтгэгдэл</p>
          </div>
        </div>
        {!showForm && !alreadyReviewed && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white text-[12px] font-semibold px-4 py-2 rounded-lg"
          >
            Сэтгэгдэл бичих
          </button>
        )}
        {!showForm && alreadyReviewed && (
          <span className="text-[11px] text-gray-400">Та аль хэдийн сэтгэгдэл бичсэн</span>
        )}
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-[12px] font-bold text-gray-700 mb-2">Үнэлгээ</p>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} од`}
                className="p-1"
              >
                <Star
                  className={`w-7 h-7 ${
                    n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Туршлагаа товчхон бичнэ үү..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setComment(""); }}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg text-sm"
            >
              Болих
            </button>
            <button
              onClick={submit}
              disabled={!comment.trim()}
              className="flex-1 bg-gray-900 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-40"
            >
              Илгээх
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="py-12 px-5 text-center text-gray-400">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm">Сэтгэгдэл хараахан байхгүй байна</p>
          <p className="text-[11px] mt-1">Эхэнд сэтгэгдэл бичсэн хүн та байх уу?</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reviews.map((r) => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[11px] font-bold">
                    {r.userName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="font-bold text-sm text-gray-900">{r.userName}</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {parseTimestamp(r.createdAt).toLocaleDateString("mn-MN")}
                </span>
              </div>
              <div className="flex items-center gap-0.5 mb-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-3.5 h-3.5 ${
                      n <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PhotoTab({ shop }: { shop: ShopData }) {
  if (!shop.images || shop.images.length === 0) {
    return (
      <div className="p-5 text-gray-400 text-sm font-medium text-center bg-white min-h-[40vh] border-t border-gray-100 flex items-center justify-center">
        Зураг одоогоор байхгүй байна.
      </div>
    );
  }
  return (
    <div className="bg-white min-h-[40vh] border-t border-gray-100 px-3 py-3">
      <div className="grid grid-cols-3 gap-1">
        {shop.images.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square bg-gray-100 rounded-md overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r2Url(src)}
              alt={`Дэлгүүрийн зураг ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
