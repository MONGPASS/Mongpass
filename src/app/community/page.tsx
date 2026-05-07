'use client';

import { Heart, MessageCircle, PenLine, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import {
  COMMUNITY_CATEGORIES,
  CommunityPost,
  countCommentsForPost,
  loadPosts,
} from "@/lib/communityStore";
import { getCurrentUser } from "@/lib/userStore";

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Дөнгөж сая";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} өдөр`;
  return new Date(iso).toLocaleDateString("mn-MN");
}

const CATEGORY_BADGE: Record<string, string> = {
  "Зөвлөгөө": "bg-blue-100 text-blue-700",
  "Худалдаа": "bg-orange-100 text-orange-700",
  "Ажил": "bg-purple-100 text-purple-700",
  "Үйл явдал": "bg-pink-100 text-pink-700",
  "Мэдээ": "bg-emerald-100 text-emerald-700",
  "Алдсан/Олсон": "bg-amber-100 text-amber-700",
  "Бусад": "bg-gray-100 text-gray-700",
};

export default function CommunityListPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    setPosts(loadPosts());
    setHasUser(getCurrentUser() !== null);
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.category === filter);
  }, [posts, filter]);

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-gray-900">Чөлөөт булан</h1>
          <Link
            href={hasUser ? "/community/new" : "/login?redirect=/community/new"}
            className="bg-gray-900 text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <PenLine className="w-3.5 h-3.5" /> Бичих
          </Link>
        </div>
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto hide-scroll">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border ${
              filter === "all"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            Бүгд
          </button>
          {COMMUNITY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border ${
                filter === c
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-gray-400">
            <Users className="w-5 h-5" />
          </div>
          {posts.length === 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-1">Чөлөөт булан хоосон байна</p>
              <p className="text-[12px] text-gray-400 mb-5">Хамгийн эхэнд нийтлэл бичсэн хүн та байх уу?</p>
              <Link
                href={hasUser ? "/community/new" : "/login?redirect=/community/new"}
                className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
              >
                <PenLine className="w-4 h-4" /> Анхны нийтлэл
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-400">&ldquo;{filter}&rdquo; ангилалд нийтлэл алга байна</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 bg-white">
          {visible.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function PostListItem({ post }: { post: CommunityPost }) {
  const commentCount = countCommentsForPost(post.id);
  const badgeClass = CATEGORY_BADGE[post.category] ?? CATEGORY_BADGE.Бусад;
  return (
    <Link
      href={`/community/${post.id}`}
      className="block px-5 py-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
          {post.category}
        </span>
        <span className="text-[11px] text-gray-400">{fmtRelative(post.createdAt)}</span>
      </div>
      <h3 className="font-bold text-[14px] text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
      <p className="text-[12px] text-gray-600 line-clamp-2 mb-2">{post.content}</p>
      {post.imageDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageDataUrl}
          alt=""
          className="w-full max-h-48 object-cover rounded-lg border border-gray-100 mb-2"
        />
      )}
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span className="font-semibold text-gray-700">{post.authorName}</span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" /> {post.likes.length}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" /> {commentCount}
        </span>
      </div>
    </Link>
  );
}
