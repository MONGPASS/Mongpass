export function HospitalServiceTab() {
  return (
    <div className="p-5 bg-white min-h-[50vh] space-y-6">
      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-3">Тасаг сонгох</h4>
        <div className="grid grid-cols-2 gap-2">
          {['Дотор', 'Шүд', 'Эмэгтэйчүүд', 'Арьс гоо засал'].map((dept, i) => (
            <button key={i} className={`p-3 text-sm font-medium rounded-xl border ${i===0 ? 'border-primary text-primary bg-blue-50/50' : 'border-gray-200 text-gray-600'}`}>
              {dept}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-3">Өдөр сонгох</h4>
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-2">
          {['12 ДАВ', '13 МЯГ', '14 ЛХА', '15 ПҮР', '16 БАА'].map((day, i) => (
            <button key={i} className={`flex-col flex items-center justify-center w-[60px] h-[72px] rounded-2xl shrink-0 border ${i===1 ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-600'}`}>
              <span className="text-[10px] font-semibold opacity-80">{day.split(' ')[1]}</span>
              <span className="text-lg font-bold">{day.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-3">Цаг сонгох</h4>
        <div className="flex flex-wrap gap-2">
          {['09:00', '10:30', '11:00', '14:00', '15:30', '16:00'].map((time, i) => (
            <button key={i} className={`px-4 py-2 text-[13px] font-bold rounded-lg ${i===2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-2">Зовиур бичих (Сонголттой)</h4>
        <textarea rows={3} placeholder="Ямар зовиуртай байгаагаа бичнэ үү..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary resize-none" />
      </div>
    </div>
  );
}
