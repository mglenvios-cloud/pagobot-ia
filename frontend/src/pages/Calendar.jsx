import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

export default function Calendar() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [año, setAño] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    const inicio = `${año}-${String(mes + 1).padStart(2, '0')}-01`
    const fin = new Date(año, mes + 1, 0).toISOString().split('T')[0]
    supabase.from('pagos').select('*').gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).order('fecha_vencimiento').then(({ data }) => setPagos(data || []))
  }, [mes, año])

  const daysInMonth = new Date(año, mes + 1, 0).getDate()
  const firstDay = new Date(año, mes, 1).getDay()
  const monthName = new Date(año, mes).toLocaleString('es', { month: 'long' })

  const prev = () => { if (mes === 0) { setMes(11); setAño((a) => a - 1) } else setMes((m) => m - 1) }
  const next = () => { if (mes === 11) { setMes(0); setAño((a) => a + 1) } else setMes((m) => m + 1) }

  const getPagosDay = (day) => {
    const date = `${año}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return pagos.filter((p) => p.fecha_vencimiento === date)
  }

  const selectedPagos = selectedDay ? getPagosDay(selectedDay) : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Calendario de Vencimientos</h1>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><HiChevronLeft className="text-xl" /></button>
          <h2 className="text-lg font-bold capitalize">{monthName} {año}</h2>
          <button onClick={next} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><HiChevronRight className="text-xl" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPagos = getPagosDay(day)
            const isToday = day === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()
            const isSelected = selectedDay === day
            const hasVencido = dayPagos.some((p) => !p.pagado && new Date(p.fecha_vencimiento) < new Date())
            const hasPendiente = dayPagos.some((p) => !p.pagado)
            const hasPagado = dayPagos.some((p) => p.pagado)

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all ${
                  isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                  isToday ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                  'hover:bg-gray-100 dark:hover:bg-gray-800'
                } ${hasVencido ? 'text-red-600 dark:text-red-400' : ''}`}
              >
                {day}
                {dayPagos.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {hasPendiente && !hasVencido && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                    {hasPagado && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedPagos.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Pagos del {selectedDay}/{mes + 1}/{año}</h3>
          <div className="space-y-2">
            {selectedPagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <span className="font-medium">{p.concepto}</span>
                  <span className="text-sm text-gray-500 ml-2">{p.categoria}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">${parseFloat(p.monto).toFixed(2)}</span>
                  {p.pagado ? <span className="badge-paid">Pagado</span> : <span className="badge-pending">Pendiente</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-sm text-gray-500 justify-center">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> Vencido</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Pendiente</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> Pagado</span>
      </div>
    </div>
  )
}
