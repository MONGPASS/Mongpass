import ShopDetailPage from "@/components/shop/ShopDetailPage";
import { ShopCategory, ShopData } from "@/components/shop/types";

// Mock database fetching based on standard structure
export default function CategoryItemPage({ params }: { params: { slug: string, shopId: string } }) {
  // Coerce slug to matching category type
  const category = (params.slug as ShopCategory) || "other";

  const mockShop: ShopData = {
    id: params.shopId,
    name: "Жишээ Дэлгүүр / Эмнэлэг",
    images: ["/hero", "/gallery1"],
    rating: 4.8,
    reviews: 128,
    address: "Сөүл хот, Тусгай дүүрэг, 12-3",
    openHours: "Даваа - Баасан: 09:00 - 18:00",
    phone: "010-1234-5678",
    facebook: "https://facebook.com/mongpass",
    instagram: "https://instagram.com/mongpass_kr",
    isLiked: true,
    description: "Монголчууддаа зориулсан найдвартай, баталгаатай үйлчилгээ.",
    notices: [
      {
        id: 1,
        title: "Шинэ жилийн урамшуулал эхэллээ!",
        date: "2026.11.15",
        content: "Бүх үйлчилгээндээ 20% хямдрал зарлаж байна. Та амжиж үйлчлүүлээрэй."
      },
      {
        id: 2,
        title: "Цагийн хуваарьт өөрчлөлт орлоо",
        date: "2026.04.10",
        content: "Даваа гаригт амарч, Ням гаригт хэвийн ажиллахаар боллоо."
      }
    ]
  };

  return <ShopDetailPage category={category} shopData={mockShop} />;
}
