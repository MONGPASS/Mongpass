'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { BANNER_GRADIENTS, Banner, defaultBanners, loadBanners } from "@/lib/bannerStore";
import { r2Url } from "@/lib/images/upload";

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>(defaultBanners);

  useEffect(() => {
    let active = true;
    loadBanners().then((list) => {
      if (active) setBanners(list);
    });
    return () => { active = false; };
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
        {banners.map((banner) => (
          <BannerTile key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}

function BannerTile({ banner }: { banner: Banner }) {
  const grad = BANNER_GRADIENTS[banner.gradient];
  const hasText = !!(banner.badge || banner.title || banner.desc);

  // Shared visual content — same JSX whether the tile is clickable
  // or not, so we don't duplicate the gradient / overlay / text
  // logic across two branches.
  const inner = (
    <>
      {banner.imageR2Key ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r2Url(banner.imageR2Key)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay only when there's text to keep
              legible — image-only banners stay clean. */}
          {hasText && <div className="absolute inset-0 bg-black/35" />}
        </>
      ) : (
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
        </div>
      )}
      {hasText && (
        <div className="relative h-full flex flex-col justify-center p-6 text-white text-left">
          {banner.badge && (
            <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[11px] font-bold rounded-md backdrop-blur-sm w-max mb-3">
              {banner.badge}
            </span>
          )}
          {banner.title && (
            <h2 className="text-lg font-bold leading-tight mb-1 drop-shadow-sm">
              {banner.title}
            </h2>
          )}
          {banner.desc && (
            <p className="text-white/90 text-xs font-medium drop-shadow-sm">
              {banner.desc}
            </p>
          )}
        </div>
      )}
    </>
  );

  const className = `relative min-w-[85%] h-40 bg-gradient-to-r ${grad.from} ${grad.to} rounded-2xl overflow-hidden shadow-md shrink-0 snap-center block active:scale-[0.99] transition-transform`;

  // No linkUrl → plain div, exactly the previous behaviour.
  if (!banner.linkUrl) {
    return <div className={className.replace(" block", "").replace(" active:scale-[0.99] transition-transform", "")}>{inner}</div>;
  }

  // Internal route → Next.js Link for client-side navigation.
  // External http(s) → <a> with target=_blank + rel=noopener so a
  // hijacked partner page can't access window.opener.
  const isExternal = banner.linkUrl.startsWith("http://") || banner.linkUrl.startsWith("https://");
  if (isExternal) {
    return (
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={banner.linkUrl} className={className}>
      {inner}
    </Link>
  );
}
