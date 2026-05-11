'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { NewsArticle, loadNews } from "@/lib/newsStore";
import { r2Url } from "@/lib/images/upload";

/**
 * Home page "Мэдээ" section — horizontal-scroll cards of the most
 * recent published articles. Hides itself entirely when no articles
 * exist so the home page doesn't render an empty heading.
 *
 * Each card mirrors the reference screenshot: 16:9 cover image,
 * tag chips below it, bold title (2-line clamp), excerpt (2-line
 * clamp). Whole card is a Link to /news/[id].
 */
export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[] | null>(null);

  useEffect(() => {
    let active = true;
    loadNews().then((list) => {
      if (active) setArticles(list);
    });
    return () => { active = false; };
  }, []);

  // Loading state — same height as the populated state so the
  // surrounding layout doesn't jump as articles fetch.
  if (articles === null) {
    return <section className="bg-white px-5 pt-6 pb-8" aria-hidden />;
  }
  if (articles.length === 0) return null;

  return (
    <section className="bg-white pt-6 pb-8 overflow-hidden">
      <h2 className="text-lg font-bold text-foreground px-5 mb-4">Мэдээ</h2>
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll px-5 gap-3 pb-2">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/news/${encodeURIComponent(a.id)}`}
            className="snap-start shrink-0 w-[280px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.99] transition-transform"
          >
            <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center text-gray-400">
              {a.coverR2Key ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r2Url(a.coverR2Key)} alt="" className="w-full h-full object-cover" />
              ) : (
                <Newspaper className="w-8 h-8" />
              )}
            </div>
            <div className="p-3.5">
              <p className="font-bold text-[14px] text-gray-900 line-clamp-2 mb-1.5">
                {a.title}
              </p>
              {/* First line of the body acts as a teaser. Server stores
                  full content; we just clip on the client. */}
              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                {a.content}
              </p>
              {a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {a.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold text-primary"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
