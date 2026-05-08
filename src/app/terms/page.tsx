import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Terms of Service — required by Google OAuth verification when
// publishing the consent screen to Production.

export const metadata = {
  title: "Үйлчилгээний нөхцөл · MongPass",
  description: "MongPass-ийн үйлчилгээний нөхцөл",
};

export default function TermsPage() {
  return (
    <main className="w-full min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3 max-w-2xl mx-auto">
          <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-base flex-1">Үйлчилгээний нөхцөл</h1>
        </div>
      </header>

      <article className="px-5 py-6 max-w-2xl mx-auto prose prose-sm">
        <p className="text-xs text-gray-500 mb-6">Сүүлд шинэчлэгдсэн: 2026-05-08</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          1. Танилцуулга
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass-ийг ашигласнаар та эдгээр нөхцөлийг хүлээн зөвшөөрсөнд
          тооцогдоно. Хэрэв та зөвшөөрөхгүй бол үйлчилгээг хэрэглэхгүй байна
          уу.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          2. Үйлчилгээний тодорхойлолт
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass нь Солонгос дахь Монгол хэрэглэгчдэд зориулан үйл ажиллагаа
          явуулдаг карго, ресторан, эмнэлэг, гоо сайхан гэх мэт жижиг
          бизнесүүдийг нэг дороос харах, холбогдох боломж олгодог платформ юм.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          3. Хэрэглэгчийн үүрэг
        </h2>
        <ul className="text-sm text-gray-700 leading-relaxed mb-4 list-disc pl-5 space-y-1">
          <li>Үнэн зөв мэдээлэл оруулах</li>
          <li>Бусдын эрхийг хүндэтгэх (доромжлох, заналхийлэх контент хориотой)</li>
          <li>Хууль бус бараа, үйлчилгээ зарлахгүй байх</li>
          <li>Платформоор дамжуулан санхүүгийн залилан үйлдэхгүй байх</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          4. Бизнес эрхлэгчдэд
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Дэлгүүр бүртгүүлэх нь үнэгүй. Та өөрийн бизнесийн талаар үнэн мэдээлэл
          оруулна гэж зөвшөөрнө. Бид баталгаажуулалтын зорилгоор танаас нэмэлт
          мэдээлэл (бизнесийн гэрчилгээ гэх мэт) асууж болно.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          5. Захиалга, төлбөр
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass нь зөвхөн дэлгүүр болон хэрэглэгчийг холбох сүлжээ юм.
          Бодит худалдан авалтын төлбөр хэрэглэгч ба дэлгүүрийн хооронд шууд
          хийгдэх ба MongPass хариуцлага хүлээхгүй. Маргаан гарвал тухайн
          дэлгүүртэй шууд харилцана уу.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          6. Контент
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Та платформд оруулсан агуулга (зураг, текст) дээрх эзэмшлийн эрхээ
          хадгална. Гэхдээ MongPass-д уг агуулгыг үйлчилгээний хүрээнд харуулах,
          хадгалах, түгээх лицензийг олгож буй гэж тооцно.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          7. Үйлчилгээний өөрчлөлт
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Бид үйлчилгээний боломж, нөхцлийг өөрчлөх эрхтэй. Чухал
          өөрчлөлтийн талаар таныг мэдэгдэх болно.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          8. Хариуцлагын хязгаар
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          MongPass нь «байгаагаар нь» (as-is) үйлчилгээ үзүүлнэ. Платформ
          ашиглан гарсан аливаа алдагдлыг бид шууд бусаар хариуцахгүй.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          9. Цуцлах
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Хэрэглэгч хэдийд ч акаунтаа устгах хүсэлт гаргах эрхтэй. Бид мөн
          нөхцлийг зөрчсөн акаунтыг түр зогсоох эсвэл устгах эрхтэй.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">
          10. Холбоо барих
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Асуулт байвал:{" "}
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
