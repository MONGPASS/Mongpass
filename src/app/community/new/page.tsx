'use client';

import { ArrowLeft, Camera, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  COMMUNITY_CATEGORIES,
  createPost,
} from "@/lib/communityStore";
import { User, getCurrentUser } from "@/lib/userStore";
import { uploadImage } from "@/lib/images/upload";

export default function CommunityNewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [category, setCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser().then((u) => {
      if (!active) return;
      if (!u) {
        router.replace("/login?redirect=/community/new");
        return;
      }
      setUser(u);
      setAuthChecked(true);
    });
    return () => { active = false; };
  }, [router]);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const uploaded = await uploadImage(file, "post");
    if (uploaded) setImageDataUrl(uploaded.url);
  }

  async function submit() {
    if (!user || !title.trim() || !content.trim()) return;
    const post = await createPost({
      authorId: user.id,
      authorName: user.name,
      category,
      title: title.trim(),
      content: content.trim(),
      imageDataUrl: imageDataUrl ?? undefined,
    });
    if (post) router.push(`/community/${post.id}`);
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/community" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Шинэ нийтлэл</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <label className="text-[11px] font-bold text-gray-500 mb-2 block">Ангилал</label>
          <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
            {COMMUNITY_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border ${
                  category === c
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Гарчиг</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Богино, тодорхой гарчиг"
              maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Агуулга</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Юу хуваалцмаар байна?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
              Зураг <span className="font-medium text-gray-400">(заавал биш)</span>
            </label>
            {imageDataUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <img src={imageDataUrl} alt="" className="w-full max-h-60 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  id="communityImage"
                  className="hidden"
                  onChange={handleImage}
                />
                <label
                  htmlFor="communityImage"
                  className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 cursor-pointer active:bg-gray-50"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-xs font-medium">Зураг хавсаргах</span>
                </label>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40"
          >
            Нийтлэх
          </button>
        </div>
      </div>
    </main>
  );
}
