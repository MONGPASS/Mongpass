import Link from "next/link";
import { ArrowLeft, Search, Map, SlidersHorizontal, ArrowDownUp, Star, MapPin } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";

// Mock Data
const MOCK_STORES = [
  {
    id: 1,
    name: "Улаанбаатар Зоогийн ...",
    rating: 4.8,
    reviews: 128,
    desc: "Монгол үндэсний хоол, хуушуур, бууз, цуйван. Гэр бүлийн тав тухтай орчин.",
    location: "Сөүл, Донгдэмун",
    distance: "1.2 км",
    isOpen: true,
    imageColor: "bg-amber-900"
  },
  {
    id: 2,
    name: "Тал Нутаг Ресторан",
    rating: 4.5,
    reviews: 85,
    desc: "Амттай шөл, хорхог, боодог захиалгаар хийнэ.",
    location: "Инчон",
    distance: "15 км",
    isOpen: false,
    imageColor: "bg-red-900"
  },
  {
    id: 3,
    name: "Монгол Гэр",
    rating: 5.0,
    reviews: 42,
    desc: "Найрсаг үйлчилгээ, цэвэрхэн орчин. Өглөөний цай гардаг.",
    location: "Бусан",
    distance: "320 км",
    isOpen: false,
    imageColor: "bg-orange-800"
  },
  {
    id: 4,
    name: "Сөүл Бууз & Банш",
    rating: 4.2,
    reviews: 200,
    desc: "Түргэн хоол, хүргэлтийн үйлчилгээтэй. 24 цагаар ажиллана.",
    location: "Сөүл, Ганнам",
    distance: "5.4 км",
    isOpen: true,
    imageColor: "bg-blue-900" // using colors as placeholder for images
  },
];

const categoryNames: Record<string, string> = {
  meat: "Махны дэлгүүр",
  cargo: "Карго",
  hospital: "Эмнэлэг",
  car: "Хуучин машин",
  phone: "Утас дугаар",
  restaurant: "Хоолны газар",
  travel: "Аялал",
  other: "Бусад",
};

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const title = categoryNames[params.slug] || "Үйлчилгээ";

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-[80px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white px-5 py-3 flex items-center justify-between border-b border-gray-100">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-[18px] font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-3">
          <button className="p-1 hover:text-primary transition"><Search size={22} className="text-gray-700" /></button>
          <button className="p-1 hover:text-primary transition"><Map size={22} className="text-gray-700" /></button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white px-5 py-4 border-b border-gray-100">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Бизнесийн нэрээр хайх..." 
            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[14px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition active:scale-[0.98]">
            <SlidersHorizontal size={16} /> Шүүх
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition active:scale-[0.98]">
            <ArrowDownUp size={16} /> Эрэмбэлэх
          </button>
        </div>

        <div className="flex overflow-x-auto snap-x hide-scroll gap-2 -mx-5 px-5 pb-1">
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />
          <button className="shrink-0 snap-start px-3.5 py-1.5 bg-blue-50 text-primary text-[13px] font-semibold rounded-full">Нээлттэй</button>
          <button className="shrink-0 snap-start px-3.5 py-1.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full">Ойрхон</button>
          <button className="shrink-0 snap-start px-3.5 py-1.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full">Өндөр үнэлгээтэй</button>
          <button className="shrink-0 snap-start px-3.5 py-1.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full">Хямд үнэ</button>
        </div>
      </div>

      {/* List */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {MOCK_STORES.map((store) => (
          <Link href={`/category/${params.slug}/${store.id}`} key={store.id} className="bg-white p-3.5 rounded-2xl flex gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform">
            <div className={`relative w-[90px] h-[90px] rounded-xl shrink-0 ${store.imageColor} overflow-hidden shadow-sm flex items-center justify-center bg-cover bg-center`}
                 style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.3))' }}
            >
              <div className={`absolute top-1 left-1 px-1.5 py-[2px] rounded uppercase font-bold text-[9px] text-white shadow-sm
                ${store.isOpen ? 'bg-emerald-500' : 'bg-red-500'}
              `}>
                {store.isOpen ? 'Нээлттэй' : 'Хаалттай'}
              </div>
              <span className="text-white font-bold opacity-30 text-2xl drop-shadow-md">IMG</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15px] text-gray-900 mb-0.5 truncate">{store.name}</h3>
              <div className="flex items-center gap-1 mb-1.5">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[12px] font-bold text-gray-900">{store.rating}</span>
                <span className="text-[12px] text-gray-400 font-medium">({store.reviews} сэтгэгдэл)</span>
              </div>
              <p className="text-[12px] leading-snug text-gray-600 line-clamp-2 mb-2">
                {store.desc}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                <MapPin size={12} className="text-gray-400" />
                <span>{store.location} • {store.distance}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
