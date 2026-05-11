'use client';

import { ArrowLeft, Newspaper } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { NewsArticle, loadNews } from "@/lib/newsStore";
import { NEWS_CATEGORIES, newsCategoryBadge } from "@/lib/newsCategories";
import { r2Url } from "@/lib/images/upload";

/**
 * Dedicated /news listing page ("Мэдээ мэдээлэл"). Shows every
 * published article with a horizontal category tab strip so the
 * customer can drill into a single bucket as the archive grows.
 *
 * Layout: 1 column on phone, 2 columns on lg+. Hides the section
 * gracefully when the table is empty.
 */
export default function NewsListPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    let active = true;
    loadNews().then((list) => {
      if (!active) return;
      setArticles(list);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    if (!category) return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-[18px] font-bold text-gray-900 flex-1">Мэдээ мэдээлэл</h1>
        </div>

        {/* Category filter strip — Бүгд + each category. Sticks with
            the header so it stays visible while the customer scrolls. */}
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scroll">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border whitespace-nowrap transition-colors ${
              category === ""
                ? "bg-primary border-primary text-white"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            Бүгд
          </button>
          {NEWS_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border whitespace-nowrap transition-colors ${
                category === c
                  ? "bg-primary border-primary text-white"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4">
        {!loaded ? null : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
              <Newspaper className="w-5 h-5" />
            </div>
            {articles.length === 0 ? (
              <p className="text-sm text-gray-500">Мэдээ алга байна</p>
            ) : (
              <p className="text-sm text-gray-500">
                Энэ ангилалд мэдээ алга байна
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visible.map((a) => (
              <Link
                key={a.id}
                href={`/news/${encodeURIComponent(a.id)}`}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex gap-3 active:scale-[0.99] transition-transform"
              >
                <div className="w-32 aspect-[4/3] bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
                  {a.coverR2Key ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r2Url(a.coverR2Key)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Newspaper className="w-7 h-7" />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-3 pr-3">
                  {a.category && (
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mb-1.5 ${newsCategoryBadge(a.category)}`}>
                      {a.category}
                    </span>
                  )}
                  <p className="font-bold text-[14px] text-gray-900 line-clamp-2 mb-1">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {a.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
