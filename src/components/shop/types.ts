export type ShopCategory = "meat" | "cargo" | "hospital" | "beauty" | "car" | "food" | "restaurant" | "travel" | "other";

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
  /** Owner-controlled. False means currently closed; undefined or true means open. */
  isOpen?: boolean;
  /**
   * Approval state — drives the "verified" badge and any owner-facing
   * banner that explains pending review. Public visitors only ever see
   * approved shops (the API hides pending/rejected from non-owners).
   */
  status?: "pending" | "approved" | "rejected";
  // This can be extended with category-specific data
  description?: string;
  menu?: Record<string, unknown>[];
  services?: Record<string, unknown>[];
  vehicles?: Record<string, unknown>[];
  packages?: Record<string, unknown>[];
}
