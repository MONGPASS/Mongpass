export function MeatServiceTab() {
  const parts = [
    { id: 1, name: "Хонины мах (Цул)", price: "24,000₩ / 1kg" },
    { id: 2, name: "Үхрийн мах (Ястай)", price: "28,000₩ / 1kg" },
    { id: 3, name: "Ямааны мах", price: "22,000₩ / 1kg" },
  ];

  return (
    <div className="p-5 bg-gray-50 min-h-[50vh] space-y-4">
      <h3 className="font-bold text-gray-900 mb-2">Мах сонгох</h3>
      {parts.map(part => (
        <div key={part.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-800 text-sm">{part.name}</h4>
            <p className="text-primary font-bold mt-1 text-sm">{part.price}</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold bg-white rounded shadow-sm">-</button>
            <span className="w-6 text-center text-sm font-semibold">1</span>
            <button className="w-8 h-8 flex items-center justify-center text-gray-900 font-bold bg-white rounded shadow-sm">+</button>
          </div>
        </div>
      ))}
    </div>
  );
}
