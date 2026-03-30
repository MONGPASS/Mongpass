import { MapPin, Clock, Phone, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShopData } from "../types";

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

export function ReviewTab() {
  return (
    <div className="p-5 text-gray-400 text-sm font-medium text-center bg-white min-h-[40vh] border-t border-gray-100 flex items-center justify-center">
      Сэтгэгдэл одоогоор байхгүй байна.
    </div>
  );
}

export function PhotoTab() {
  return (
    <div className="p-5 text-gray-400 text-sm font-medium text-center bg-white min-h-[40vh] border-t border-gray-100 flex items-center justify-center">
      Зураг одоогоор байхгүй байна.
    </div>
  );
}
