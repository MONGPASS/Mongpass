'use client';

import { Check, X, Store, Phone, MapPin, Clock, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shop, ShopStatus, SHOP_STATUS_LABEL, approveShop, loadShops, rejectShop, toggleFeatured } from "@/lib/shopStore";
import { User, findUserById } from "@/lib/userStore";
import { CATEGORY_REGISTRY } from "@/lib/categories";

type Tab = "pending" | "approved" | "rejected";

const STATUS_BG: Record<ShopStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-500",
};

function fmtFull(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    setShops(loadShops());
  }, []);

  function refresh() {
    setShops(loadShops());
  }

  function handleApprove(id: string) {
    approveShop(id);
    refresh();
  }

  function handleToggleFeatured(id: string) {
    toggleFeatured(id);
    refresh();
  }

  function startReject(id: string) {
    setRejectingId(id);
    setRejectReason("");
  }

  function confirmReject() {
    if (!rejectingId || !rejectReason.trim()) return;
    rejectShop(rejectingId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason("");
    refresh();
  }

  const filtered = shops.filter((s) => s.status === tab);
  const counts = {
    pending: shops.filter((s) => s.status === "pending").length,
    approved: shops.filter((s) => s.status === "approved").length,
    rejected: shops.filter((s) => s.status === "rejected").length,
  };

  return (
    <>
      {/* Status sub-tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {(["pending", "approved", "rejected"] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 ${tab === k ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400"}`}
          >
            {SHOP_STATUS_LABEL[k]}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tab === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
              {counts[k]}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Store className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-500">{SHOP_STATUS_LABEL[tab]} төлөвт дэлгүүр байхгүй</p>
          </div>
        )}
        {filtered.map((shop) => (
          <ShopReviewCard
            key={shop.id}
            shop={shop}
            onApprove={() => handleApprove(shop.id)}
            onStartReject={() => startReject(shop.id)}
            onToggleFeatured={() => handleToggleFeatured(shop.id)}
          />
        ))}
      </div>

      {rejectingId && (
        <RejectModal
          reason={rejectReason}
          onChange={setRejectReason}
          onCancel={() => { setRejectingId(null); setRejectReason(""); }}
          onConfirm={confirmReject}
        />
      )}
    </>
  );
}

function ShopReviewCard({
  shop,
  onApprove,
  onStartReject,
  onToggleFeatured,
}: {
  shop: Shop;
  onApprove: () => void;
  onStartReject: () => void;
  onToggleFeatured: () => void;
}) {
  const [owner, setOwner] = useState<User | null>(null);

  useEffect(() => {
    setOwner(findUserById(shop.ownerId));
  }, [shop.ownerId]);

  const categoryLabel = CATEGORY_REGISTRY[shop.category]?.label ?? shop.category;
  const photoCount = shop.images?.length ?? 0;

  // Quick "completeness" hint to help admin assess at a glance
  const filled = [
    shop.description,
    shop.contactPhone,
    shop.address,
    shop.openHours,
    shop.facebook,
    shop.instagram,
  ].filter((v) => v && String(v).trim().length > 0).length;
  const total = 6;
  const completeness = Math.round((filled / total) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg shrink-0 overflow-hidden">
          {shop.images && shop.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            shop.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {categoryLabel}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_BG[shop.status]}`}>
              {SHOP_STATUS_LABEL[shop.status]}
            </span>
          </div>
          <p className="font-bold text-sm text-gray-900 truncate">{shop.name}</p>
          {owner && (
            <p className="text-[11px] text-gray-500">
              Эзэн: <span className="font-semibold text-gray-700">{owner.name}</span>
              {owner.phone && ` · ${owner.phone}`}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-3 text-[12px] text-gray-600">
        {shop.description && (
          <p className="line-clamp-2 leading-relaxed">{shop.description}</p>
        )}
        {shop.contactPhone && (
          <p className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" /> {shop.contactPhone}
          </p>
        )}
        {shop.address && (
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {shop.address}
          </p>
        )}
        {shop.openHours && (
          <p className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" /> {shop.openHours}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-3 text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span>📷 {photoCount} зураг</span>
          <span className={completeness < 50 ? "text-red-500" : completeness < 80 ? "text-yellow-600" : "text-green-600"}>
            {completeness}% бөглөгдсөн
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {fmtFull(shop.createdAt)}
        </span>
      </div>

      {shop.status === "rejected" && shop.rejectionReason && (
        <div className="bg-red-50 rounded-lg p-2 mb-3 text-[11px] text-red-700">
          <span className="font-bold">Татгалзсан шалтгаан:</span> {shop.rejectionReason}
        </div>
      )}

      {shop.reviewedAt && (
        <p className="text-[10px] text-gray-400 mb-2">
          Сүүлд хянасан: {fmtFull(shop.reviewedAt)}
        </p>
      )}

      {/* Featured toggle — only meaningful for approved shops */}
      {shop.status === "approved" && (
        <button
          onClick={onToggleFeatured}
          className={`w-full mb-2 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${shop.featured ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-gray-50 text-gray-600 border border-gray-200"}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {shop.featured ? "Онцолсон — нүүрэнд харагдана" : "Онцлоход тохируулах"}
        </button>
      )}

      {/* Actions: pending → approve/reject; approved → reject; rejected → approve */}
      <div className="flex gap-2">
        <Link
          href={`/category/${shop.category}/${shop.id}`}
          className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg text-[12px] text-center"
        >
          Дэлгэрэнгүй
        </Link>
        {shop.status !== "approved" && (
          <button
            onClick={onApprove}
            className="flex-1 bg-green-500 text-white font-semibold py-2.5 rounded-lg text-[12px] flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Баталгаажуулах
          </button>
        )}
        {shop.status !== "rejected" && (
          <button
            onClick={onStartReject}
            className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-lg text-[12px] flex items-center justify-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Татгалзах
          </button>
        )}
      </div>
    </div>
  );
}

function RejectModal({
  reason,
  onChange,
  onCancel,
  onConfirm,
}: {
  reason: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
        <h2 className="font-bold text-base text-gray-900 mb-1">Татгалзах шалтгаан</h2>
        <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
          Эзэнд харагдах шалтгаанаа бичнэ үү. Тэрээр энэ шалтгаанаар засаад дахин илгээх боломжтой.
        </p>
        <textarea
          value={reason}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Жнь: Зураг бүдэг байна / Нэр зөв оруулна уу / ..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg text-sm"
          >
            Болих
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-40"
          >
            Татгалзах
          </button>
        </div>
      </div>
    </div>
  );
}
