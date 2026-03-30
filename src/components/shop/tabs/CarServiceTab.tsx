export function CarServiceTab() {
  const cars = [
    { id: 1, name: "Hyundai Sonata LF", year: "2016", km: "120,000 км", price: "9,500,000₩" },
    { id: 2, name: "Kia K5", year: "2018", km: "85,000 км", price: "14,200,000₩" },
    { id: 3, name: "Hyundai Grandeur IG", year: "2019", km: "60,000 км", price: "22,000,000₩" },
  ];

  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">Зарагдаж буй машинууд</h3>
      <div className="grid gap-4">
        {cars.map(car => (
          <div key={car.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex p-3 gap-3 active:scale-[0.98] transition-transform">
            <div className="w-[100px] h-[80px] bg-gray-200 rounded-xl shrink-0 flex items-center justify-center text-gray-400 text-xs font-bold">IMAGE</div>
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <h4 className="font-bold text-[15px] text-gray-900 truncate mb-1">{car.name}</h4>
              <p className="text-xs text-gray-500 mb-2">{car.year} он • {car.km}</p>
              <p className="text-primary font-bold text-sm">{car.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
