'use client';

import { useState } from "react";
import { ShopCategory, ShopData } from "./types";
import { TopNavBar, ShopHeader, ImageGallery, TabMenu, BottomCTA } from "./SharedComponents";
import { HomeTab, InfoTab, ReviewTab, PhotoTab } from "./tabs/CommonTabs";

import { MeatServiceTab } from "./tabs/MeatServiceTab";
import { CargoServiceTab } from "./tabs/CargoServiceTab";
import { HospitalServiceTab } from "./tabs/HospitalServiceTab";
import { BeautyServiceTab } from "./tabs/BeautyServiceTab";
import { CarServiceTab } from "./tabs/CarServiceTab";
import { FoodServiceTab } from "./tabs/FoodServiceTab";
import { TravelServiceTab } from "./tabs/TravelServiceTab";

interface ShopDetailPageProps {
  category: ShopCategory;
  shopData: ShopData;
}

export default function ShopDetailPage({ category, shopData }: ShopDetailPageProps) {
  const [activeTab, setActiveTab] = useState("home");

  let serviceTabName = "Үнэ"; // Changed to '가격' (Price) matching the screenshot for default
  let ctaText = "Захиалах";
  let ServiceTabComponent = () => <div className="p-5 text-gray-400 text-sm font-medium text-center bg-white min-h-[40vh] flex items-center justify-center">Бэлтгэгдэж байна...</div>;

  switch (category) {
    case "meat":
      serviceTabName = "Бараа"; ctaText = "Захиалах"; ServiceTabComponent = MeatServiceTab; break;
    case "cargo":
      serviceTabName = "Үйлчилгээ"; ctaText = "Үнийн санал авах"; ServiceTabComponent = CargoServiceTab; break;
    case "hospital":
      serviceTabName = "Цаг авах"; ctaText = "Цаг захиалах"; ServiceTabComponent = HospitalServiceTab; break;
    case "beauty":
      serviceTabName = "Үйлчилгээ"; ctaText = "Цаг захиалах"; ServiceTabComponent = BeautyServiceTab; break;
    case "car":
      serviceTabName = "Машин"; ctaText = "Зөвлөгөө авах"; ServiceTabComponent = CarServiceTab; break;
    case "food":
    case "restaurant":
      serviceTabName = "Цэс"; ctaText = "Захиалах"; ServiceTabComponent = FoodServiceTab; break;
    case "travel":
      serviceTabName = "Багц"; ctaText = "Судлах"; ServiceTabComponent = TravelServiceTab; break;
    case "other":
      serviceTabName = "Бусад"; ctaText = "Дэлгэрэнгүй"; break;
  }

  return (
    <div className="w-full min-h-screen bg-white pb-[80px] relative">
      <TopNavBar shopId={String(shopData.id)} />
      <ShopHeader shop={shopData} />
      <ImageGallery images={shopData.images} />
      
      <div className="sticky top-[72px] z-40 bg-white border-b border-gray-100">
        <TabMenu 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          serviceTabName={serviceTabName} 
        />
      </div>

      <div className="bg-white min-h-[50vh]">
        {activeTab === "home" && <HomeTab shop={shopData} />}
        {activeTab === "info" && <InfoTab shop={shopData} />}
        {activeTab === "service" && <ServiceTabComponent />}
        {activeTab === "review" && <ReviewTab shop={shopData} />}
        {activeTab === "photo" && <PhotoTab shop={shopData} />}
      </div>

      <BottomCTA text={ctaText} shop={shopData} category={category} />
    </div>
  );
}
