'use client';

import { ArrowLeft, Share2, Menu, AlertCircle, Edit3, ShoppingBag, Camera, Home, PlusSquare, MessageCircle, Settings, X } from "lucide-react";
import { parseTimestamp } from "@/lib/datetime";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { getCategoryInfo } from "@/lib/categories";
import { ShopCategory } from "@/components/shop/types";
import { BeautyAppointment, CargoOrder, HospitalAppointment, MeatOrder, ORDER_STATUS_LABEL, OrderStatus, RestaurantOrder, TravelBooking, formatPrice, getStatusFlow, getStatusLabel, loadBizPendingOrderCount, loadOrdersByShop, updateOrderStatus } from "@/lib/orderStore";
import { Shop, findShopByOwner, isShopOpen, toggleOpen, updateShop } from "@/lib/shopStore";
import { HOSPITAL_SPECIALTIES } from "@/lib/hospitalSpecialties";
import { getCurrentUser } from "@/lib/userStore";
import { BizChatThreadList } from "@/components/biz/BizChatThreadList";
import { r2Url, uploadImage } from "@/lib/images/upload";

const CATEGORY_HAS_DEDICATED_ORDERS_UI: ShopCategory[] = ["cargo", "restaurant", "food", "hospital", "beauty", "meat", "travel"];

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
  // Count of "pending" orders across all shops the owner runs. Drives
  // both the red badge on the Захиалга tab and the alert banner on
  // the Нүүр home tab. Polled every 8s while the page is open so a
  // newly-placed order surfaces without a manual refresh.
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
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
      setSpecialty(shop.specialty ?? "");
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

  // Poll the pending-order count so a customer placing an order while
  // the owner is on /biz lights up the red badge within ~8s. The
  // Захиалга lists also refresh themselves when their tab is visible,
  // so this keeps the cross-tab badge in sync without coupling.
  useEffect(() => {
    if (!authChecked || !currentShop) return;
    let active = true;
    const refresh = () => {
      loadBizPendingOrderCount().then((n) => {
        if (active) setPendingOrderCount(n);
      });
    };
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authChecked, currentShop]);

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the FileList into a real array BEFORE clearing the input.
    // The FileList is a live reference to e.target.files; setting
    // e.target.value = "" empties it, which would silently leave us
    // looping over zero files.
    const fileList = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (fileList.length === 0 || !currentShop) return;
    setUploading(true);
    let failCount = 0;
    try {
      for (const file of fileList) {
        const uploaded = await uploadImage(file, "shop");
        if (!uploaded) {
          failCount++;
          continue;
        }
        const res = await fetch(
          `/api/shops/${encodeURIComponent(currentShop.id)}/images`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ r2Key: uploaded.key }),
          },
        );
        if (res.ok) {
          setShopImages((prev) => [...prev, uploaded.key]);
        } else {
          const body = await res.text().catch(() => "");
          console.error("shop_images POST failed:", res.status, body);
          failCount++;
        }
      }
    } finally {
      setUploading(false);
      if (failCount > 0) {
        alert(`Зураг оруулахад алдаа гарлаа (${failCount} файл амжилтгүй). Browser console-оос дэлгэрэнгүй мэдээллийг харна уу.`);
      }
    }
  };

  const removeImage = async (index: number) => {
    if (!currentShop) return;
    const key = shopImages[index];
    if (!key) return;
    const res = await fetch(
      `/api/shops/${encodeURIComponent(currentShop.id)}/images/${encodeURIComponent(key)}`,
      { method: "DELETE", credentials: "same-origin" },
    );
    if (res.ok) {
      setShopImages((prev) => prev.filter((_, i) => i !== index));
    }
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
  // Hospital sub-category (Эмнэлгийн төрөл) — only meaningful when
  // the shop's category === "hospital". Drives the customer-side
  // /category/hospital tab filter.
  const [specialty, setSpecialty] = useState<string>("");

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
      // Only PATCH specialty for hospital shops; for any other category
      // the server clamps it to NULL anyway, so don't even send it.
      ...(currentShop.category === "hospital"
        ? { specialty: specialty.trim() || null }
        : {}),
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
    /* Desktop shell — only kicks in at lg+. `lg:fixed lg:inset-0` lets
       the page break out of the customer-app .mobile-container (480px
       max-width) and use the full viewport, mirroring the admin shell.
       On mobile this stays a normal-flow div with bottom-nav padding. */
    <div className="w-full min-h-screen bg-gray-50 relative pb-20 lg:pb-0 lg:fixed lg:inset-0 lg:z-40 lg:flex lg:overflow-hidden">
      {/* PC sidebar — replaces the mobile bottom nav at lg+. */}
      <BizSidebar
        currentShop={currentShop}
        shopCategoryInfo={shopCategoryInfo}
        activeTab={activeTab}
        isEditingProfile={isEditingProfile}
        pendingOrderCount={pendingOrderCount}
        onSelectTab={(t) => { setIsEditingProfile(false); setActiveTab(t); }}
        onEditProfile={() => { setIsEditingProfile(true); setActiveTab("Нүүр"); }}
        onProductsClick={() => {
          setIsEditingProfile(false);
          if (shopCategoryInfo.adminRoute) {
            router.push(shopCategoryInfo.adminRoute);
          } else {
            setActiveTab("Бүтээгдэхүүн");
          }
        }}
        onNoticesClick={() => router.push("/biz/notices")}
        onToggleOpen={async () => {
          const next = await toggleOpen(currentShop.id);
          if (next) setCurrentShop(next);
        }}
      />

      {/* Right-pane scroll container on desktop; on mobile this is a
          static div whose children render the existing layout. */}
      <div className="lg:flex-1 lg:min-w-0 lg:overflow-auto">
        <div className="lg:max-w-5xl lg:mx-auto">

      {/* Top Bar — mobile only. The desktop sidebar replaces it. */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
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

      {/* Approval status banner.
          Each variant ends with a primary action button so a freshly-
          registered owner doesn't have to hunt for the Засах tab in
          the bottom nav. Clicking the button enters edit mode in
          place — same as tapping "Засах" at the bottom. */}
      {currentShop.status === "pending" && !isEditingProfile && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <p className="text-[13px] font-bold text-yellow-800 mb-0.5">
            ⏳ Хүлээгдэж буй — Удахгүй баталгаажна
          </p>
          <p className="text-[11px] text-yellow-700 leading-relaxed mb-2.5">
            Таны дэлгүүр одоогоор хэрэглэгчдэд харагдахгүй байна. Дэлгүүрийн мэдээллээ бүрэн
            оруулсан байх тусам баталгаажуулалт хурдан болно.
          </p>
          <button
            onClick={() => { setIsEditingProfile(true); setActiveTab("Нүүр"); }}
            className="inline-flex items-center gap-1.5 bg-yellow-800 text-white text-[12px] font-bold px-3.5 py-2 rounded-lg active:scale-[0.98] transition-transform"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Профайл бөглөх →
          </button>
        </div>
      )}
      {currentShop.status === "rejected" && !isEditingProfile && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-[13px] font-bold text-red-800 mb-0.5">
            ❌ Татгалзсан
          </p>
          {currentShop.rejectionReason && (
            <p className="text-[11px] text-red-700 leading-relaxed mb-1">
              <span className="font-bold">Шалтгаан:</span> {currentShop.rejectionReason}
            </p>
          )}
          <p className="text-[11px] text-red-700 leading-relaxed mb-2.5">
            Засах хэсгээс мэдээллээ засаад дахин хадгална уу — автоматаар шинэ баталгаажуулалтын
            хүсэлт үүсэх болно.
          </p>
          <button
            onClick={() => { setIsEditingProfile(true); setActiveTab("Нүүр"); }}
            className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[12px] font-bold px-3.5 py-2 rounded-lg active:scale-[0.98] transition-transform"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Профайл засах →
          </button>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                    {shopImages.map((key, i) => (
                      <div key={key} className="relative shrink-0 w-[100px] h-[100px] rounded-xl overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r2Url(key)} alt={`shop-${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
                          aria-label="Зураг устгах"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    {shopImages.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="shrink-0 w-[100px] h-[100px] bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Camera size={22} strokeWidth={1.5} />
                        <span className="text-[11px] font-medium">
                          {uploading ? "..." : "Зураг +"}
                        </span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Зургийг WebP-д хувиргаж, 1600px хүртэл багасгана. Хамгийн ихдээ 10 зураг.
                  </p>
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

                {/* Эмнэлгийн төрөл — only for hospital category. */}
                {currentShop.category === "hospital" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-gray-700">
                      Эмнэлгийн төрөл <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-800"
                    >
                      <option value="">— Сонгоно уу —</option>
                      {HOSPITAL_SPECIALTIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

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
              <div className="space-y-2">
                {/* New-order alert — surfaces above everything else on
                    the Нүүр tab whenever there's at least one pending
                    order. Clicking jumps straight to the Захиалга tab
                    so the owner can act on it. */}
                {pendingOrderCount > 0 && (
                  <button
                    onClick={() => setActiveTab("Захиалга")}
                    className="w-full mt-2 bg-red-50 border-y border-red-200 px-5 py-3 flex items-center gap-3 active:bg-red-100 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                      {pendingOrderCount > 99 ? "99+" : pendingOrderCount}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] text-red-700">
                        Шинэ захиалга хүлээгдэж байна
                      </p>
                      <p className="text-[12px] text-red-600">
                        Хариу үйлдэл хүлээж буй захиалгууд байна. Үзэх →
                      </p>
                    </div>
                  </button>
                )}

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
        {!isEditingProfile && activeTab === "Захиалга" && currentShop.category === "meat" && (
          <MeatOrdersList shopId={currentShop.id} />
        )}
        {!isEditingProfile && activeTab === "Захиалга" && currentShop.category === "travel" && (
          <TravelBookingsList shopId={currentShop.id} />
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

      {/* Close the desktop right-pane wrapper opened above. */}
        </div>
      </div>

      {/* Admin Bottom Nav — mobile only. The PC sidebar provides the
          same navigation at lg+. */}
      <div className="lg:hidden fixed bottom-0 w-full max-w-[480px] bg-white border-t border-gray-200 pb-safe z-50">
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
            className={`relative flex flex-col items-center justify-center min-w-[55px] h-full gap-1 transition-colors ${activeTab === 'Захиалга' && !isEditingProfile ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <span className="relative">
              <ShoppingBag size={21} strokeWidth={activeTab === 'Захиалга' && !isEditingProfile ? 2.5 : 2} />
              {pendingOrderCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white"
                  aria-label={`${pendingOrderCount} шинэ захиалга`}
                >
                  {pendingOrderCount > 9 ? "9+" : pendingOrderCount}
                </span>
              )}
            </span>
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

/**
 * Desktop sidebar for /biz. Mirrors the mobile bottom-nav buttons +
 * adds richer header content (logo, shop card with category badge +
 * open/closed toggle) that there's no room for on a 480px-wide phone
 * layout. Hidden under lg.
 */
function BizSidebar({
  currentShop,
  shopCategoryInfo,
  activeTab,
  isEditingProfile,
  pendingOrderCount,
  onSelectTab,
  onEditProfile,
  onProductsClick,
  onNoticesClick,
  onToggleOpen,
}: {
  currentShop: Shop;
  shopCategoryInfo: { label: string; productLabel: string; adminRoute?: string };
  activeTab: string;
  isEditingProfile: boolean;
  pendingOrderCount: number;
  onSelectTab: (tab: string) => void;
  onEditProfile: () => void;
  onProductsClick: () => void;
  onNoticesClick: () => void;
  onToggleOpen: () => void;
}) {
  const cover = currentShop.images?.[0];
  const NavItem = ({
    icon: Icon,
    label,
    active,
    badge,
    onClick,
  }: {
    icon: React.ElementType;
    label: string;
    active: boolean;
    badge?: number;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <span className="relative">
        <Icon className="w-4 h-4" />
        {badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-gray-900">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">
            M
          </div>
          <span className="font-black text-lg tracking-tight">mongpass</span>
        </Link>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-3">
          Бизнес удирдлага
        </p>
      </div>

      {/* Shop card — cover + name + category + status pill. */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 font-bold">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r2Url(cover)} alt="" className="w-full h-full object-cover" />
            ) : (
              currentShop.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{currentShop.name}</p>
            <p className="text-[11px] text-gray-500">{shopCategoryInfo.label}</p>
          </div>
        </div>
        <button
          onClick={onToggleOpen}
          className={`w-full flex items-center justify-center gap-1.5 text-[11px] font-bold px-2.5 py-2 rounded-lg border transition-colors ${
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

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem
          icon={Home}
          label="Нүүр"
          active={!isEditingProfile && activeTab === "Нүүр"}
          onClick={() => onSelectTab("Нүүр")}
        />
        <NavItem
          icon={MessageCircle}
          label="Чат"
          active={!isEditingProfile && activeTab === "Чат"}
          onClick={() => onSelectTab("Чат")}
        />
        <NavItem
          icon={ShoppingBag}
          label="Захиалга"
          active={!isEditingProfile && activeTab === "Захиалга"}
          badge={pendingOrderCount}
          onClick={() => onSelectTab("Захиалга")}
        />
        <NavItem
          icon={PlusSquare}
          label={`${shopCategoryInfo.productLabel} оруулах`}
          active={!isEditingProfile && activeTab === "Бүтээгдэхүүн"}
          onClick={onProductsClick}
        />
        <NavItem
          icon={Edit3}
          label="Мэдээ удирдах"
          active={false}
          onClick={onNoticesClick}
        />
      </nav>

      <div className="border-t border-gray-100 p-3">
        <NavItem
          icon={Settings}
          label="Дэлгүүр засах"
          active={isEditingProfile}
          onClick={onEditProfile}
        />
      </div>
    </aside>
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
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
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
          const created = parseTimestamp(order.createdAt);
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
  const d = parseTimestamp(iso);
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
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
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

/**
 * Meat shop order list — bank-transfer flow. The owner sees the
 * customer's contact info, what they ordered, and the total they owe;
 * "Хүлээн авсан" status here means the deposit has been confirmed.
 */
function MeatOrdersList({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<MeatOrder[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop("meat", shopId);
    setOrders(list as MeatOrder[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
    await refresh();
  }

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Махны захиалгууд</h3>
        <StatusFilter category="meat" filter={filter} setFilter={setFilter} />
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
                <div key={it.productId} className="flex justify-between text-[12px]">
                  <span className="text-gray-700 min-w-0 truncate">
                    {it.name} <span className="text-gray-400">×{it.qty}</span>
                  </span>
                  <span className="text-gray-500 shrink-0 ml-2">{it.price}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 text-[12px]">
                <span className="text-gray-500">Барааны дүн</span>
                <span className="text-gray-700">{formatPrice(order.subtotalAmount)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Хүргэлт</span>
                  <span className="text-gray-700">{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="font-bold text-gray-900">Нийт төлөх</span>
                <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
            <div className="text-[11px] text-gray-500 space-y-0.5">
              <p>📞 {order.customer.phone}</p>
              <p className="truncate" title={order.customer.address}>
                📍 {order.customer.address}
              </p>
              {order.notes && <p className="text-primary mt-1">💬 {order.notes}</p>}
            </div>
            <StatusSelect category="meat" status={order.status} onChange={(s) => changeStatus(order.id, s)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Travel agency bookings — package title + headcount + preferred
 * date are what the owner needs to act on. The full package detail
 * is one click away on the customer side; here we keep the row
 * compact.
 */
function TravelBookingsList({ shopId }: { shopId: string }) {
  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  async function refresh() {
    const list = await loadOrdersByShop("travel", shopId);
    setBookings(list as TravelBooking[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function changeStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
    await refresh();
  }

  const visible = filter === "all" ? bookings : bookings.filter((o) => o.status === filter);

  return (
    <div className="bg-gray-50 mt-2 min-h-screen">
      <div className="bg-white p-5 border-y border-gray-100">
        <h3 className="font-bold text-gray-900 text-[16px] mb-3">Аяллын захиалгууд</h3>
        <StatusFilter category="travel" filter={filter} setFilter={setFilter} />
      </div>

      <div className="px-4 py-4 space-y-3 pb-24">
        {visible.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Захиалга байхгүй байна</p>
        )}
        {visible.map((order) => {
          const total = order.travelers.adults + order.travelers.children;
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {order.id.slice(0, 14)}
                </span>
                <span className="text-[11px] text-gray-500">{fmtDateTime(order.createdAt)}</span>
              </div>
              <p className="font-bold text-sm text-gray-900 mb-0.5">{order.packageSnapshot.title}</p>
              {order.packageSnapshot.price && (
                <p className="text-[12px] text-primary font-bold mb-2">{order.packageSnapshot.price}</p>
              )}
              <div className="space-y-1 text-[12px] text-gray-700 mb-2">
                <p>
                  <span className="text-gray-400">Хүн:</span>{" "}
                  <span className="font-semibold">
                    {total} ({order.travelers.adults} том, {order.travelers.children} хүүхэд)
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Хүссэн огноо:</span>{" "}
                  <span className="font-semibold">{order.preferredDate}</span>
                </p>
              </div>
              <div className="text-[11px] text-gray-500 space-y-0.5">
                <p>👤 {order.customer.name}</p>
                <p>📞 {order.customer.phone}</p>
                {order.customer.email && <p>✉️ {order.customer.email}</p>}
                {order.notes && <p className="text-primary mt-1">💬 {order.notes}</p>}
              </div>
              <StatusSelect category="travel" status={order.status} onChange={(s) => changeStatus(order.id, s)} />
            </div>
          );
        })}
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
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
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
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
      alert("Төлвийг солих үед алдаа гарлаа. Дахин оролдоно уу.");
    }
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
