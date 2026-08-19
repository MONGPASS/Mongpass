import Link from "next/link";
import { LayoutGrid, Scissors } from "lucide-react";

/**
 * Each category renders inside a 68×68 #f6f6f6 tile (the tile itself
 * is the canvas; the artwork brings the colour).
 *
 * imgSrc → custom illustration in /public/icons/<slug>.png. Drop a
 * new file at /public/icons/<slug>.png to replace any tile without
 * touching this component. A slug with no PNG yet falls back to the
 * lucide icon named in `fallbackIcon` (tinted via `fallbackTint`), and
 * failing that to a generic grid glyph — so a missing file degrades
 * gracefully instead of showing a broken-image sprite.
 *
 * Every slug here must be a real `ShopCategory` that owners can
 * register under (see /biz/register); a tile pointing at a category
 * nobody can join is a guaranteed empty list.
 */
const categories: Array<{
  slug: string;
  name: string;
  imgSrc?: string;
  fallbackIcon?: typeof Scissors;
  fallbackTint?: string;
}> = [
  { slug: "meat",       name: "Махны дэлгүүр", imgSrc: "/icons/meat.png" },
  { slug: "cargo",      name: "Карго",          imgSrc: "/icons/cargo.png" },
  { slug: "hospital",   name: "Эмнэлэг",        imgSrc: "/icons/hospital.png" },
  { slug: "car",        name: "Хуучин машин",   imgSrc: "/icons/car.png" },
  // No beauty.png yet — mirrors the Scissors fallback used on the
  // shop-registration picker so the two grids stay recognisable.
  { slug: "beauty",     name: "Гоо сайхан",     fallbackIcon: Scissors, fallbackTint: "text-pink-500" },
  { slug: "restaurant", name: "Хоолны газар",   imgSrc: "/icons/restaurant.png" },
  { slug: "travel",     name: "Аялал",          imgSrc: "/icons/travel.png" },
  { slug: "other",      name: "Бусад",          imgSrc: "/icons/other.png" },
];

export default function CategoryGrid() {
  return (
    <section className="px-5 pb-10">
      <h2 className="text-lg font-bold text-foreground mb-4">Ангиллаар хайх</h2>

      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {categories.map((cat) => {
          const FallbackIcon = cat.fallbackIcon ?? LayoutGrid;
          return (
            <Link
              href={`/category/${cat.slug}`}
              key={cat.slug}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-[68px] h-[68px] rounded-[1.25rem] bg-[#f6f6f6] flex items-center justify-center transition-transform active:scale-95 group-hover:scale-105 overflow-hidden">
                {cat.imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imgSrc}
                    alt={cat.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <FallbackIcon
                    size={28}
                    strokeWidth={2.5}
                    className={cat.fallbackTint ?? "text-gray-500"}
                  />
                )}
              </div>
              <span className="text-[12px] font-medium text-gray-700 text-center leading-snug w-full px-1 break-words">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
