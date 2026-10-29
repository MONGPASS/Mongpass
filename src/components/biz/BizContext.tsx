"use client";

import { createContext, useContext } from "react";
import type { Shop } from "@/lib/shopStore";
import type { User } from "@/lib/userStore";
import type { adminFetch } from "@/lib/admin/types";
import type { uploadImage } from "@/lib/images/upload";
import type { BusinessOverview } from "@/lib/admin/business";

export const BizContext = createContext<{
  shop: Shop;
  user: User;
  refresh: () => Promise<void>;
  preview?: boolean;
  request?: typeof adminFetch;
  upload?: typeof uploadImage;
  overview?: BusinessOverview;
} | null>(null);
export function useBusiness() {
  const context = useContext(BizContext);
  if (!context) throw new Error("Business context is missing");
  return context;
}
