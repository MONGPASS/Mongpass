import { ShopCategory } from "@/components/shop/types";

export interface CategoryInfo {
  slug: ShopCategory;
  label: string;
  productLabel: string;
  productCategories: string[];
  /** Dedicated admin page route. If unset, uses /biz inline product tab. */
  adminRoute?: string;
}

export const CATEGORY_REGISTRY: Record<ShopCategory, CategoryInfo> = {
  meat: {
    slug: "meat",
    label: "Махны дэлгүүр",
    productLabel: "Бараа",
    productCategories: ["Үхрийн мах", "Хонины мах", "Гахайн мах", "Тахианы мах", "Бусад хүнс"],
    adminRoute: "/biz/meat",
  },
  restaurant: {
    slug: "restaurant",
    label: "Хоолны газар",
    productLabel: "Цэс",
    productCategories: ["Гол хоол", "Шөл", "Зууш", "Амттан", "Уух зүйл"],
    adminRoute: "/biz/menu",
  },
  food: {
    slug: "food",
    label: "Хоолны газар",
    productLabel: "Цэс",
    productCategories: ["Гол хоол", "Шөл", "Зууш", "Амттан", "Уух зүйл"],
    adminRoute: "/biz/menu",
  },
  cargo: {
    slug: "cargo",
    label: "Карго",
    productLabel: "Чиглэл",
    productCategories: ["Авто карго", "Агаарын карго", "Далайн карго"],
    adminRoute: "/biz/cargo",
  },
  hospital: {
    slug: "hospital",
    label: "Эмнэлэг",
    productLabel: "Эмч",
    productCategories: ["Үзлэг", "Шинжилгээ", "Эмчилгээ"],
    adminRoute: "/biz/hospital",
  },
  beauty: {
    slug: "beauty",
    label: "Гоо сайхан",
    productLabel: "Үйлчилгээ",
    productCategories: ["Үс засалт", "Маникюр", "Нүүрний арчилгаа"],
    adminRoute: "/biz/beauty",
  },
  car: {
    slug: "car",
    label: "Хуучин машин",
    productLabel: "Машин",
    productCategories: ["Седан", "SUV", "Ачааны машин"],
    adminRoute: "/biz/car",
  },
  travel: {
    slug: "travel",
    label: "Аялал",
    productLabel: "Багц",
    productCategories: ["Дотоод аялал", "Гадаад аялал", "Виз"],
    adminRoute: "/biz/travel",
  },
  other: {
    slug: "other",
    label: "Бусад",
    productLabel: "Бараа/Үйлчилгээ",
    productCategories: ["Бусад"],
  },
};

export function getCategoryInfo(slug: ShopCategory): CategoryInfo {
  return CATEGORY_REGISTRY[slug] ?? CATEGORY_REGISTRY.other;
}
