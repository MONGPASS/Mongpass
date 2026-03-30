'use client';

import { Heart, Star, Share2, ArrowLeft, BadgeCheck } from "lucide-react";
import { ShopData } from "./types";
import { useRouter } from "next/navigation";

export function TopNavBar() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-50">
      <button onClick={() => router.back()} className="p-1 -ml-1 flex items-center justify-center text-gray-900">
        <ArrowLeft size={28} strokeWidth={1.5} />
      </button>
      <div className="flex items-center gap-4 text-gray-900">
        <button><Heart size={26} strokeWidth={1.5} /></button>
        <button><Share2 size={26} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}

export function ShopHeader({ shop }: { shop: ShopData }) {
  return (
    <div className="px-5 pt-2 pb-5 bg-white space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{shop.name}</h1>
      </div>
      
      <div className="flex items-center gap-2 text-[13px] text-gray-600">
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-[#FF7E36] text-[#FF7E36]" />
          <span className="font-bold text-gray-900">{shop.rating}</span>
        </div>
        <span>·</span>
        <span>Сэтгэгдэл {shop.reviews}</span>
      </div>

      <div className="flex items-center gap-1 text-[13px] text-blue-600 font-medium pb-2">
        <BadgeCheck size={16} className="fill-blue-600 text-white" />
        Баталгаажсан газар
      </div>
    </div>
  );
}

export function ImageGallery({ images }: { images: string[] }) {
  return (
    <div className="bg-white pb-5">
      <div className="flex overflow-x-auto hide-scroll px-5 gap-3 snap-x snap-mandatory">
        {images.map((src, i) => (
          <div key={i} className="snap-start shrink-0 w-[160px] h-[220px] md:w-[240px] md:h-[320px] bg-gray-100 rounded-xl overflow-hidden relative border border-gray-100/50">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-bold bg-gray-50">
              IMAGE {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TabMenu({ 
  activeTab, 
  setActiveTab, 
  serviceTabName 
}: { 
  activeTab: string, 
  setActiveTab: (t: string) => void,
  serviceTabName: string
}) {
  const tabs = [
    { id: "home", label: "Нүүр" },
    { id: "info", label: "Мэдээлэл" },
    { id: "service", label: serviceTabName },
    { id: "review", label: "Сэтгэгдэл" },
    { id: "photo", label: "Зураг" }
  ];

  return (
    <div className="flex border-b border-gray-200 bg-white sticky top-0 z-40 px-2 overflow-x-auto hide-scroll">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-max px-4 py-3.5 text-sm font-semibold transition-colors border-b-2 
            ${activeTab === tab.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function BottomCTA({ text }: { text: string }) {
  const router = useRouter();
  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-100 p-4 pb-safe z-50">
      <div className="flex gap-2">
        <button 
          onClick={() => router.push('/biz?tab=chat')}
          className="px-5 bg-primary text-white font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform whitespace-nowrap"
        >
          Чатлах
        </button>
        <button className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform">
          {text}
        </button>
      </div>
    </div>
  );
}
