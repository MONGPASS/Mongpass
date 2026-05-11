/**
 * Canonical lists for the structured fields on the car-listing form.
 *
 * Storing values as plain strings (vs. enums) lets owners write
 * "Бусад" / typo fixes / future additions without breaking older
 * rows — the dropdowns are UX scaffolding, not a strict contract.
 */

/** Common brands in the Mongolian/Korean used-car market. */
export const CAR_BRANDS = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Subaru",
  "Suzuki",
  "Mitsubishi",
  "Lexus",
  "Hyundai",
  "Kia",
  "Genesis",
  "Daewoo",
  "SsangYong",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volkswagen",
  "Porsche",
  "Land Rover",
  "Volvo",
  "Mini",
  "Ford",
  "Chevrolet",
  "Tesla",
  "Geely",
  "BYD",
  "Chery",
  "Бусад",
] as const;

export const TRANSMISSION_OPTIONS = ["Автомат", "Механик", "Хагас автомат", "CVT"] as const;
export const STEERING_OPTIONS = ["Зөв (баруун)", "Буруу (зүүн)"] as const;
export const BODY_TYPE_OPTIONS = [
  "Седан",
  "Хэтчбэк",
  "Жийп / SUV",
  "Кросс-овер",
  "Универсал",
  "Купе",
  "Минивэн",
  "Пикап",
  "Ачааны тэрэг",
  "Бусад",
] as const;
export const ENGINE_TYPE_OPTIONS = [
  "Бензин",
  "Дизель",
  "Гибрид",
  "Plug-in гибрид",
  "Цахилгаан",
  "Хийн",
] as const;
export const DRIVE_OPTIONS = [
  "Урд",
  "Хойд",
  "Бүх дугуй (AWD)",
  "Бүх дугуй (4WD)",
] as const;
export const DOOR_OPTIONS = ["2", "3", "4", "5"] as const;
