import TopBar from "@/components/layout/TopBar";
import BannerSlider from "@/components/home/BannerSlider";
import CategoryGrid from "@/components/home/CategoryGrid";
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

        {/* Curated/featured shops — visible only when admin has flagged any */}
        <FeaturedShopsSection />

        {/* Newest approved shops — fresh discovery */}
        <NewShopsSection />

        {/* Personalised: shows only if the user has saved any */}
        <FavoritesSection />

        {/* Personalised: re-engagement on return visits */}
        <RecentlyViewedSection />

        <div className="flex-1 bg-white pb-10" />
      </div>
      <BottomNav />
    </main>
  );
}
