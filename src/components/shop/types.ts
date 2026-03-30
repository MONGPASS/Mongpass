export type ShopCategory = "meat" | "cargo" | "hospital" | "beauty" | "car" | "food" | "travel" | "other";

export interface ShopData {
  id: string | number;
  name: string;
  images: string[];
  rating: number;
  reviews: number;
  address: string;
  openHours: string;
  phone: string;
  isLiked?: boolean;
  facebook?: string;
  instagram?: string;
  notices?: { id: number; title: string; date: string; content: string }[];
  // This can be extended with category-specific data
  description?: string;
  menu?: Record<string, unknown>[];
  services?: Record<string, unknown>[];
  vehicles?: Record<string, unknown>[];
  packages?: Record<string, unknown>[];
}
