"use client";

import { createContext, useContext } from "react";
import { businessText } from "@/lib/admin/businessMessages";

export const AdminLanguage = createContext<"ko" | "mn">("ko");
const identityText = (text: string) => text;

export function useAdminText() {
  const language = useContext(AdminLanguage);
  return language === "mn" ? businessText : identityText;
}
