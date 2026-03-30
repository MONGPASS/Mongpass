export function BeautyServiceTab() {
  const menus = [
    { id: 1, name: "Эрэгтэй үс засах", time: "30 мин", price: "15,000₩" },
    { id: 2, name: "Эмэгтэй үс засах", time: "45 мин", price: "20,000₩" },
    { id: 3, name: "Үс будах", time: "120 мин", price: "60,000₩" },
  ];

  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-6">
      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-sm">Үйлчилгээ сонгох</h3>
        <div className="space-y-3">
          {menus.map(menu => (
            <label key={menu.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl active:bg-blue-50 transition-colors">
              <div className="flex items-center gap-3">
                <input type="radio" name="beauty_menu" className="w-5 h-5 text-primary focus:ring-primary" />
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{menu.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{menu.time}</p>
                </div>
              </div>
              <span className="font-bold text-gray-900 text-sm">{menu.price}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-gray-900 mb-3 text-sm">Стилист сонгох (Сонголттой)</h3>
        <div className="flex gap-4 overflow-x-auto hide-scroll pb-2">
          {['Амараа', 'Сараа', 'Болдоо'].map((name, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-full bg-gray-200 border-2 ${i===0 ? 'border-primary' : 'border-transparent'}`}></div>
              <span className="text-xs font-semibold text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
