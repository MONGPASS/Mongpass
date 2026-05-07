'use client';

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profile";

  // Server-side OAuth flow — clicking the button hits a Route Handler
  // that sets state/PKCE cookies and 302s the user to Google.
  const signInHref = `/api/auth/google?redirect=${encodeURIComponent(redirect)}`;

  return (
    <main className="w-full min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Нэвтрэх</h1>
        </div>
      </header>

      <div className="px-6 pt-12 pb-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary text-white font-black text-3xl flex items-center justify-center mx-auto mb-5 shadow-md">
          M
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">MongPass-д тавтай морил</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Google акaунтаараа хурдан нэвтрэн орох боломжтой. Утасны дугаар, нууц үг шаардлагагүй.
        </p>

        <a
          href={signInHref}
          className="w-full inline-flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 font-semibold py-3 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
        >
          <GoogleLogo />
          <span>Google-ээр нэвтрэх</span>
        </a>

        <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
          Нэвтрэснээр та манай{" "}
          <Link href="/" className="underline">үйлчилгээний нөхцөл</Link>-ийг
          хүлээн зөвшөөрсөнд тооцогдоно.
        </p>
      </div>
    </main>
  );
}

function GoogleLogo() {
  // Simple Google "G" SVG — keeps us free of an extra dependency just for an icon.
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.8 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.4 4 9.8 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.1-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.1 5.2C40.3 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
