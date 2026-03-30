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

const categories = [
  { slug: "meat", name: "Махны дэлгүүр", icon: Utensils, bgColor: "bg-orange-100", iconColor: "text-orange-500" },
  { slug: "cargo", name: "Карго", icon: Truck, bgColor: "bg-blue-100", iconColor: "text-blue-500" },
  { slug: "hospital", name: "Эмнэлэг", icon: Stethoscope, bgColor: "bg-purple-100", iconColor: "text-purple-500" },
  { slug: "car", name: "Хуучин машин", icon: CarFront, bgColor: "bg-pink-100", iconColor: "text-pink-500" },
  { slug: "phone", name: "Утас дугаар", icon: Phone, bgColor: "bg-green-100", iconColor: "text-green-500" },
  { slug: "restaurant", name: "Хоолны газар", icon: Pizza, bgColor: "bg-cyan-100", iconColor: "text-cyan-500" },
  { slug: "travel", name: "Аялал", icon: Briefcase, bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
  { slug: "other", name: "Бусад", icon: LayoutGrid, bgColor: "bg-gray-100", iconColor: "text-gray-500" },
];

export default function CategoryGrid() {
  return (
    <section className="px-5 pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Ангиллаар хайх</h2>
        <button className="text-sm font-medium text-primary hover:text-primaryHover transition-colors">
          Бүгд
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link href={`/category/${cat.slug}`} key={cat.slug} className="flex flex-col items-center gap-2 group">
              <div className={`w-[68px] h-[68px] rounded-[1.25rem] ${cat.bgColor} flex items-center justify-center transition-transform active:scale-95 group-hover:scale-105`}>
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
