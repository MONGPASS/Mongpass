export function FoodServiceTab() {
  const menuCategories = [
    {
      category: "Гол хоол",
      items: [
        { id: 1, name: "Хуушуур (3ш)", desc: "Үхрийн махтай шаржигнуур хуушуур", price: "12,000₩" },
        { id: 2, name: "Бууз (5ш)", desc: "Амтат шүүслэг бууз", price: "10,000₩" },
        { id: 3, name: "Цуйван", desc: "Гараар элдсэн гурилтай цуйван", price: "14,000₩" },
      ]
    },
    {
      category: "Шөл",
      items: [
        { id: 4, name: "Банштай цай", desc: "Борцтой, сүүтэй банштай цай", price: "15,000₩" },
      ]
    }
  ];

  return (
    <div className="bg-white min-h-[50vh] pb-10">
      {menuCategories.map((cat, idx) => (
        <div key={idx} className="mb-6">
          <div className="bg-gray-50 px-5 py-2.5 font-bold text-gray-800 text-xs uppercase tracking-wider sticky top-0 border-y border-gray-100 placeholder-opacity-95 backdrop-blur-md z-10">
            {cat.category}
          </div>
          <div className="px-5 divide-y divide-gray-100">
            {cat.items.map(item => (
              <div key={item.id} className="py-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-[15px] mb-1">{item.name}</h4>
                  <p className="text-[12px] text-gray-500 line-clamp-2 mb-2">{item.desc}</p>
                  <p className="font-bold text-sm text-gray-900">{item.price}</p>
                </div>
                <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold relative overflow-hidden">
                  <span>IMG</span>
                  <button className="absolute bottom-1 right-1 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-primary font-bold shadow-sm shadow-black/10">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
