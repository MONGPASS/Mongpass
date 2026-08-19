'use client';

import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { parseTimestamp } from "@/lib/datetime";

/**
 * Admin user directory + ban controls. The `banned` column existed
 * since the first migration, but flipping it required a manual SQL
 * session — meaning in practice nobody ever got banned. Search-first:
 * moderation starts from a name/email seen in a report or a shop.
 */

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  banned: boolean;
  bannedReason?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async (query: string) => {
    const res = await fetch(
      `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { users: AdminUser[] };
    setUsers(data.users);
    setLoaded(true);
  }, []);

  // Debounced live search — 300ms after the last keystroke.
  useEffect(() => {
    const t = setTimeout(() => refresh(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q, refresh]);

  async function setBanned(u: AdminUser, banned: boolean) {
    if (busyId) return;
    let reason: string | undefined;
    if (banned) {
      const input = window.prompt(
        `${u.name} (${u.email}) хэрэглэгчийг хориглох шалтгаан:`,
        "",
      );
      if (input === null) return; // cancelled
      reason = input.trim() || undefined;
    } else if (!window.confirm(`${u.name}-н хоригийг цуцлах уу?`)) {
      return;
    }
    setBusyId(u.id);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.id)}/ban`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, reason }),
      });
      if (!res.ok) {
        alert("Алдаа гарлаа. Дахин оролдоно уу.");
        return;
      }
      await refresh(q.trim());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Хэрэглэгчид</h1>
      <p className="text-[13px] text-gray-500 mb-5">
        Нэр эсвэл имэйлээр хайж, зөрчилтэй хэрэглэгчийг хориглоно.
        Хориглогдсон хэрэглэгч тэр даруй гарч, дахин нэвтэрч чадахгүй.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Нэр / имэйлээр хайх..."
          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm"
        />
      </div>

      {!loaded ? (
        <p className="text-sm text-gray-400 py-8 text-center">Уншиж байна...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Хэрэглэгч олдсонгүй
        </p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                {u.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
                  {u.role === "admin" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" /> админ
                    </span>
                  )}
                  {u.banned && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      хориглогдсон
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 truncate">{u.email}</p>
                {u.banned && u.bannedReason && (
                  <p className="text-[11px] text-red-500 truncate">
                    Шалтгаан: {u.bannedReason}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-gray-400 shrink-0 hidden sm:block">
                {parseTimestamp(u.createdAt).toLocaleDateString("mn-MN")}
              </span>
              {u.role !== "admin" && (
                <button
                  onClick={() => setBanned(u, !u.banned)}
                  disabled={busyId === u.id}
                  className={`shrink-0 flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    u.banned
                      ? "border-gray-200 text-gray-600 bg-white"
                      : "border-red-200 text-red-600 bg-red-50"
                  }`}
                >
                  {u.banned ? (
                    <>
                      <Undo2 className="w-3.5 h-3.5" /> Сэргээх
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" /> Хориглох
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
