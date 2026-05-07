'use client';

export const runtime = "edge";

import { ArrowLeft, Heart, MessageCircle, Send, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommunityComment,
  CommunityPost,
  addComment,
  deleteComment,
  deletePost,
  findPost,
  loadCommentsForPost,
  toggleLike,
} from "@/lib/communityStore";
import { User, getCurrentUser } from "@/lib/userStore";

const CATEGORY_BADGE: Record<string, string> = {
  "Зөвлөгөө": "bg-blue-100 text-blue-700",
  "Худалдаа": "bg-orange-100 text-orange-700",
  "Ажил": "bg-purple-100 text-purple-700",
  "Үйл явдал": "bg-pink-100 text-pink-700",
  "Мэдээ": "bg-emerald-100 text-emerald-700",
  "Алдсан/Олсон": "bg-amber-100 text-amber-700",
  "Бусад": "bg-gray-100 text-gray-700",
};

function fmtFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CommunityPostDetailPage({ params }: { params: { postId: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<CommunityPost | null | undefined>(undefined);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState("");

  function refresh() {
    setPost(findPost(params.postId));
    setComments(loadCommentsForPost(params.postId));
  }

  useEffect(() => {
    let active = true;
    getCurrentUser().then((u) => {
      if (active) setUser(u);
    });
    refresh();
    return () => { active = false; };
  }, [params.postId]);

  function handleLike() {
    if (!user) {
      router.push(`/login?redirect=/community/${params.postId}`);
      return;
    }
    const updated = toggleLike(params.postId, user.id);
    if (updated) setPost(updated);
  }

  function handleSubmitComment() {
    if (!user) {
      router.push(`/login?redirect=/community/${params.postId}`);
      return;
    }
    if (!draft.trim()) return;
    addComment({
      postId: params.postId,
      authorId: user.id,
      authorName: user.name,
      content: draft.trim(),
    });
    setDraft("");
    setComments(loadCommentsForPost(params.postId));
  }

  function handleDeletePost() {
    if (!confirm("Энэ нийтлэлийг устгах уу?")) return;
    deletePost(params.postId);
    router.push("/community");
  }

  function handleDeleteComment(id: string) {
    if (!confirm("Энэ сэтгэгдлийг устгах уу?")) return;
    deleteComment(id);
    setComments(loadCommentsForPost(params.postId));
  }

  if (post === undefined) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  if (post === null) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 mb-6">Энэ нийтлэл устгагдсан эсвэл олдсонгүй.</p>
          <Link href="/community" className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            <ArrowLeft className="w-4 h-4" /> Чөлөөт булан руу буцах
          </Link>
        </div>
      </main>
    );
  }

  const liked = user ? post.likes.includes(user.id) : false;
  const isAuthor = user?.id === post.authorId;
  const badgeClass = CATEGORY_BADGE[post.category] ?? CATEGORY_BADGE.Бусад;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/community" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Нийтлэл</h1>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              aria-label="Нийтлэл устгах"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Post body */}
      <article className="bg-white px-5 pt-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
            {post.category}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{post.title}</h2>
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-4">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold">
            {post.authorName.slice(0, 1).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-700">{post.authorName}</span>
          <span>·</span>
          <span>{fmtFull(post.createdAt)}</span>
        </div>
        {post.imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageDataUrl}
            alt=""
            className="w-full max-h-[400px] object-cover rounded-xl border border-gray-100 mb-3"
          />
        )}
        <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${liked ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-white text-gray-600 border-gray-200"}`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
            {post.likes.length}
          </button>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white text-gray-600 border border-gray-200">
            <MessageCircle className="w-4 h-4" />
            {comments.length}
          </span>
        </div>
      </article>

      {/* Comments */}
      <section className="bg-white">
        <h3 className="px-5 pt-5 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Сэтгэгдэл ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            Эхэнд сэтгэгдэл бичсэн хүн та байх уу?
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((c) => {
              const myComment = user?.id === c.authorId;
              return (
                <div key={c.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold">
                        {c.authorName.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-bold text-gray-900">{c.authorName}</span>
                      <span className="text-[10px] text-gray-400">{fmtFull(c.createdAt)}</span>
                    </div>
                    {myComment && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="Сэтгэгдэл устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap pl-8">
                    {c.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Comment composer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitComment();
            }}
            placeholder={user ? "Сэтгэгдэл бичих..." : "Сэтгэгдэл бичихийн тулд нэвтрэнэ үү"}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!draft.trim()}
            className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
            aria-label="Илгээх"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </main>
  );
}
