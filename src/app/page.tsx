import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BannerSlider from "@/components/home/BannerSlider";
import CategoryGrid from "@/components/home/CategoryGrid";
import NewsSection from "@/components/home/NewsSection";
import {
  FavoritesSection,
  FeaturedShopsSection,
  NewShopsSection,
  RecentlyViewedSection,
} from "@/components/home/HomeShopSections";
import BottomNav from "@/components/layout/BottomNav";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-background pb-[80px]">
      <TopBar />
      <div className="flex flex-col pt-2">
        <BannerSlider />

        {/* Categories first — primary navigation for new visitors */}
        <div className="bg-white pt-4">
          <CategoryGrid />
        </div>

        {/* Editorial news feed — admin-managed at /admin/news.
            Hides itself when no articles exist, so this block is
            invisible on a fresh install. */}
        <NewsSection />

        {/* Curated/featured shops — visible only when admin has flagged any */}
        <FeaturedShopsSection />

        {/* Newest approved shops — fresh discovery */}
        <NewShopsSection />

        {/* Personalised: shows only if the user has saved any */}
        <FavoritesSection />

        {/* Personalised: re-engagement on return visits */}
        <RecentlyViewedSection />

        {/* Footer — Google OAuth requires a privacy/terms link on the
            production homepage; users also expect the basics here. */}
        <footer className="bg-white pt-8 pb-10 px-5 text-center border-t border-gray-100">
          <p className="text-[11px] text-gray-400 mb-3">
            © {new Date().getFullYear()} MongPass. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <nav className="flex items-center justify-center gap-4 text-[12px] font-medium">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
              Нууцлалын бодлого
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700">
              Үйлчилгээний нөхцөл
            </Link>
            <span className="text-gray-300">·</span>
            <a
              href="mailto:tulgamaidar3@gmail.com"
              className="text-gray-500 hover:text-gray-700"
            >
              Холбогдох
            </a>
          </nav>
        </footer>
      </div>
      <BottomNav />
    </main>
  );
}
