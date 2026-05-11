/**
 * Hospital sub-categories (Эмнэлгийн төрөл) used to power the
 * specialty filter on the /category/hospital list page and the
 * picker in the shop registration / edit forms.
 *
 * Stored on the shop row as a free-text `specialty` column — but the
 * UI restricts the choices to this list so values stay consistent and
 * the tab strip can render predictable labels. If we ever want to
 * support custom specialties, drop the dropdown for a free-text input
 * without changing the schema.
 */

export const HOSPITAL_SPECIALTIES = [
  "Дотрын эмнэлэг",
  "Мэс заслын эмнэлэг",
  "Гэмтэл согогийн эмнэлэг",
  "Мэдрэлийн мэс заслын эмнэлэг",
  "Хүүхдийн эмнэлэг",
  "Эмэгтэйчүүдийн эмнэлэг",
  "Арьсны эмнэлэг",
  "Нүдний эмнэлэг",
  "Чих хамар хоолойн эмнэлэг",
  "Шүдний эмнэлэг",
  "Урологийн эмнэлэг",
  "Сэтгэцийн эмнэлэг",
  "Сэргээн засах эмнэлэг",
  "Яаралтай тусламжийн эмнэлэг",
  "Өрхийн эмнэлэг",
  "Мэдээ алдуулалт өвдөлтийн эмнэлэг",
  "Дүрс оношилгооны эмнэлэг",
  "Эрүүл мэндийн үзлэгийн эмнэлэг",
  "Гоо сайхны эмнэлэг",
] as const;

export type HospitalSpecialty = (typeof HOSPITAL_SPECIALTIES)[number];

export function isHospitalSpecialty(value: string): value is HospitalSpecialty {
  return (HOSPITAL_SPECIALTIES as readonly string[]).includes(value);
}
