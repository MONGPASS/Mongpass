'use client';

import { ArrowLeft, ChevronRight, Plus, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { User, loadUsers, loginOrSignup, setCurrentUser } from "@/lib/userStore";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profile";

  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<"select" | "create">("select");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const all = loadUsers();
    setUsers(all);
    if (all.length === 0) setMode("create");
  }, []);

  function pickUser(id: string) {
    setCurrentUser(id);
    router.push(redirect);
  }

  function submitNew() {
    if (!name.trim()) return;
    loginOrSignup(name, phone || undefined);
    router.push(redirect);
  }

  return (
    <main className="w-full min-h-screen bg-gray-50 pb-12">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Нэвтрэх</h1>
        </div>
      </header>

      <div className="px-4 pt-6">
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Нэрээ оруулан үргэлжлүүлнэ үү. Хэрэв нэр бүртгэлд байхгүй бол шинээр үүсгэгдэнэ.
        </p>

        {mode === "select" && users.length > 0 && (
          <>
            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Хадгалсан хэрэглэгчид
            </h2>
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100 mb-4">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => pickUser(u.id)}
                  className="w-full flex items-center gap-3 p-4 active:bg-gray-50 text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{u.name}</p>
                    {u.phone && <p className="text-[12px] text-gray-500 truncate">{u.phone}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode("create")}
              className="w-full bg-white border border-dashed border-gray-300 text-gray-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:bg-gray-50"
            >
              <Plus className="w-4 h-4" /> Шинэ хэрэглэгч
            </button>
          </>
        )}

        {mode === "create" && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-900 mb-3">
              {users.length === 0 ? "Хэрэглэгч үүсгэх" : "Шинэ хэрэглэгч"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">Нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Болд"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">
                  Утас <span className="font-medium text-gray-400">(заавал биш)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-xxxx-xxxx"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <button
                onClick={submitNew}
                disabled={!name.trim()}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40"
              >
                Үргэлжлүүлэх
              </button>
              {users.length > 0 && (
                <button
                  onClick={() => setMode("select")}
                  className="w-full text-gray-500 text-sm font-medium py-2"
                >
                  Буцах
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
