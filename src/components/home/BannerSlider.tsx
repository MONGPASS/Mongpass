'use client';

import { useEffect, useState } from "react";
import { BANNER_GRADIENTS, Banner, defaultBanners, loadBanners } from "@/lib/bannerStore";

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>(defaultBanners);

  useEffect(() => {
    setBanners(loadBanners());
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="mb-8 pt-2 overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        .hide-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scroll px-5 gap-4 pb-4">
        {banners.map((banner) => {
          const grad = BANNER_GRADIENTS[banner.gradient];
          return (
            <div
              key={banner.id}
              className={`relative min-w-[85%] h-40 bg-gradient-to-r ${grad.from} ${grad.to} rounded-2xl overflow-hidden shadow-md shrink-0 snap-center`}
            >
              {banner.imageDataUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageDataUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Dark overlay so text stays legible on bright photos */}
                  <div className="absolute inset-0 bg-black/35" />
                </>
              ) : (
                <div className="absolute inset-0 opacity-20">
                  <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
                </div>
              )}
              <div className="relative h-full flex flex-col justify-center p-6 text-white text-left">
                <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[11px] font-bold rounded-md backdrop-blur-sm w-max mb-3">
                  {banner.badge}
                </span>
                <h2 className="text-lg font-bold leading-tight mb-1 drop-shadow-sm">{banner.title}</h2>
                <p className="text-white/90 text-xs font-medium drop-shadow-sm">{banner.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
