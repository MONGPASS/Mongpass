import { redirect } from "next/navigation";
import BizDashboard from "@/components/biz/BizDashboard";
export const runtime = "edge";
export default function BusinessHomePage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  if (
    searchParams.tab &&
    ["chat", "orders", "profile"].includes(searchParams.tab)
  )
    redirect("/biz/" + searchParams.tab);
  return <BizDashboard />;
}
