import Link from "next/link";
import { 
  Utensils, 
  Truck, 
  Stethoscope, 
  CarFront, 
  Phone, 
  Pizza, 
  Briefcase, 
  LayoutGrid 
} from "lucide-react";

// All category tiles share the same #f6f6f6 background. The icon
// itself supplies the colour, so the grid reads as a uniform set
// rather than a rainbow of pastel chips. Easier to swap to custom
// imagery later — the tile becomes the canvas, the artwork brings
// the personality.
const categories = [
  { slug: "meat", name: "Махны дэлгүүр", icon: Utensils, iconColor: "text-orange-500" },
  { slug: "cargo", name: "Карго", icon: Truck, iconColor: "text-blue-500" },
  { slug: "hospital", name: "Эмнэлэг", icon: Stethoscope, iconColor: "text-purple-500" },
  { slug: "car", name: "Хуучин машин", icon: CarFront, iconColor: "text-pink-500" },
  { slug: "phone", name: "Утас дугаар", icon: Phone, iconColor: "text-green-500" },
  { slug: "restaurant", name: "Хоолны газар", icon: Pizza, iconColor: "text-cyan-500" },
  { slug: "travel", name: "Аялал", icon: Briefcase, iconColor: "text-yellow-600" },
  { slug: "other", name: "Бусад", icon: LayoutGrid, iconColor: "text-gray-500" },
];

export default function CategoryGrid() {
  return (
    <section className="px-5 pb-10">
      {/* The "Бүгд" right-side button used to live here but had no
          handler — pure UI noise. Re-add as a Link when the category
          count outgrows the 8-tile grid. */}
      <h2 className="text-lg font-bold text-foreground mb-4">Ангиллаар хайх</h2>

      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link href={`/category/${cat.slug}`} key={cat.slug} className="flex flex-col items-center gap-2 group">
              <div className="w-[68px] h-[68px] rounded-[1.25rem] bg-[#f6f6f6] flex items-center justify-center transition-transform active:scale-95 group-hover:scale-105">
                <Icon size={28} strokeWidth={2.5} className={cat.iconColor} />
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
