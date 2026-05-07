'use client';

import { ArrowLeft, Check, Utensils, Truck, Stethoscope, CarFront, Phone, Pizza, Briefcase, LayoutGrid, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShopCategory } from "@/components/shop/types";
import { CATEGORY_REGISTRY } from "@/lib/categories";
import { createShop, findShopByOwner } from "@/lib/shopStore";
import { getCurrentUser } from "@/lib/userStore";

const PICKABLE: { slug: ShopCategory; icon: typeof Utensils; bgColor: string; iconColor: string }[] = [
  { slug: "meat",       icon: Utensils,    bgColor: "bg-orange-100", iconColor: "text-orange-500" },
  { slug: "restaurant", icon: Pizza,       bgColor: "bg-cyan-100",   iconColor: "text-cyan-500" },
  { slug: "cargo",      icon: Truck,       bgColor: "bg-blue-100",   iconColor: "text-blue-500" },
  { slug: "hospital",   icon: Stethoscope, bgColor: "bg-purple-100", iconColor: "text-purple-500" },
  { slug: "beauty",     icon: Scissors,    bgColor: "bg-pink-100",   iconColor: "text-pink-500" },
  { slug: "car",        icon: CarFront,    bgColor: "bg-red-100",    iconColor: "text-red-500" },
  { slug: "travel",     icon: Briefcase,   bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
  { slug: "other",      icon: LayoutGrid,  bgColor: "bg-gray-100",   iconColor: "text-gray-500" },
];

export default function ShopRegisterPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login?redirect=/biz/register");
      return;
    }
    // If user already owns a shop, take them straight to /biz
    if (findShopByOwner(user.id)) {
      router.replace("/biz");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  function submit() {
    const user = getCurrentUser();
    if (!user || !category || !name.trim()) return;
    createShop({
      ownerId: user.id,
      category,
      name: name.trim(),
      description: description.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      address: address.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => router.push("/biz"), 800);
  }

  if (!authChecked) {
    return <main className="w-full min-h-screen bg-gray-50" />;
  }

  if (submitted) {
    return (
      <main className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <Check className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Дэлгүүр үүслээ!</h2>
          <p className="text-sm text-gray-500">Удирдлагын самбар руу шилжиж байна...</p>
        </div>
      </main>
    );
  }

  const canSubmit = category !== null && name.trim().length > 0;
  const categoryInfo = category ? CATEGORY_REGISTRY[category] : null;

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Дэлгүүр бүртгэх</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">1. Дэлгүүрийн төрөл</h2>
          <div className="grid grid-cols-2 gap-2">
            {PICKABLE.map(({ slug, icon: Icon, bgColor, iconColor }) => {
              const info = CATEGORY_REGISTRY[slug];
              const active = category === slug;
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setCategory(slug)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${active ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white"}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bgColor}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-gray-900 truncate">{info.label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{info.productLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-900 mb-3">2. Дэлгүүрийн мэдээлэл</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Дэлгүүрийн нэр</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={categoryInfo ? `${categoryInfo.label}ын нэр` : "Манай дэлгүүр"}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Танилцуулга <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дэлгүүрийн талаар товч танилцуулга"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Холбоо барих утас <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="010-xxxx-xxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                Хаяг <span className="font-medium text-gray-400">(заавал биш)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="경기도 안산시 ..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-[480px] mx-auto">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Дэлгүүр үүсгэх
          </button>
        </div>
      </div>
    </main>
  );
}
