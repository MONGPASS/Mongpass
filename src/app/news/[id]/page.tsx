'use client';

export const runtime = "edge";

import { ArrowLeft, Heart, Newspaper, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NewsArticle,
  findNewsArticle,
  loadNews,
  toggleNewsArticleLike,
} from "@/lib/newsStore";
import { getCurrentUser } from "@/lib/userStore";
import { r2Url } from "@/lib/images/upload";

/**
 * News article detail page.
 *
 * Layout follows the reference: large hero, tag chip + share + heart
 * row, headline, body paragraphs, then a "Дараагийн мэдээ" rail of
 * other published articles. Like state toggles client-side on click
 * with server confirmation; signed-out viewers get bounced to
 * /login on first heart-tap.
 */
export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null | undefined>(undefined);
  const [moreArticles, setMoreArticles] = useState<NewsArticle[]>([]);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [a, list] = await Promise.all([
        findNewsArticle(params.id),
        loadNews(),
      ]);
      if (!active) return;
      setArticle(a);
      // "Other" articles for the bottom rail — exclude this one + cap at 6.
      setMoreArticles(list.filter((x) => x.id !== params.id).slice(0, 6));
    })();
    return () => { active = false; };
  }, [params.id]);

  async function handleLike() {
    if (!article || liking) return;
    const user = await getCurrentUser();
    if (!user) {
      router.push(`/login?redirect=/news/${encodeURIComponent(params.id)}`);
      return;
    }
    setLiking(true);
    try {
      const next = await toggleNewsArticleLike(article.id);
      if (next) {
        setArticle({
          ...article,
          liked: next.liked,
          likeCount: next.likeCount,
        });
      }
    } finally {
      setLiking(false);
    }
  }

  async function handleShare() {
    if (!article) return;
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: article.title, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    // Fallback: copy to clipboard.
    try {
      await navigator.clipboard.writeText(url);
      alert("Холбоос хуулагдлаа");
    } catch {
      /* clipboard blocked */
    }
  }

  if (article === undefined) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }
  if (article === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Newspaper className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Мэдээ олдсонгүй.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Нүүр хуудас руу
          </Link>
        </div>
      </main>
    );
  }

  // Tag string used to be a single chip on the hero; render the
  // first non-empty tag if any, otherwise skip the chip row.
  const heroTag = article.tags[0];

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero image */}
      {article.coverR2Key ? (
        <div className="bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r2Url(article.coverR2Key)}
            alt=""
            className="w-full aspect-[16/10] object-cover"
          />
        </div>
      ) : (
        <div className="bg-gray-100 aspect-[16/10] flex items-center justify-center text-gray-400">
          <Newspaper className="w-12 h-12" />
        </div>
      )}

      <article className="bg-white">
        {/* Tag + share + heart row */}
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-[12px] font-bold text-primary">
            {heroTag ? `#${heroTag}` : " "}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-1.5 hover:bg-gray-100 rounded-full"
              aria-label="Хуваалцах"
            >
              <Share2 className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={handleLike}
              disabled={liking}
              className="flex items-center gap-1.5 hover:bg-gray-100 rounded-full px-2 py-1 disabled:opacity-50"
              aria-label={article.liked ? "Хадгалснаас хасах" : "Хадгалах"}
            >
              <Heart
                className={`w-5 h-5 ${
                  article.liked ? "fill-red-500 text-red-500" : "text-gray-500"
                }`}
              />
              <span className="text-[13px] font-bold text-gray-700">{article.likeCount}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-gray-900 leading-tight px-5 pt-3 pb-4">
          {article.title}
        </h1>

        {/* Body — whitespace-pre-wrap keeps the admin's line breaks. */}
        <div className="px-5 pb-6 text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {article.content}
        </div>

        {/* Footer tag chips — secondary repetition of categorisation. */}
        {article.tags.length > 0 && (
          <div className="px-5 pb-6 flex flex-wrap gap-3 text-[12px] font-bold text-primary">
            {article.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}
      </article>

      {/* Next news rail */}
      {moreArticles.length > 0 && (
        <section className="mt-4 bg-white pt-6 pb-8 overflow-hidden">
          <h2 className="text-base font-bold text-gray-900 px-5 mb-3">
            Дараагийн мэдээ
          </h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll px-5 gap-3 pb-2">
            {moreArticles.map((a) => (
              <Link
                key={a.id}
                href={`/news/${encodeURIComponent(a.id)}`}
                className="snap-start shrink-0 w-[280px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
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
                  <p className="font-bold text-[13px] text-gray-900 line-clamp-2 mb-1">
                    {a.title}
                  </p>
                  {a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {a.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] font-bold text-primary">
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
      )}
    </main>
  );
}
