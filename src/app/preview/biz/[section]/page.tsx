import { notFound } from "next/navigation";
import BusinessOrdersPage from "@/app/biz/orders/page";
import BusinessProfilePage from "@/app/biz/profile/page";
import BusinessReviewsPage from "@/app/biz/reviews/page";
import BusinessChatPage from "@/app/biz/chat/page";
import RestaurantMenuAdminPage from "@/app/biz/menu/page";
import ShopNoticesPage from "@/app/biz/notices/page";
import BusinessMorePage from "@/app/biz/more/page";
import {
  BusinessDemoStore,
  DemoConversation,
} from "@/components/biz/BusinessDemo";

export default function BusinessDemoSection({
  params,
  searchParams,
}: {
  params: { section: string };
  searchParams: { thread?: string };
}) {
  switch (params.section) {
    case "orders":
      return <BusinessOrdersPage />;
    case "profile":
      return <BusinessProfilePage />;
    case "reviews":
      return <BusinessReviewsPage />;
    case "chat":
      return searchParams.thread ? (
        <DemoConversation threadId={searchParams.thread} />
      ) : (
        <BusinessChatPage />
      );
    case "menu":
      return <RestaurantMenuAdminPage />;
    case "notices":
      return <ShopNoticesPage />;
    case "store":
      return <BusinessDemoStore />;
    case "more":
      return <BusinessMorePage />;
    default:
      notFound();
  }
}
