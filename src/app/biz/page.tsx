'use client';

import { ArrowLeft, Share2, Menu, AlertCircle, Edit3, ShoppingBag, Camera, Home, PlusSquare, MessageCircle, Settings, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { getCategoryInfo } from "@/lib/categories";
import { ShopCategory } from "@/components/shop/types";
import { BeautyAppointment, CargoOrder, HospitalAppointment, ORDER_STATUS_LABEL, OrderStatus, RestaurantOrder, formatPrice, getStatusFlow, getStatusLabel, loadOrdersByShop, updateOrderStatus } from "@/lib/orderStore";
import { Shop, findShopByOwner, isShopOpen, toggleOpen, updateShop } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";
import { BizChatThreadList } from "@/components/biz/BizChatThreadList";

const CATEGORY_HAS_DEDICATED_ORDERS_UI: ShopCategory[] = ["cargo", "restaurant", "food", "hospital", "beauty"];

// Top-level wrapper provides the Suspense boundary required when
// useSearchParams() is used during render — without it Next.js fails
// the build trying to statically prerender this page.
export default function BizProfilePage() {
  return (
    <Suspense fallback={<main className="w-full min-h-screen bg-gray-50" />}>
      <BizProfilePageInner />
    </Suspense>
  );
}

function BizProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [activeTab, setActiveTab] = useState("Нүүр");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const shopCategoryInfo = currentShop ? getCategoryInfo(currentShop.category) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth/shop gate: redirect to /login or /biz/register if needed.
  useEffect(() => {
    let active = true;
    (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?redirect=/biz");
        return;
      }
      const shop = await findShopByOwner(user.id);
      if (!active) return;
      if (!shop) {
        router.replace("/biz/register");
        return;
      }
      setCurrentShop(shop);
      setShopName(shop.name);
      setShopImages(shop.images ?? []);
      setFormData({
        hours: shop.openHours ?? "",
        phone: shop.contactPhone ?? "",
        facebook: shop.facebook ?? "",
        instagram: shop.instagram ?? "",
        address: shop.address ?? "",
      });
      setAuthChecked(true);
    })();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'chat') {
      setActiveTab('Чат');
      setIsEditingProfile(true);
    }
  }, [searchParams]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setShopImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setShopImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Editable shop profile fields. Initial values come from currentShop
  // once it loads (see auth useEffect above).
  const [formData, setFormData] = useState({
    hours: "",
    phone: "",
    facebook: "",
    instagram: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleShopSave() {
    if (!currentShop) return;
    // PATCH only the editable text fields. Image uploads land in Phase 5
    // (presigned R2 PUT URLs); editing a rejected shop implicitly
    // re-enters review, handled server-side. Notice CRUD lives at /biz/notices.
    const next = await updateShop(currentShop.id, {
      name: shopName.trim() || currentShop.name,
      openHours: formData.hours.trim() || undefined,
      contactPhone: formData.phone.trim() || undefined,
      facebook: formData.facebook.trim() || undefined,
      instagram: formData.instagram.trim() || undefined,
      address: formData.address.trim() || undefined,
    });
    if (next) {
      setCurrentShop(next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  }

  // Wait for auth/shop checks before rendering. The useEffect above will
  // already have triggered a redirect if needed.
  if (!authChecked || !currentShop || !shopCategoryInfo) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 relative pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-900 active:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={28} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-4 text-gray-900">
          <button><Share2 size={24} strokeWidth={1.5} /></button>
          <button><Menu size={26} strokeWidth={1.5} /></button>
        </div>
      </div>

      {/* Shop type + open/closed toggle */}
      <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Дэлгүүрийн төрөл
          </span>
          <span className="text-[12px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
            {shopCategoryInfo.label}
          </span>
        </div>
        <button
          onClick={async () => {
            const next = await toggleOpen(currentShop.id);
            if (next) setCurrentShop(next);
          }}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
            isShopOpen(currentShop)
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isShopOpen(currentShop) ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {isShopOpen(currentShop) ? "Нээлттэй" : "Хаалттай"}
        </button>
      </div>

      {/* Approval status banner */}
      {currentShop.status === "pending" && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <p className="text-[13px] font-bold text-yellow-800 mb-0.5">
            ⏳ Хүлээгдэж буй — Удахгүй баталгаажна
          </p>
          <p className="text-[11px] text-yellow-700 leading-relaxed">
            Таны дэлгүүр одоогоор хэрэглэгчдэд харагдахгүй байна. Дэлгүүрийн мэдээллээ бүрэн
            оруулсан байх тусам баталгаажуулалт хурдан болно.
          </p>
        </div>
      )}
      {currentShop.status === "rejected" && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-[13px] font-bold text-red-800 mb-0.5">
            ❌ Татгалзсан
          </p>
          {currentShop.rejectionReason && (
            <p className="text-[11px] text-red-700 leading-relaxed mb-1">
              <span className="font-bold">Шалтгаан:</span> {currentShop.rejectionReason}
            </p>
          )}
          <p className="text-[11px] text-red-700 leading-relaxed">
            Засах хэсгээс мэдээллээ засаад дахин хадгална уу — автоматаар шинэ баталгаажуулалтын
            хүсэлт үүсэх болно.
          </p>
        </div>
      )}

      {isEditingProfile && (
        <>
          {/* Warning Banner */}
          {(() => {
            const missingFields: string[] = [];
            if (!shopName.trim()) missingFields.push("Дэлгүүрийн нэр");
            if (!formData.hours.trim()) missingFields.push("Цагийн хуваарь");
            if (!formData.phone.trim()) missingFields.push("Утасны дугаар");
            if (!formData.facebook.trim()) missingFields.push("Facebook холбоос");
            if (!formData.instagram.trim()) missingFields.push("Instagram холбоос");
            if (!formData.address.trim()) missingFields.push("Хаяг / Байршил");
            if (shopImages.length === 0) missingFields.push("Дэлгүүрийн зураг");

            return missingFields.length > 0 ? (
              <div className="bg-red-50 px-5 py-3 flex gap-3 text-red-600">
                <AlertCircle size={18} className="shrink-0 mt-0.5 fill-red-600 text-white" />
                <div>
                  <p className="text-[13px] font-medium leading-snug mb-1.5">
                    Дараах мэдээллийг оруулна уу:
                  </p>
                  <ul className="text-[12px] font-medium list-disc list-inside flex flex-col gap-0.5 mb-1.5">
                    {missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-red-400">Үйлчлүүлэгчдэд харагдахгүй байна</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 px-5 py-3 flex gap-3 text-green-700">
                <p className="text-[13px] font-bold leading-snug">
                  ✅ Бүх мэдээлэл бүрэн оруулсан байна!
                </p>
              </div>
            );
          })()}

          <div className="bg-white p-5 border-b border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-end gap-2 mt-1 mb-1">
                  <h1 className="text-[22px] font-bold text-gray-900 leading-none">{shopName}</h1>
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                    }} 
                    className={`flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md transition-colors shrink-0 bg-gray-100 text-gray-700 hover:bg-gray-200`}
                  >
                    <ArrowLeft size={12} strokeWidth={2.5} /> Гарах
                  </button>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
      
      {/* Content Form Edit Area */}
      <div className="bg-gray-50 min-h-[50vh] pb-8 pt-2">
        {activeTab === "Нүүр" && (
          <>
            {isEditingProfile ? (
              <div className="bg-white mt-2 p-5 border-y border-gray-100 flex flex-col gap-5">
                
                <div className="flex flex-col gap-2 mb-2">
                  <label className="text-[14px] font-bold text-gray-900">Дэлгүүрийн зураг оруулах</label>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[12px] text-amber-800 leading-relaxed">
                    📷 Зураг оруулах функц удахгүй идэвхжинэ. Одоогоор хадгалагдахгүй.
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled
                  />
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-1 opacity-50">
                    {shopImages.map((src, i) => (
                      <div key={i} className="relative shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden border border-gray-200">
                        <img src={src} alt={`shop-${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled
                      className="shrink-0 w-[100px] h-[100px] bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 cursor-not-allowed"
                    >
                      <Camera size={22} strokeWidth={1.5} />
                      <span className="text-[11px] font-medium">Удахгүй</span>
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <h3 className="font-bold text-gray-900 text-[16px] mt-1 mb-1">Дэлгэрэнгүй мэдээлэл оруулах</h3>
                
                {/* Дэлгүүрийн нэр */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Дэлгүүрийн нэр</label>
                  <input
                    name="name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900"
                  />
                </div>

                {/* Цагийн хуваарь */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Цагийн хуваарь</label>
                  <input
                    name="hours"
                    value={formData.hours}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    placeholder="Жнь: Даваа - Баасан 09:00 - 18:00"
                  />
                </div>

                {/* Утасны дугаар */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Утасны дугаар</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    placeholder="010-0000-0000"
                  />
                </div>

                {/* Facebook */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Facebook холбоос</label>
                  <input
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                {/* Instagram */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Instagram холбоос</label>
                  <input
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                {/* Хаяг / Байршил */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-gray-700">Хаяг / Байршил</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    placeholder="Хаяг оруулах"
                  />
                </div>

                <button
                  onClick={handleShopSave}
                  className="w-full mt-4 bg-gray-900 text-white font-bold py-3.5 rounded-xl text-[15px] shadow-md hover:bg-gray-800 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {savedFlash ? (
                    <>
                      <span className="text-green-300">✓</span> Хадгалагдлаа
                    </>
                  ) : (
                    "Бүх өөрчлөлт хадгалах"
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white mt-2 p-5 border-y border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 text-[16px]">
                  Сайн байна уу, {currentShop.name}!
                </h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  Дээд талын <b>Засах</b> цэснээс дэлгүүрийн мэдээллээ удирдах,
                  <b> Захиалга</b> цэснээс ирсэн захиалгуудыг харах,
                  <b> Чат</b> цэснээс үйлчлүүлэгчтэй харилцаж болно.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[12px] text-blue-700 leading-relaxed">
                  📊 Хандалт, орлого зэрэг статистик удахгүй нэмэгдэнэ.
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Захиалга (Orders) tab — category-specific renderers */}
        {!isEditingProfile && activeTab === "Захиалга" && currentShop.category === "cargo" && (
          <CargoOrdersList shopId={currentShop.id} />
        )}
        {!isEditingProfile && activeTab === "Захиалга" &&
          (currentShop.category === "restaurant" || currentShop.category === "food") && (
            <RestaurantOrdersList shopId={currentShop.id} category={currentShop.category} />
          )}
        {!isEditingProfile && activeTab === "Захиалга" && currentShop.category === "hospital" && (
          <HospitalAppointmentsList shopId={currentShop.id} />
        )}
        {!isEditingProfile && activeTab === "Захиалга" && currentShop.category === "beauty" && (
          <BeautyAppointmentsList shopId={currentShop.id} />
        )}

        {/* Categories without a dedicated orders renderer (currently meat) — show empty state */}
        {!isEditingProfile && activeTab === "Захиалга" &&
          !CATEGORY_HAS_DEDICATED_ORDERS_UI.includes(currentShop.category) && (
            <div className="bg-gray-50 mt-2 min-h-screen px-5 py-12">
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-sm text-gray-500">Захиалга байхгүй байна</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Хэрэглэгчид таны бараа худалдаж авсны дараа энд гарч ирнэ
                </p>
              </div>
            </div>
        )}


        {/* Чат tab — list of customer threads for this shop */}
        {!isEditingProfile && activeTab === "Чат" && (
          <BizChatThreadList shopId={currentShop.id} />
        )}
      </div>

      {/* Admin Bottom Nav */}
      <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-between items-center h-[65px] px-1 overflow-x-auto hide-scroll">
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Нүүр"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Нүүр' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <Home size={21} strokeWidth={activeTab === 'Нүүр' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Нүүр' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Нүүр</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Чат"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Чат' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <MessageCircle size={21} strokeWidth={activeTab === 'Чат' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Чат' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Чат</span>
          </button>
          
          <button 
            onClick={() => { setIsEditingProfile(false); setActiveTab("Захиалга"); }}
            className={`flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Захиалга' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <ShoppingBag size={21} strokeWidth={activeTab === 'Захиалга' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${activeTab === 'Захиалга' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>Захиалга</span>
          </button>
          
          <button
            onClick={() => {
              setIsEditingProfile(false);
              if (shopCategoryInfo.adminRoute) {
                router.push(shopCategoryInfo.adminRoute);
              } else {
                setActiveTab("Бүтээгдэхүүн");
              }
            }}
            className={`flex flex-col items-center justify-center min-w-[65px] h-full gap-1 px-0.5 transition-colors ${activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <PlusSquare size={21} strokeWidth={activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-[1.1] text-center ${activeTab === 'Бүтээгдэхүүн' && !isEditingProfile ? 'font-bold' : 'font-medium'}`}>{shopCategoryInfo.productLabel}<br/>оруулах</span>
          </button>
          
          <button
            onClick={() => {
              setIsEditingProfile(false);
              router.push("/biz/notices");
            }}
            className="flex flex-col items-center justify-center min-w-[60px] h-full gap-1 px-0.5 transition-colors text-gray-400 hover:text-gray-900"
          >
            <Edit3 size={21} strokeWidth={2} />
            <span className="text-[9px] leading-[1.1] text-center font-medium">Мэдээ<br/>удирдах</span>
          </button>

          <button 
            onClick={() => { setIsEditingProfile(true); setActiveTab('Нүүр'); }}
            className={`flex flex-col items-center justify-center min-w-[50px] h-full gap-1 transition-colors ${isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <Settings size={21} strokeWidth={isEditingProfile ? 2.5 : 2} />
            <span className={`text-[9px] leading-tight text-center ${isEditingProfile ? 'font-bold' : 'font-medium'}`}>Засах</span>
          </button>
        </div>
      </div>

    </div>
  );
}

function CargoOrdersList({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop("cargo", shopId);
    setOrders(list as CargoOrder[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    await updateOrderStatus(orderId, status);
    await refresh();
  }

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Карго захиалгууд</h3>
        <StatusFilter category="cargo" filter={filter} setFilter={setFilter} />
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Захиалга байхгүй байна</p>
        )}
        {visible.map((order) => {
          const created = new Date(order.createdAt);
          const dateStr = `${created.getMonth() + 1}/${created.getDate()} ${String(created.getHours()).padStart(2, "0")}:${String(created.getMinutes()).padStart(2, "0")}`;
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {order.id.slice(0, 14)}
                </span>
                <span className="text-[11px] text-gray-500">{dateStr}</span>
              </div>
              <p className="font-bold text-sm text-gray-900 mb-1">
                {order.routeSnapshot.fromCity} → {order.routeSnapshot.toCity}
              </p>
              <div className="flex gap-3 items-start mb-2">
                {order.item.imageDataUrl && (
                  <img
                    src={order.item.imageDataUrl}
                    alt="ачаа"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-100 shrink-0"
                  />
                )}
                <p className="text-[12px] text-gray-500 flex-1 min-w-0">
                  {order.item.description} · {order.item.weight}кг
                  {order.item.dimensions && ` · ${order.item.dimensions}см`}
                  <br />
                  <span className="font-bold text-gray-900">{order.estimatedPrice}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
                <div className="min-w-0">
                  <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">Илгээгч</p>
                  <p className="text-gray-900 font-semibold">{order.sender.name}</p>
                  <p className="text-gray-500">{order.sender.phone}</p>
                  {order.sender.address && (
                    <p className="text-gray-500 mt-0.5 truncate" title={order.sender.address}>
                      📍 {order.sender.address}
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Хүлээн авагч
                  </p>
                  <p className="text-gray-900 font-semibold">{order.receiver.name}</p>
                  <p className="text-gray-500">{order.receiver.phone}</p>
                  {order.receiver.address && (
                    <p className="text-gray-500 mt-0.5 truncate" title={order.receiver.address}>
                      📍 {order.receiver.address}
                    </p>
                  )}
                </div>
              </div>

              <StatusSelect
                category="cargo"
                status={order.status}
                onChange={(s) => changeStatus(order.id, s)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusFilter({
  category,
  filter,
  setFilter,
}: {
  category: ShopCategory;
  filter: OrderStatus | "all";
  setFilter: (f: OrderStatus | "all") => void;
}) {
  const flow = getStatusFlow(category);
  return (
    <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
      <button
        onClick={() => setFilter("all")}
        className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap ${
          filter === "all"
            ? "bg-gray-900 border-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-700"
        }`}
      >
        Бүгд
      </button>
      {flow.map((s) => (
        <button
          key={s}
          onClick={() => setFilter(s)}
          className={`px-4 py-2 rounded-full border text-[13px] font-medium whitespace-nowrap ${
            filter === s
              ? "bg-gray-900 border-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          {getStatusLabel(category, s)}
        </button>
      ))}
    </div>
  );
}

function StatusSelect({
  category,
  status,
  onChange,
}: {
  category: ShopCategory;
  status: OrderStatus;
  onChange: (s: OrderStatus) => void;
}) {
  const flow = getStatusFlow(category);
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
        Төлөв
      </label>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {flow.map((s) => (
          <option key={s} value={s}>
            {getStatusLabel(category, s)}
          </option>
        ))}
        <option value="cancelled">{ORDER_STATUS_LABEL.cancelled}</option>
      </select>
    </div>
  );
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function RestaurantOrdersList({ shopId, category }: { shopId: string; category: "restaurant" | "food" }) {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop(category, shopId);
    setOrders(list as RestaurantOrder[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, category]);

  async function changeStatus(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    await refresh();
  }

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Хоолны захиалгууд</h3>
        <StatusFilter category="restaurant" filter={filter} setFilter={setFilter} />
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Захиалга байхгүй байна</p>
        )}
        {visible.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {order.id.slice(0, 14)}
              </span>
              <span className="text-[11px] text-gray-500">{fmtDateTime(order.createdAt)}</span>
            </div>
            <p className="font-bold text-sm text-gray-900 mb-2">{order.customer.name}</p>
            <div className="space-y-1 mb-3">
              {order.items.map((it) => (
                <div key={it.itemId} className="flex justify-between text-[12px]">
                  <span className="text-gray-700 min-w-0 truncate">
                    {it.name} <span className="text-gray-400">×{it.qty}</span>
                  </span>
                  <span className="text-gray-500 shrink-0 ml-2">{it.price}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 text-[12px]">
                <span className="font-bold text-gray-700">Нийт</span>
                <span className="font-bold text-gray-900">{formatPrice(order.subtotalAmount)}</span>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <p>📞 {order.customer.phone}</p>
              <p className="truncate" title={order.customer.address}>
                📍 {order.customer.address}
              </p>
              {order.notes && <p className="text-orange-600 mt-1">💬 {order.notes}</p>}
            </div>
            <StatusSelect category="restaurant" status={order.status} onChange={(s) => changeStatus(order.id, s)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function HospitalAppointmentsList({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<HospitalAppointment[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop("hospital", shopId);
    setItems(list as HospitalAppointment[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function changeStatus(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    await refresh();
  }

  const visible = filter === "all" ? items : items.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Цаг захиалгууд</h3>
        <StatusFilter category="hospital" filter={filter} setFilter={setFilter} />
      </div>
      <div className="px-4 py-4 space-y-3 pb-24">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Захиалга байхгүй байна</p>
        )}
        {visible.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {a.id.slice(0, 14)}
              </span>
              <span className="text-[11px] text-gray-500">{fmtDateTime(a.createdAt)}</span>
            </div>
            <p className="font-bold text-sm text-gray-900">{a.doctorSnapshot.name}</p>
            <p className="text-[11px] text-gray-500 mb-2">{a.doctorSnapshot.department}</p>
            <p className="text-[12px] text-gray-700 font-semibold mb-1">
              📅 {a.preferredDate} · ⏰ {a.preferredTime}
            </p>
            <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100 space-y-0.5">
              <p>
                <span className="font-bold text-gray-700">Үйлчлүүлэгч:</span> {a.patient.name}
                {a.patient.age && ` · ${a.patient.age} нас`}
              </p>
              <p>📞 {a.patient.phone}</p>
              {a.symptom && <p className="text-blue-600">💬 {a.symptom}</p>}
            </div>
            <StatusSelect category="hospital" status={a.status} onChange={(s) => changeStatus(a.id, s)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BeautyAppointmentsList({ shopId }: { shopId: string }) {
  const [items, setItems] = useState<BeautyAppointment[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop("beauty", shopId);
    setItems(list as BeautyAppointment[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function changeStatus(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    await refresh();
  }

  const visible = filter === "all" ? items : items.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Гоо сайхны захиалгууд</h3>
        <StatusFilter category="beauty" filter={filter} setFilter={setFilter} />
      </div>
      <div className="px-4 py-4 space-y-3 pb-24">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Захиалга байхгүй байна</p>
        )}
        {visible.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {a.id.slice(0, 14)}
              </span>
              <span className="text-[11px] text-gray-500">{fmtDateTime(a.createdAt)}</span>
            </div>
            <p className="font-bold text-sm text-gray-900">{a.serviceSnapshot.name}</p>
            <p className="text-[11px] text-gray-500 mb-1">
              {a.serviceSnapshot.durationMin} мин · {a.serviceSnapshot.price}
            </p>
            {a.stylistName && (
              <p className="text-[11px] text-gray-500 mb-1">Стилист: {a.stylistName}</p>
            )}
            <p className="text-[12px] text-gray-700 font-semibold mt-1">
              📅 {a.preferredDate} · ⏰ {a.preferredTime}
            </p>
            <div className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-100 space-y-0.5">
              <p>
                <span className="font-bold text-gray-700">Үйлчлүүлэгч:</span> {a.customer.name}
              </p>
              <p>📞 {a.customer.phone}</p>
              {a.notes && <p className="text-pink-600">💬 {a.notes}</p>}
            </div>
            <StatusSelect category="beauty" status={a.status} onChange={(s) => changeStatus(a.id, s)} />
          </div>
        ))}
      </div>
    </div>
  );
}
