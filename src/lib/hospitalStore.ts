export interface Doctor {
  id: string;
  name: string;
  department: string;     // e.g. "Дотор", "Шүд"
  specialty?: string;     // e.g. "Зүрх судас"
  bio?: string;
  imageDataUrl?: string;
}

const STORAGE_KEY = "mongpass:hospital:doctors:v1";

export const HOSPITAL_DEPARTMENTS = [
  "Дотор",
  "Шүд",
  "Эмэгтэйчүүд",
  "Хүүхэд",
  "Арьс гоо",
  "Нүд",
  "Бусад",
];

export const defaultDoctors: Doctor[] = [
  {
    id: "doc-seed-1",
    name: "Доктор Б. Цэцэгмаа",
    department: "Дотор",
    specialty: "Зүрх судас",
    bio: "10 жилийн туршлагатай.",
  },
  {
    id: "doc-seed-2",
    name: "Доктор Д. Энхбаяр",
    department: "Шүд",
    specialty: "Шүдний эмчилгээ, протез",
  },
];

export function loadDoctors(): Doctor[] {
  if (typeof window === "undefined") return defaultDoctors;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDoctors;
    const parsed = JSON.parse(raw) as Doctor[];
    return Array.isArray(parsed) ? parsed : defaultDoctors;
  } catch {
    return defaultDoctors;
  }
}

export function saveDoctors(doctors: Doctor[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
}

export function newDoctorId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
