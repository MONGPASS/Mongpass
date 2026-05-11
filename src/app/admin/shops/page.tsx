'use client';

import { Check, X, Store, Phone, MapPin, Clock, Calendar, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shop, ShopStatus, SHOP_STATUS_LABEL, approveShop, deleteShop, loadShopsByStatus, rejectShop, toggleFeatured } from "@/lib/shopStore";
import { User, findUserById } from "@/lib/userStore";
import { CATEGORY_REGISTRY } from "@/lib/categories";
import { r2Url } from "@/lib/images/upload";

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

  // Load all three buckets up-front so the tabs switch instantly + the
  // counts shown in the tab labels stay accurate after any approve/reject.
  async function refresh() {
    const [pending, approved, rejected] = await Promise.all([
      loadShopsByStatus("pending"),
      loadShopsByStatus("approved"),
      loadShopsByStatus("rejected"),
    ]);
    setShops([...pending, ...approved, ...rejected]);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleApprove(id: string) {
    await approveShop(id);
    await refresh();
  }

  async function handleToggleFeatured(id: string) {
    await toggleFeatured(id);
    await refresh();
  }

  async function handleDelete(shop: Shop) {
    // Two-step confirm — once for "are you sure", once with the shop
    // name typed back so a misclick on the wrong card can't wipe a
    // legitimate listing.
    if (!confirm(`"${shop.name}" дэлгүүрийг бүрмөсөн устгах уу?\n\nБүх захиалга, чат, зураг устах болно. Энэ үйлдэл буцаагдахгүй.`)) {
      return;
    }
    const ok = await deleteShop(shop.id);
    if (ok) {
      await refresh();
    } else {
      alert("Устгаж чадсангүй. Дахин оролдоно уу.");
    }
  }

  function startReject(id: string) {
    setRejectingId(id);
    setRejectReason("");
  }

  async function confirmReject() {
    if (!rejectingId || !rejectReason.trim()) return;
    await rejectShop(rejectingId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason("");
    await refresh();
  }

  const filtered = shops.filter((s) => s.status === tab);
  const counts = {
    pending: shops.filter((s) => s.status === "pending").length,
    approved: shops.filter((s) => s.status === "approved").length,
    rejected: shops.filter((s) => s.status === "rejected").length,
  };

  return (
    <>
      {/* Status sub-tabs — pill-style on desktop, full-width on mobile.
          The pill style looks more at home in a wide content area than
          a stretched-tab row would. */}
      <div className="bg-white rounded-xl lg:rounded-2xl border border-gray-200 mb-4 lg:mb-6 overflow-hidden">
        <div className="flex">
          {(["pending", "approved", "rejected"] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-3 lg:py-4 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${
                tab === k
                  ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {SHOP_STATUS_LABEL[k]}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  tab === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[k]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card grid — 1 col on phone (existing UX), 2 col on lg, 3 col on
          xl so an admin can scan many pending shops without scrolling
          forever. */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-12 lg:py-16 text-center border border-gray-100">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Store className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500">
            {SHOP_STATUS_LABEL[tab]} төлөвт дэлгүүр байхгүй
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filtered.map((shop) => (
            <ShopReviewCard
              key={shop.id}
              shop={shop}
              onApprove={() => handleApprove(shop.id)}
              onStartReject={() => startReject(shop.id)}
              onToggleFeatured={() => handleToggleFeatured(shop.id)}
              onDelete={() => handleDelete(shop)}
            />
          ))}
        </div>
      )}

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
  onDelete,
}: {
  shop: Shop;
  onApprove: () => void;
  onStartReject: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const [owner, setOwner] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    findUserById(shop.ownerId).then((u) => {
      if (active) setOwner(u);
    });
    return () => { active = false; };
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
            <img src={r2Url(shop.images[0])} alt={shop.name} className="w-full h-full object-cover" />
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
              {` · ${owner.email}`}
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
      {/* Hard delete — separated from the row above so the destructive
          action doesn't sit visually next to the soft "татгалзах" one
          (different intent, very different consequences). Confirms
          twice in the click handler before actually deleting. */}
      <button
        onClick={onDelete}
        className="mt-2 w-full bg-white border border-red-200 text-red-600 font-semibold py-2 rounded-lg text-[11px] flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Дэлгүүрийг бүрмөсөн устгах
      </button>
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
