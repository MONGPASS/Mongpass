import Link from "next/link";
import { LayoutGrid } from "lucide-react";

/**
 * Each category renders inside a 68×68 #f6f6f6 tile (the tile itself
 * is the canvas; the artwork brings the colour).
 *
 * imgSrc → custom illustration in /public/icons/<slug>.png. Drop a
 * new file at /public/icons/<slug>.png to replace any tile without
 * touching this component. The lucide fallback below covers the
 * "no image yet" case so a missing file degrades gracefully instead
 * of showing a broken-image sprite — currently every category has
 * artwork, but the safety net stays.
 */
const categories: Array<{
  slug: string;
  name: string;
  imgSrc?: string;
}> = [
  { slug: "meat",       name: "Махны дэлгүүр", imgSrc: "/icons/meat.png" },
  { slug: "cargo",      name: "Карго",          imgSrc: "/icons/cargo.png" },
  { slug: "hospital",   name: "Эмнэлэг",        imgSrc: "/icons/hospital.png" },
  { slug: "car",        name: "Хуучин машин",   imgSrc: "/icons/car.png" },
  { slug: "phone",      name: "Утас дугаар",    imgSrc: "/icons/phone.png" },
  { slug: "restaurant", name: "Хоолны газар",   imgSrc: "/icons/restaurant.png" },
  { slug: "travel",     name: "Аялал",          imgSrc: "/icons/travel.png" },
  { slug: "other",      name: "Бусад",          imgSrc: "/icons/other.png" },
];

export default function CategoryGrid() {
  return (
    <section className="px-5 pb-10">
      <h2 className="text-lg font-bold text-foreground mb-4">Ангиллаар хайх</h2>

      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {categories.map((cat) => (
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
                <LayoutGrid size={28} strokeWidth={2.5} className="text-gray-500" />
              )}
            </div>
            <span className="text-[12px] font-medium text-gray-700 text-center leading-snug w-full px-1 break-words">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
