export default function BannerSlider() {
  const banners = [
    {
      id: 1,
      badge: "20% Хямдрал",
      title: "Улаанбаатар руу ачаа тээвэр",
      desc: "Баталгаат карго үйлчилгээ",
      bgFrom: "from-blue-600",
      bgTo: "to-indigo-800",
    },
    {
      id: 2,
      badge: "Шинэ",
      title: "Онлайн эмнэлгийн цаг авалт",
      desc: "Хүлээгдэлгүй үйлчилгээ",
      bgFrom: "from-purple-500",
      bgTo: "to-fuchsia-700",
    },
    {
      id: 3,
      badge: "Онцлох",
      title: "Хямд нислэгүүд",
      desc: "Солонгос - Монгол чиглэл",
      bgFrom: "from-orange-400",
      bgTo: "to-red-500",
    }
  ];

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
          <div 
            key={banner.id} 
            className={`relative min-w-[85%] h-40 bg-gradient-to-r ${banner.bgFrom} ${banner.bgTo} rounded-2xl overflow-hidden shadow-md shrink-0 snap-center`}
          >
            {/* Mock background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
            </div>
            
            <div className="relative h-full flex flex-col justify-center p-6 text-white text-left">
              <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-[11px] font-bold rounded-md backdrop-blur-sm w-max mb-3">
                {banner.badge}
              </span>
              <h2 className="text-lg font-bold leading-tight mb-1">{banner.title}</h2>
              <p className="text-white/80 text-xs font-medium">{banner.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
