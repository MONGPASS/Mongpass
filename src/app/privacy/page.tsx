import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Privacy policy page — required by Google OAuth verification when
// publishing the consent screen to Production. Plain Mongolian text
// covering the data we actually collect and what we do with it.

export const metadata = {
  title: "Нууцлалын бодлого · MongPass",
  description: "MongPass-ийн нууцлалын бодлого",
};

export default function PrivacyPage() {
  return (
    <main className="w-full min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3 max-w-2xl mx-auto">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Нууцлалын бодлого</h1>
        </div>
      </header>

      <article className="px-5 py-6 max-w-2xl mx-auto prose prose-sm">
        <p className="text-xs text-gray-500 mb-6">Сүүлд шинэчлэгдсэн: 2026-05-08</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          1. Танилцуулга
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass («бид», «манай») нь Солонгост амьдарч буй Монгол хэрэглэгчдэд
          зориулсан бизнес платформ юм. Энэхүү бодлого нь бид ямар мэдээлэл
          цуглуулж, хэрхэн ашиглаж, хамгаалдгийг тайлбарлана.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          2. Цуглуулдаг мэдээлэл
        </h2>
        <ul className="text-sm text-gray-700 leading-relaxed mb-4 list-disc pl-5 space-y-1">
          <li>
            <b>Google акаунтын мэдээлэл:</b> нэр, имэйл, профайл зураг (Google
            OAuth-ээр нэвтрэх үед).
          </li>
          <li>
            <b>Дэлгүүр / захиалгын мэдээлэл:</b> та өөрөө оруулсан дэлгүүрийн нэр,
            хаяг, утас, бараа/үйлчилгээ, захиалгын дэлгэрэнгүй.
          </li>
          <li>
            <b>Хэрэглээний өгөгдөл:</b> үзсэн дэлгүүр, хадгалсан дэлгүүр,
            мэдэгдэл уншсан хугацаа.
          </li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          3. Мэдээллийн ашиглалт
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Бид цуглуулсан мэдээллийг зөвхөн дараах зорилгоор ашиглана:
          үйлчилгээ үзүүлэх (нэвтрэлт, захиалга), дэлгүүрүүдийг танд харуулах,
          захиалгын төлөв танд мэдэгдэх, аюулгүй байдлыг хангах.
          <b> Бид таны мэдээллийг гуравдагч этгээдэд зарж тарааж огт өгөхгүй.</b>
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          4. Мэдээллийн хадгалалт
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Хэрэглэгчийн өгөгдлийг Cloudflare D1 (Solonggos / Япон хадгалалт) дээр
          хадгална. Зургийг Cloudflare R2 дээр хадгална. Нууц түлхүүрүүд (
          сесс токен) нь шифрлэгдсэн хэлбэрээр хадгалагдана.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          5. Хэрэглэгчийн эрх
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Та хүссэн үедээ дараах эрхтэй:
        </p>
        <ul className="text-sm text-gray-700 leading-relaxed mb-4 list-disc pl-5 space-y-1">
          <li>Өөрийн өгөгдлөө харах, засах</li>
          <li>Акаунтаа устгах хүсэлт гаргах</li>
          <li>Мэдэгдлийг идэвхгүй болгох</li>
        </ul>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Эдгээрийн талаар асуух зүйл байвал манай дэмжлэгийн имэйл рүү (
          доорхи холбоо барих хэсэгт) бичнэ үү.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          6. Хүүхэд хамгаалал
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass нь 13-аас доош насныханд зориулагдаагүй. Бид мэдсээр байж
          энэ насны хүүхдийн мэдээллийг цуглуулдаггүй.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          7. Бодлогын өөрчлөлт
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Энэхүү бодлогыг шинэчлэх боломжтой. Чухал өөрчлөлтийн талаар
          таныг урьдчилан мэдэгдэнэ.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          8. Холбоо барих
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Асуулт, гомдол байвал:{" "}
          <a
            href="mailto:tulgamaidar3@gmail.com"
            className="text-blue-600 underline"
          >
            tulgamaidar3@gmail.com
          </a>
        </p>
      </article>
    </main>
  );
}
