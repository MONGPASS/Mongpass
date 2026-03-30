export function TravelServiceTab() {
  const packages = [
    { id: 1, title: "Анжи арал амралт", duration: "2 шөнө 3 өдөр", price: "150,000₩ / хүн" },
    { id: 2, title: "Бусан хотын аялал", duration: "1 шөнө 2 өдөр", price: "90,000₩ / хүн" },
  ];

  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-3">Хүн & Өдөр сонгох</h3>
        <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-200">
          <div className="flex-1 pr-3 border-r border-gray-100">
            <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Явах өдөр</span>
            <div className="text-sm font-semibold text-gray-800">2026.04.15</div>
          </div>
          <div className="flex-1 pl-3">
            <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Хүний тоо</span>
            <div className="text-sm font-semibold text-gray-800">2 хүн</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-3">Аяллын багцууд</h3>
        <div className="grid gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="w-full h-32 bg-indigo-100 rounded-xl mb-3 flex items-center justify-center text-indigo-400 font-bold text-sm">IMAGE</div>
              <h4 className="font-bold text-[15px] text-gray-900 mb-1">{pkg.title}</h4>
              <p className="text-xs text-gray-500 mb-3">{pkg.duration}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{pkg.price}</span>
                <button className="px-4 py-1.5 bg-gray-100 text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-200">Сонгох</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
