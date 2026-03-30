export function CargoServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh]">
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button className="flex-1 bg-white text-gray-900 font-bold py-2 rounded-lg shadow-sm text-sm">Агаарын (항공)</button>
        <button className="flex-1 text-gray-500 font-medium py-2 text-sm">Газрын (지상)</button>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Чиглэл</label>
          <div className="flex items-center gap-2">
            <input type="text" value="Солонгос (Сөүл)" disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-500 outline-none" />
            <span className="text-gray-400">→</span>
            <input type="text" value="Монгол (УБ)" disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-500 outline-none" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Жин (кг)</label>
            <input type="number" placeholder="0" className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Хэмжээ (см)</label>
            <input type="text" placeholder="Урт x Өргөн" className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
