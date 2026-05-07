'use client';

// Cloudflare Pages requires every non-static route to opt into the edge runtime.
export const runtime = "edge";

import { ArrowLeft, MessageCircle, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CommentType = {
  id: number;
  author: string;
  text: string;
  time: string;
  replies?: CommentType[];
};

export default function NoticeDetailPage({ params }: { params: { slug: string, shopId: string, noticeId: string } }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentType[]>([
    { 
      id: 1, 
      author: "Болдоо", 
      text: "Маш их баярлалаа, амжилт хүсье!", 
      time: "1 цагийн өмнө",
      replies: [
        { id: 101, author: "Админ", text: "Баярлалаа! Танд ч бас амжилт.", time: "45 минутын өмнө" }
      ]
    },
    { 
      id: 2, 
      author: "Сараа", 
      text: "Хэзээ хүртэл урамшуулалтай вэ?", 
      time: "30 минутын өмнө",
      replies: []
    }
  ]);

  // Mock notice data (in real app, fetch using noticeId)
  const notice = {
    id: params.noticeId,
    title: params.noticeId === "1" ? "Шинэ жилийн урамшуулал эхэллээ!" : "Цагийн хуваарьт өөрчлөлт орлоо",
    date: params.noticeId === "1" ? "2026.11.15" : "2026.04.10",
    content: params.noticeId === "1" 
      ? "Бүх үйлчилгээндээ 20% хямдрал зарлаж байна. Та амжиж үйлчлүүлээрэй. Нэмэлт мэдээлэл авахыг хүсвэл утсаар холбогдоно уу."
      : "Даваа гаригт амарч, Ням гаригт хэвийн ажиллахаар боллоо. Үйлчлүүлэгч та бүхэн цагийн хуваариа харж ирнэ үү.",
    views: 142
  };

  const handlePostComment = () => {
    if (!comment.trim()) return;
    
    const newComment: CommentType = {
      id: Date.now(),
      author: "Зочин",
      text: comment,
      time: "Одоо"
    };

    if (replyingTo) {
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        return c;
      }));
    } else {
      setComments([...comments, { ...newComment, replies: [] }]);
    }
    
    setComment("");
    setReplyingTo(null);
  };

  const totalComments = comments.reduce((total, c) => total + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-[100px] relative">
      {/* Top Navigation */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-900 active:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} strokeWidth={1.5} />
        </button>
        <h1 className="flex-1 text-center font-bold text-gray-900 pr-6 text-[16px]">Мэдээлэл</h1>
      </div>

      {/* Notice Content */}
      <div className="bg-white p-5 mb-2 border-b border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold rounded">Мэдэгдэл</span>
          <span className="text-[12px] text-gray-400 font-medium">{notice.date}</span>
        </div>
        <h2 className="font-bold text-[18px] text-gray-900 leading-snug mb-4">{notice.title}</h2>
        <div className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap pb-5 mb-1 border-b border-gray-100/60">
          {notice.content}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[12px] text-gray-400 font-medium">Хандсан: {notice.views}</span>
          <div className="flex items-center gap-1 text-[12px] text-gray-400 font-medium">
            <MessageCircle size={14} />
            <span>Сэтгэгдэл {totalComments}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white p-5 min-h-[40vh] shadow-sm pb-10">
        <h3 className="font-bold text-[15px] text-gray-900 mb-5">Сэтгэгдэл ({totalComments})</h3>
        
        <div className="space-y-6">
          {comments.map(c => (
            <div key={c.id} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 font-bold text-xs">{c.author[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[13.5px] text-gray-900">{c.author}</span>
                    <span className="text-[10px] text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-[13.5px] text-gray-700 leading-relaxed mb-1.5">{c.text}</p>
                  <button 
                    onClick={() => setReplyingTo(c.id)}
                    className="text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Хариулах
                  </button>
                </div>
              </div>

              {/* Nested Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-11 flex flex-col gap-4 mt-1 pl-4 border-l-2 border-gray-100">
                  {c.replies.map(r => (
                    <div key={r.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 shrink-0 flex items-center justify-center text-blue-600 font-bold text-[10px]">{r.author[0]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[12.5px] text-gray-900">{r.author}</span>
                          <span className="text-[10px] text-gray-400">{r.time}</span>
                        </div>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 p-3 pb-safe z-50 flex flex-col gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {replyingTo && (
          <div className="flex items-center justify-between text-[11px] text-gray-600 px-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
            <span>Сэтгэгдэлд хариу бичиж байна...</span>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={14} /></button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={replyingTo ? "Хариу бичих..." : "Сэтгэгдэл үлдээх..."}
            className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-5 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
          />
          <button 
            onClick={handlePostComment}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${comment.trim() ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
          >
            <Send size={18} className={comment.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
