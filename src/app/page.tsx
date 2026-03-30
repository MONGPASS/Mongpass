import TopBar from "@/components/layout/TopBar";
import BannerSlider from "@/components/home/BannerSlider";
import CategoryGrid from "@/components/home/CategoryGrid";
import BottomNav from "@/components/layout/BottomNav";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-background pb-[80px]">
      <TopBar />
      <div className="flex flex-col pt-2">
        <BannerSlider />
        <div className="flex-1 bg-white pt-4 pb-10 min-h-[50vh]">
          <CategoryGrid />
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
